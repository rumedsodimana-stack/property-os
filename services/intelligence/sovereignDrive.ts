import { updateItem, addItem } from '../kernel/firestoreService';
import { botEngine } from '../kernel/systemBridge';
import { ReservationStatus, RoomStatus } from '../../types';
import {
    AgentPrincipal,
    SovereignAction,
    getTierForActor,
    validateIntent
} from './agentSandbox';
import { aiActivityLogger } from './aiActivityLogger';

export interface SovereignIntent {
    action: SovereignAction;
    params?: any;
    parameters?: any;
}

export interface SovereignExecutionContext {
    actor?: AgentPrincipal;
    source?: string;
    /** Full name of the logged-in operator executing this action */
    userName?: string;
}

export interface SovereignExecutionResult {
    success: boolean;
    action: string;
    blocked?: boolean;
    error?: string;
}

class SovereignDrive {
    async execute(
        intent: SovereignIntent,
        context: SovereignExecutionContext = {}
    ): Promise<SovereignExecutionResult> {
        const actor: AgentPrincipal = context.actor || 'SYSTEM';
        const action = String(intent.action || '').toUpperCase();
        const startedAt = Date.now();

        const validation = validateIntent(actor, intent);
        if (!validation.allowed) {
            const error = validation.violations.map(v => v.message).join(' | ');
            console.warn(`[SovereignDrive] Sandbox blocked ${actor} -> ${action}: ${error}`);
            this.logExecution(actor, action, startedAt, false, error, { blocked: true, source: context.source });
            return { success: false, action, blocked: true, error };
        }

        const params = validation.normalizedParams;
        const userName = context.userName || 'System';
        console.log(`[SovereignDrive] Executing action: ${action} as ${actor} (operator: ${userName})`, params);

        try {
            switch (action as SovereignAction) {
                case 'CHECK_IN':
                    await this.handleCheckIn(params as { reservationId: string, roomId: string });
                    break;
                case 'CHECK_OUT':
                    await this.handleCheckOut(params as { reservationId: string, roomId: string });
                    break;
                case 'CREATE_ORDER':
                    await this.handleCreateOrder(params as { outletId: string; items: any[]; tableId?: string; });
                    break;
                case 'SETTLE_ORDER':
                    await this.handleSettleOrder(params as { orderId: string; paymentMethod: string; });
                    break;
                case 'CREATE_TASK':
                    await this.handleCreateTask(params as { title: string; description: string; department: any; priority: any; }, userName);
                    break;
                case 'UPDATE_BRAND':
                    await this.handleUpdateBrand(params as { standards: any; });
                    break;
                case 'NAVIGATE':
                    import('../kernel/systemBridge').then(({ systemBus }) => {
                        systemBus.emit('navigate', params.module);
                    });
                    break;
                case 'TROUBLESHOOT':
                    await this.handleTroubleshoot(params as { target: string; command: string; reason: string; });
                    break;
                case 'MODIFY_CODE':
                    await this.handleModifyCode(params as { filePath: string; change: string; description: string; }, actor);
                    break;

                // ── Role-bound hotel operations ──────────────────────────
                case 'CREATE_RESERVATION':
                    await this.handleCreateReservation(params as { guestName: string; roomType: string; checkInDate: string; checkOutDate: string; adults: number; rateApplied?: number; notes?: string; }, userName);
                    break;
                case 'CANCEL_RESERVATION':
                    await this.handleCancelReservation(params as { reservationId: string; reason?: string; }, userName);
                    break;
                case 'UPDATE_RESERVATION':
                    await this.handleUpdateReservation(params as { reservationId: string; updates: Record<string, any>; }, userName);
                    break;
                case 'ISSUE_GUEST_KEY':
                    await this.handleIssueGuestKey(params as { reservationId: string; forceReissue?: boolean; });
                    break;
                case 'REVOKE_GUEST_KEY':
                    await this.handleRevokeGuestKey(params as { reservationId: string; reason?: string; });
                    break;
                case 'MARK_ROOM_CLEAN':
                    await this.handleMarkRoomClean(params as { roomId: string; status?: string; }, userName);
                    break;
                case 'UPDATE_ROOM_STATUS':
                    await this.handleUpdateRoomStatus(params as { roomId: string; status: string; notes?: string; }, userName);
                    break;
                case 'APPROVE_LEAVE':
                    await this.handleApproveLeave(params as { leaveId: string; comments?: string; }, userName);
                    break;
                case 'REJECT_LEAVE':
                    await this.handleRejectLeave(params as { leaveId: string; comments?: string; }, userName);
                    break;
                case 'VOID_TRANSACTION':
                    await this.handleVoidTransaction(params as { transactionId: string; reason: string; }, userName);
                    break;
                case 'MANAGE_SHIFTS':
                    await this.handleManageShifts(params as { staffId: string; shiftDate: string; startTime: string; endTime: string; department?: string; action?: string; }, userName);
                    break;
                case 'CREATE_EVENT':
                    await this.handleCreateEvent(params as { title: string; description?: string; eventDate: string; venue?: string; capacity?: number; organizer?: string; }, userName);
                    break;
                case 'SEND_GUEST_MESSAGE':
                    await this.handleSendGuestMessage(params as { reservationId?: string; guestId?: string; message: string; channel?: string; }, userName);
                    break;
                case 'CREATE_MAINTENANCE':
                    await this.handleCreateMaintenance(params as { location: string; issueDescription: string; priority?: string; category?: string; }, userName);
                    break;

                default:
                    this.logExecution(actor, action, startedAt, false, `Unknown action: ${action}`);
                    return { success: false, action, error: `Unknown action: ${action}` };
            }

            this.logExecution(actor, action, startedAt, true, undefined, { source: context.source, userName });
            return { success: true, action };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[SovereignDrive] Failed to execute ${action}:`, error);
            this.logExecution(actor, action, startedAt, false, message, { source: context.source, userName });
            return { success: false, action, error: message };
        }
    }

    // ── Existing handlers ───────────────────────────────────────────────────────

    private async handleCheckIn({ reservationId, roomId }: { reservationId: string, roomId: string }) {
        await updateItem('reservations', reservationId, { status: ReservationStatus.CHECKED_IN, roomId });
        await updateItem('rooms', roomId, { status: RoomStatus.OCCUPIED });
        botEngine.logActivity('PMS', 'CHECK_IN', `Reservation ${reservationId} checked into room ${roomId}`);
    }

    private async handleCheckOut({ reservationId, roomId }: { reservationId: string, roomId: string }) {
        await updateItem('reservations', reservationId, { status: ReservationStatus.CHECKED_OUT });
        await updateItem('rooms', roomId, { status: RoomStatus.DIRTY_DEPARTURE });
        botEngine.logActivity('PMS', 'CHECK_OUT', `Reservation ${reservationId} checked out from room ${roomId}`);
    }

    private async handleCreateOrder({ outletId, items, tableId }: { outletId: string, items: any[], tableId?: string }) {
        const orderId = `ord_${Date.now()}`;
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
        await addItem('posOrders', {
            id: orderId,
            outletId,
            items,
            tableId,
            status: 'Sent',
            timestamp: Date.now(),
            subtotal,
            total: subtotal,
            discountAmount: 0
        });
        botEngine.logActivity('POS', 'CREATE_ORDER', `New order ${orderId} created for outlet ${outletId}`);
    }

    private async handleSettleOrder({ orderId, paymentMethod }: { orderId: string, paymentMethod: string }) {
        await updateItem('posOrders', orderId, { status: 'Paid', paymentMethod, settlementTimestamp: Date.now() });
        botEngine.logActivity('POS', 'SETTLE_ORDER', `Order ${orderId} settled via ${paymentMethod}`);
    }

    private async handleCreateTask(
        { title, description, department, priority }: { title: string, description: string, department: any, priority: any },
        userName: string
    ) {
        const taskId = `task_${Date.now()}`;
        await addItem('tasks', {
            id: taskId,
            title,
            description,
            department,
            priority,
            status: 'Open',
            dueDate: Date.now() + 86400000, // +24h
            aiSuggested: true,
            delegatorId: userName
        });
        botEngine.logActivity('KERNEL', 'CREATE_TASK', `New ${priority} task created by ${userName}: ${title}`);
    }

    private async handleUpdateBrand({ standards }: { standards: any }) {
        botEngine.logActivity('KERNEL', 'BRAND_UPDATE', `Brand standards updated autonomously`);
    }

    private async handleTroubleshoot({ target, command, reason }: { target: string, command: string, reason: string }) {
        botEngine.logActivity('KERNEL', 'SYS_DIAGNOSTIC', `Running '${command}' against ${target} - ${reason}`);
        // Automatically switch the user to the terminal to view results
        import('../kernel/systemBridge').then(({ systemBus }) => {
            systemBus.emit('navigate', 'terminal');
        });
    }

    private async handleModifyCode(
        { filePath, change, description }: { filePath: string, change: string, description: string },
        actor: AgentPrincipal
    ) {
        botEngine.logActivity('KERNEL', 'CODE_MODIFY', `Modifying ${filePath}: ${description}`);

        let fileType: 'typescript' | 'css' | 'json' = 'typescript';
        if (filePath.endsWith('.css')) fileType = 'css';
        else if (filePath.endsWith('.json')) fileType = 'json';

        // We'll use a dynamic import to avoid circularities or heavy initial load
        const { fileModifier } = await import('../kernel/fileModifier');

        const result = await fileModifier.applyChanges([{
            filePath,
            type: fileType,
            content: change,
            description
        }], description, { actor });

        if (!result.success) {
            throw new Error(`Failed to modify code: ${result.errors.join(', ')}`);
        }

        botEngine.logActivity('KERNEL', 'CODE_SUCCESS', `Successfully updated ${filePath}`);
    }

    // ── New role-bound handlers ─────────────────────────────────────────────────

    private async handleCreateReservation(
        { guestName, roomType, checkInDate, checkOutDate, adults, rateApplied, notes }:
        { guestName: string; roomType: string; checkInDate: string; checkOutDate: string; adults: number; rateApplied?: number; notes?: string },
        userName: string
    ) {
        const reservationId = `res_${Date.now()}`;
        await addItem('reservations', {
            id: reservationId,
            guestName,
            roomType,
            checkInDate,
            checkOutDate,
            adults: adults || 1,
            children: 0,
            status: ReservationStatus.CONFIRMED ?? 'Confirmed',
            rateApplied: rateApplied || 0,
            notes: notes || '',
            aiCreated: true,
            createdBy: userName,
            createdAt: Date.now(),
        });
        botEngine.logActivity('PMS', 'CREATE_RESERVATION', `Reservation ${reservationId} created by ${userName} for ${guestName}`);
    }

    private async handleCancelReservation(
        { reservationId, reason }: { reservationId: string; reason?: string },
        userName: string
    ) {
        await updateItem('reservations', reservationId, {
            status: ReservationStatus.CANCELLED ?? 'Cancelled',
            cancellationReason: reason || 'Cancelled via AI assistant',
            cancelledBy: userName,
            cancelledAt: Date.now(),
        });
        botEngine.logActivity('PMS', 'CANCEL_RESERVATION', `Reservation ${reservationId} cancelled by ${userName}: ${reason || 'No reason given'}`);
    }

    private async handleUpdateReservation(
        { reservationId, updates }: { reservationId: string; updates: Record<string, any> },
        userName: string
    ) {
        const safeUpdates = { ...updates, lastModifiedBy: userName, lastModifiedAt: Date.now() } as any;
        // Remove any fields that should not be changed via AI for safety
        delete safeUpdates.id;
        delete safeUpdates.folioId;
        await updateItem('reservations', reservationId, safeUpdates);
        botEngine.logActivity('PMS', 'UPDATE_RESERVATION', `Reservation ${reservationId} updated by ${userName}`);
    }

    private async handleIssueGuestKey({ reservationId, forceReissue }: { reservationId: string; forceReissue?: boolean }) {
        const { guestKeyService } = await import('../operations/guestKeyService');
        const result = await guestKeyService.issueWalletKey(reservationId, forceReissue ?? false);
        botEngine.logActivity('PMS', 'ISSUE_GUEST_KEY', `Wallet key issued for reservation ${reservationId}: ${result.message || 'OK'}`);
    }

    private async handleRevokeGuestKey({ reservationId, reason }: { reservationId: string; reason?: string }) {
        const { guestKeyService } = await import('../operations/guestKeyService');
        const result = await guestKeyService.revokeWalletKeyForReservation(reservationId, reason);
        botEngine.logActivity('PMS', 'REVOKE_GUEST_KEY', `Wallet key revoked for reservation ${reservationId}: ${result.message || 'OK'}`);
    }

    private async handleMarkRoomClean(
        { roomId, status }: { roomId: string; status?: string },
        userName: string
    ) {
        const newStatus = status || RoomStatus.CLEAN_READY;
        await updateItem('rooms', roomId, {
            status: newStatus,
            lastCleaned: Date.now(),
            cleanedBy: userName,
        });
        botEngine.logActivity('HOUSEKEEPING', 'MARK_ROOM_CLEAN', `Room ${roomId} marked as ${newStatus} by ${userName}`);
    }

    private async handleUpdateRoomStatus(
        { roomId, status, notes }: { roomId: string; status: string; notes?: string },
        userName: string
    ) {
        await updateItem('rooms', roomId, {
            status,
            statusNotes: notes || '',
            statusUpdatedBy: userName,
            statusUpdatedAt: Date.now(),
        });
        botEngine.logActivity('HOUSEKEEPING', 'UPDATE_ROOM_STATUS', `Room ${roomId} status → ${status} by ${userName}`);
    }

    private async handleApproveLeave(
        { leaveId, comments }: { leaveId: string; comments?: string },
        userName: string
    ) {
        await updateItem('leaveRequests', leaveId, {
            status: 'Approved',
            approvedBy: userName,
            approvedAt: Date.now(),
            reviewComments: comments || '',
        });
        botEngine.logActivity('HR', 'APPROVE_LEAVE', `Leave request ${leaveId} approved by ${userName}`);
    }

    private async handleRejectLeave(
        { leaveId, comments }: { leaveId: string; comments?: string },
        userName: string
    ) {
        await updateItem('leaveRequests', leaveId, {
            status: 'Rejected',
            rejectedBy: userName,
            rejectedAt: Date.now(),
            reviewComments: comments || 'Request rejected.',
        });
        botEngine.logActivity('HR', 'REJECT_LEAVE', `Leave request ${leaveId} rejected by ${userName}`);
    }

    private async handleVoidTransaction(
        { transactionId, reason }: { transactionId: string; reason: string },
        userName: string
    ) {
        await updateItem('transactions', transactionId, {
            status: 'Voided',
            voidedBy: userName,
            voidedAt: Date.now(),
            voidReason: reason,
        });
        botEngine.logActivity('FINANCE', 'VOID_TRANSACTION', `Transaction ${transactionId} voided by ${userName}: ${reason}`);
    }

    private async handleManageShifts(
        { staffId, shiftDate, startTime, endTime, department, action: shiftAction }:
        { staffId: string; shiftDate: string; startTime: string; endTime: string; department?: string; action?: string },
        userName: string
    ) {
        const op = (shiftAction || 'assign').toLowerCase();
        if (op === 'remove') {
            // Find and mark existing shift inactive — generic update by staffId+date via composite ID pattern
            botEngine.logActivity('HR', 'MANAGE_SHIFTS', `Shift removal requested for staff ${staffId} on ${shiftDate} by ${userName}`);
        } else {
            const shiftId = `shift_${staffId}_${Date.now()}`;
            await addItem('shifts', {
                id: shiftId,
                staffId,
                shiftDate,
                startTime,
                endTime,
                department: department || 'General',
                createdBy: userName,
                createdAt: Date.now(),
                aiAssigned: true,
            });
            botEngine.logActivity('HR', 'MANAGE_SHIFTS', `Shift ${shiftId} assigned to ${staffId} on ${shiftDate} by ${userName}`);
        }
    }

    private async handleCreateEvent(
        { title, description, eventDate, venue, capacity, organizer }:
        { title: string; description?: string; eventDate: string; venue?: string; capacity?: number; organizer?: string },
        userName: string
    ) {
        const eventId = `event_${Date.now()}`;
        await addItem('events', {
            id: eventId,
            title,
            description: description || '',
            eventDate,
            venue: venue || 'TBD',
            capacity: capacity || 0,
            organizer: organizer || userName,
            status: 'Planned',
            createdBy: userName,
            createdAt: Date.now(),
            aiCreated: true,
        });
        botEngine.logActivity('EVENTS', 'CREATE_EVENT', `Event "${title}" created by ${userName} for ${eventDate}`);
    }

    private async handleSendGuestMessage(
        { reservationId, guestId, message, channel }:
        { reservationId?: string; guestId?: string; message: string; channel?: string },
        userName: string
    ) {
        const messageId = `msg_${Date.now()}`;
        await addItem('guestMessages', {
            id: messageId,
            reservationId: reservationId || null,
            guestId: guestId || null,
            message,
            channel: channel || 'in_app',
            sentBy: userName,
            sentAt: Date.now(),
            aiGenerated: true,
            status: 'Sent',
        });
        botEngine.logActivity('COMMS', 'SEND_GUEST_MESSAGE', `Message sent to guest ${guestId || reservationId} by ${userName} via ${channel || 'in_app'}`);
    }

    private async handleCreateMaintenance(
        { location, issueDescription, priority, category }:
        { location: string; issueDescription: string; priority?: string; category?: string },
        userName: string
    ) {
        const maintenanceId = `maint_${Date.now()}`;
        await addItem('maintenanceTasks', {
            id: maintenanceId,
            location,
            issueDescription,
            priority: priority || 'Medium',
            category: category || 'General',
            status: 'Open',
            reportedBy: userName,
            reportedAt: Date.now(),
            aiReported: true,
        });
        botEngine.logActivity('ENGINEERING', 'CREATE_MAINTENANCE', `Maintenance task ${maintenanceId} logged by ${userName}: ${issueDescription} at ${location}`);
    }

    // ── Logging ─────────────────────────────────────────────────────────────────

    private logExecution(
        actor: AgentPrincipal,
        action: string,
        startedAt: number,
        success: boolean,
        error?: string,
        metadata: Record<string, any> = {}
    ) {
        aiActivityLogger.log({
            aiTier: getTierForActor(actor),
            action: `sovereign_${action.toLowerCase()}`,
            details: {
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
                latencyMs: Date.now() - startedAt,
                success,
                error
            },
            metadata: {
                actor,
                ...metadata
            }
        });
    }
}

export const sovereignDrive = new SovereignDrive();
