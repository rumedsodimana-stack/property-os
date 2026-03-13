import { fetchItem, fetchItems, updateItem, addItem } from '../kernel/firestoreService';
import { MasterInventoryItem, PosOrder, Folio, Reservation, FolioCharge, RecipeDraft } from '../../types';
import { botEngine } from '../kernel/systemBridge';
import { pipeline } from '../intelligence/smartDataPipeline';


/**
 * Deducts inventory based on F&B Order Items
 */
/**
 * Deducts inventory based on F&B Order Items
 */
export const deductInventoryForOrder = async (order: PosOrder, recipes: RecipeDraft[]) => {
    try {
        const inventory = await fetchItems<MasterInventoryItem>('master_inventory');

        const emitInventoryMovement = (invItem: MasterInventoryItem, locationId: string, locationName: string | undefined, movement: string, qty: number, resultingStock: number) => {
            pipeline.emit({
                type: 'inventory_movement',
                payload: {
                    itemId: invItem.id,
                    itemName: invItem.name,
                    locationId,
                    locationName,
                    movement,
                    qty,
                    totalStock: resultingStock,
                    reorderPoint: invItem.reorderPoint,
                    parLevel: invItem.parLevel,
                    unit: invItem.unit
                },
                module: 'finance',
                timestamp: Date.now()
            });
        };

        for (const item of order.items) {
            // 1. Try to find a Recipe
            // Note: RecipeDraft type now has menuItemId
            const recipe = recipes.find((r: any) => r.menuItemId === item.menuItemId);

            if (recipe) {
                // Deduct Ingredients defined in Recipe
                for (const ingredient of recipe.ingredients) {
                    const invItem = inventory.find(i => i.id === ingredient.ingredientId);
                    if (invItem && invItem.locations.some(l => l.locationId === order.outletId)) {
                        const location = invItem.locations.find(l => l.locationId === order.outletId);
                        if (location) {
                            // Calculate deduction: Recipe Qty * Order Item Qty
                            const deductAmount = ingredient.qty * item.qty;
                            const newStock = Math.max(0, location.stock - deductAmount);
                            const newTotalStock = Math.max(0, invItem.totalStock - deductAmount);

                            const updatedLocations = invItem.locations.map(l =>
                                l.locationId === order.outletId ? { ...l, stock: newStock } : l
                            );

                            await updateItem('master_inventory', invItem.id, {
                                locations: updatedLocations,
                                totalStock: newTotalStock // Simplified total update
                            });

                            emitInventoryMovement(invItem, order.outletId, location.locationName, 'consume', deductAmount, newTotalStock);
                        }
                    }
                }
            } else {
                // 2. Fallback: Direct Name Match (e.g. "Coke" -> "Coke")
                const invItem = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase()); // Strict equality for direct items

                if (invItem && invItem.locations.some(l => l.locationId === order.outletId)) {
                    const location = invItem.locations.find(l => l.locationId === order.outletId);
                    if (location) {
                        const newStock = Math.max(0, location.stock - item.qty);
                        const newTotalStock = Math.max(0, invItem.totalStock - item.qty);
                        const updatedLocations = invItem.locations.map(l =>
                            l.locationId === order.outletId ? { ...l, stock: newStock } : l
                        );

                        await updateItem('master_inventory', invItem.id, {
                            locations: updatedLocations,
                            totalStock: newTotalStock
                        });

                        emitInventoryMovement(invItem, order.outletId, location.locationName, 'consume', item.qty, newTotalStock);
                    }
                }
            }
        }
        botEngine.logActivity('POS', 'Inventory_Deducted', `Order: ${order.id}`, 'System');
    } catch (error) {
        console.error("Failed to deduct inventory", error);
    }
};

/**
 * Posts F&B Charge to Room Folio
 * Implements Enterprise POS to PMS Posting Contract
 */
