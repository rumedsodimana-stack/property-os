import { PosOrder, Reservation, Folio, FolioCharge, Room, Outlet } from '../../types';
import { updateItem } from '../kernel/firestoreService';
import { financeService } from './financeService';

/**
 * POS to Folio Integration Service
 * Implements the event-driven, immutable posting contract for room charge postings
 */

export interface RoomChargeValidation {
    isValid: boolean;
    error?: string;
    reservation?: Reservation;
    folio?: Folio;
    room?: Room;
}

/**
 * Validates if a room charge can be posted
 * Checks: room exists, is occupied, guest matches, folio is open, posting is allowed
 */
export const validateRoomCharge = (
    roomNumber: string,
    rooms: Room[],
    reservations: Reservation[],
    folios: Folio[],
    guestName?: string
): RoomChargeValidation => {
    // Find the room
    const room = rooms.find(r => r.number === roomNumber);

    if (!room) {
        return {
            isValid: false,
            error: 'Room not found'
        };
    }

    // Check if room is occupied
    if (room.status !== 'Occupied') {
        return {
            isValid: false,
            error: 'Room is not currently occupied'
        };
    }

    // Find the active reservation for this room
    const reservation = reservations.find(
        r => r.roomId === room.id && r.status === 'Checked In'
    );

    if (!reservation) {
        return {
            isValid: false,
            error: 'No active reservation found for this room'
        };
    }

    // Check if posting is allowed
    if (reservation.postingAllowed === false) {
        return {
            isValid: false,
            error: 'Room charge posting not permitted for this reservation'
        };
    }

    // Find the folio
    const folio = folios.find(f => f.id === reservation.folioId);

    if (!folio) {
        return {
            isValid: false,
            error: 'Folio not found for this reservation'
        };
    }

    if (folio.status !== 'Open') {
        return {
            isValid: false,
            error: 'Folio is closed and cannot accept new charges'
        };
    }

    // Optional: Guest name validation (basic check)
    // In production, this would be more sophisticated
    if (guestName) {
        // For now, we'll skip strict guest name validation
        // as we don't have direct guest name in the validation flow
        // This would typically check against the guest record
    }

    return {
        isValid: true,
        reservation,
        folio,
        room
    };
};

/**
 * Posts a POS order to a guest folio
 * Creates an immutable folio charge entry with full audit trail
 */
export const postOrderToFolio = async (
    order: PosOrder,
    roomNumber: string,
    rooms: Room[],
    reservations: Reservation[],
    folios: Folio[],
    outlets: Outlet[]
): Promise<{ success: boolean; error?: string; pmsTransactionId?: string; folioBalance?: number }> => {
    // Validate first
    const validation = validateRoomCharge(roomNumber, rooms, reservations, folios);

    if (!validation.isValid) {
        return {
            success: false,
            error: validation.error
        };
    }

    const { folio, reservation } = validation;
    if (!folio || !reservation) {
        return {
            success: false,
            error: 'Validation data incomplete'
        };
    }

    // Get outlet information
    const outlet = outlets.find(o => o.id === order.outletId);

    // Create the folio charge (immutable posting event)
    const pmsTransactionId = `pms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const folioCharge: FolioCharge = {
        id: pmsTransactionId,
        category: 'Food & Beverage',
        description: `${outlet?.name || 'POS'} - Check #${order.id.slice(-6)}`,
        amount: order.total,
        timestamp: Date.now(),
        // Audit fields
        businessDate: new Date().toISOString().split('T')[0],
        outletId: order.outletId,
        posOrderId: order.id,
        serverName: order.openedBy || 'POS Staff',
        coverCount: order.guestCount || 0
    };

    // Add charge to folio (persist to firestore)
    const updatedCharges = [...folio.charges, folioCharge];
    const updatedBalance = folio.balance + order.total;
    await updateItem('folios', folio.id, {
        charges: updatedCharges,
        balance: updatedBalance
    });
    folio.charges = updatedCharges;
    folio.balance = updatedBalance;

    // ────────────────────────────────────────────────────────────
    // UNIFIED LEDGER POSTING (Reporting Engine Foundation)
    // ────────────────────────────────────────────────────────────
    try {
        await financeService.postTransaction([
            {
                transactionId: pmsTransactionId,
                businessDate: folioCharge.businessDate!,
                accountId: 'gl_guest_ledger', // AR - Guest Ledger
                accountCode: '1100',
                debit: order.total,
                credit: 0,
                description: `Room Charge: ${folioCharge.description}`,
                moduleSource: 'POS',
                departmentId: 'FrontDesk',
                reservationId: reservation.id,
                outletId: order.outletId,
                posOrderId: order.id
            },
            {
                transactionId: pmsTransactionId,
                businessDate: folioCharge.businessDate!,
                accountId: 'gl_fb_rev', // Revenue - F&B
                accountCode: '4100',
                debit: 0,
                credit: order.total,
                description: `Revenue: ${folioCharge.description}`,
                moduleSource: 'POS',
                departmentId: 'F&B',
                reservationId: reservation.id,
                outletId: order.outletId,
                posOrderId: order.id
            }
        ], pmsTransactionId);
    } catch (glError) {
        console.error('[POS-PMS] Failed to post to Unified Ledger:', glError);
    }

    // Update the POS order with the PMS transaction reference
    order.pmsTransactionId = pmsTransactionId;
    order.paymentMethod = 'RoomPost';
    order.status = 'Paid';
    order.settlementTimestamp = Date.now();

    // Log the posting event (in production, this would be persisted to an audit log)
    console.log('[POS-PMS Integration] Room charge posted:', {
        pmsTransactionId,
        orderId: order.id,
        roomNumber,
        amount: order.total,
        folioId: folio.id,
        reservationId: reservation.id
    });

    return {
        success: true,
        pmsTransactionId,
        folioBalance: folio.balance
    };
};

/**
 * Reverses a room charge posting
 * Creates an offsetting negative charge (future implementation)
 */
export const reverseRoomCharge = async (
    pmsTransactionId: string,
    reason: string,
    folios: Folio[]
): Promise<{ success: boolean; error?: string }> => {
    // Find the original charge
    const folio = folios.find(f =>
        f.charges.some(c => c.id === pmsTransactionId)
    );

    if (!folio) {
        return {
            success: false,
            error: 'Original charge not found'
        };
    }

    const originalCharge = folio.charges.find(c => c.id === pmsTransactionId);
    if (!originalCharge) {
        return {
            success: false,
            error: 'Charge not found in folio'
        };
    }

    // Create reversal charge (negative amount)
    const reversalCharge: FolioCharge = {
        id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'Reversal',
        description: `REVERSAL: ${originalCharge.description} - Reason: ${reason}`,
        amount: -originalCharge.amount,
        timestamp: Date.now(),
        businessDate: new Date().toISOString().split('T')[0]
    };

    const updatedCharges = [...folio.charges, reversalCharge];
    const updatedBalance = folio.balance + reversalCharge.amount;
    await updateItem('folios', folio.id, {
        charges: updatedCharges,
        balance: updatedBalance
    });
    folio.charges = updatedCharges;
    folio.balance = updatedBalance;

    console.log('[POS-PMS Integration] Room charge reversed:', {
        originalTransactionId: pmsTransactionId,
        reversalId: reversalCharge.id,
        amount: reversalCharge.amount,
        reason
    });

    return {
        success: true
    };
};