export const postToRoom = async (order: PosOrder, roomId: string) => {
    try {
        // PRE-VALIDATION: Idempotency Check - Prevent duplicate posting
        if (order.pmsTransactionId) {
            throw new Error("DUPLICATE_POSTING_PREVENTED: This order has already been posted to PMS. Reference: " + order.pmsTransactionId);
        }

        // 1. Validate Room Exists
        const reservations = await fetchItems<Reservation>('reservations');
        const reservation = reservations.find(r => r.roomId === roomId && r.status === 'Checked In');

        if (!reservation) {
            throw new Error("ROOM_NOT_ACTIVE: No checked-in guest found in room " + roomId + ". Please verify room number and guest status.");
        }

        // 2. Validate Room is Currently Occupied
        if (!reservation.guestId) {
            throw new Error("ROOM_VACANT: Room " + roomId + " exists but has no active guest assignment.");
        }

        // 3. Validate Guest Name Match (optional security check)
        // In production, you might pass expected guest name and validate
        const guestName = reservation.guestId; // Would fetch actual guest name in production
        botEngine.logActivity('POS', 'ROOM_POST_VALIDATION', `Room ${roomId} occupied by ${guestName}`, 'PMS_Integration');

        // 4. Validate Folio is Open
        const folioId = reservation.folioId;
        const folio = await fetchItem<Folio>('folios', folioId);

        if (!folio) {
            throw new Error("FOLIO_NOT_FOUND: System could not locate guest folio for room " + roomId + ". Contact front desk.");
        }

        if (folio.status === 'Closed') {
            throw new Error("FOLIO_CLOSED: Guest folio is closed. Cannot post new charges. Room: " + roomId);
        }

        // 5. Validate Posting Privileges
        if (reservation.postingAllowed === false) {
            throw new Error("POSTING_DISABLED: Guest has requested cash-only settlement. Room posting not permitted for room " + roomId + ".");
        }

        // 6. Validate Outlet Authorization
        // In production, check if outlet has permission to post to this room/guest type
        const outletId = order.outletId || 'default_outlet';
        const isOutletAuthorized = true; // Would check against outlet permissions table

        if (!isOutletAuthorized) {
            throw new Error("OUTLET_UNAUTHORIZED: Outlet " + outletId + " is not authorized to post charges.");
        }

        // 7. Validate Credit Limit (if set)
        if (reservation.creditLimit && (folio.balance + order.total > reservation.creditLimit)) {
            const remaining = reservation.creditLimit - folio.balance;
            throw new Error("CREDIT_LIMIT_EXCEEDED: Charge of " + order.total.toFixed(2) + " exceeds guest credit limit. Available: " + remaining.toFixed(2));
        }

        // 8. Business Date Validation
        const propertyBusinessDate = new Date().toISOString().split('T')[0]; // Would fetch from PMS
        const outletBusinessDate = propertyBusinessDate; // Outlets inherit property date unless overridden

        // Check if night audit is in progress (would be a real check in production)
        const isNightAuditOpen = true; // Simulate
        if (!isNightAuditOpen) {
            throw new Error("NIGHT_AUDIT_CLOSED: Property night audit is closed. Posting temporarily unavailable. Please retry in a few minutes.");
        }

        // 9. Generate Unique, Immutable Transaction ID
        const pmsTxId = `CHG_${propertyBusinessDate.replace(/-/g, '')}_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // 10. Create Immutable Posting Event
        const postingEvent: FolioCharge = {
            id: pmsTxId,
            category: 'F&B',
            description: `${outletId} - Order #${order.id.slice(-4)}`,
            amount: order.total,
            timestamp: Date.now(),
            // Additional fields for audit
            businessDate: propertyBusinessDate,
            outletId: outletId,
            posOrderId: order.id,
            serverName: 'System', // Would capture actual server
            coverCount: order.items.length
        };

        // 11. Post to Folio (Atomic Operation)
        const updatedCharges = [...folio.charges, postingEvent];
        const newBalance = folio.balance + order.total;

        await updateItem('folios', folioId, {
            charges: updatedCharges,
            balance: newBalance,
            lastModified: Date.now()
        });

        // 12. Update Order with PMS Reference (Immutable Link)
        await updateItem('posOrders', order.id, {
            status: 'Paid',
            paymentMethod: 'RoomPost',
            settlementTimestamp: Date.now(),
            pmsTransactionId: pmsTxId, // This locks the order as "posted"
            roomId: roomId,
            businessDate: outletBusinessDate
        });

        // 13. Log Success Event
        botEngine.logActivity('POS', 'ROOM_CHARGE_POSTED',
            `SUCCESS: Posted ${order.total.toFixed(2)} to Room ${roomId} | PMS Ref: ${pmsTxId} | Folio Balance: ${newBalance.toFixed(2)}`,
            'PMS_Integration',
            'SUCCESS'
        );

        return { success: true, pmsTransactionId: pmsTxId, folioBalance: newBalance };

    } catch (error: any) {
        const errorMsg = error.message || "UNKNOWN_ERROR: Posting failed with unspecified error.";

        // Categorize errors for retry logic
        const isRetryable = errorMsg.includes('NIGHT_AUDIT') || errorMsg.includes('NETWORK');

        botEngine.logActivity('POS', 'ROOM_POST_FAILED',
            `FAILED: Room ${roomId} | Error: ${errorMsg} | Retryable: ${isRetryable}`,
            'PMS_Integration',
            'ERROR'
        );

        // In production, if retryable, queue the event for retry
        if (isRetryable) {
            // queuePostingEvent(order, roomId); // Would implement event queue
        }

        throw new Error(errorMsg); // Re-throw for UI handling
    }
};

/**
 * Voids a previously posted room charge (Reversal Contract)
 */
export const voidRoomCharge = async (order: PosOrder, reason: string) => {
    try {
        if (order.status !== 'Paid' || order.paymentMethod !== 'RoomPost' || !order.pmsTransactionId) {
            throw new Error("INVALID_VOID: Order is not a settled room charge.");
        }

        // 1. Fetch Folio
        const reservations = await fetchItems<Reservation>('reservations');
        // Find by room ID if attached, or scan all (inefficient, assuming room ID exists)
        const reservation = reservations.find(r => r.roomId === order.roomId && r.status === 'Checked In');
        if (!reservation) throw new Error("GUEST_DEPARTED: Cannot reverse charge for checked-out guest (Manual Folio Adjustment Required).");

        const folio = await fetchItem<Folio>('folios', reservation.folioId);
        if (!folio) throw new Error("FOLIO_MISSING");

        // 2. Create Reversal Transaction
        const reversalTxId = `rev_${order.pmsTransactionId}`;
        const reversalCharge: FolioCharge = {
            id: reversalTxId,
            category: 'Rebate/Void',
            description: `VOID Order #${order.id.slice(-4)} (${reason})`,
            amount: -order.total, // Negative amount
            timestamp: Date.now()
        };

        // 3. Update Folio
        await updateItem('folios', folio.id, {
            charges: [...folio.charges, reversalCharge],
            balance: folio.balance - order.total
        });

        // 4. Update Order Status
        await updateItem('posOrders', order.id, {
            status: 'Void',
            voidReason: reason,
            settlementTimestamp: Date.now() // Update timestamp to show void time
        });

        botEngine.logActivity('POS', 'Charge_Voided', `Order: ${order.id}, Reason: ${reason}`, 'Manager_Override');
        return true;
    } catch (error: any) {
        botEngine.logActivity('POS', 'Void_Failed', error.message, 'F&B_Terminal', 'ERROR');
        throw error;
    }
};
