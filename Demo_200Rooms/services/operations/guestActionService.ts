import { addItem, fetchItem } from '../kernel/firestoreService';
import { HousekeepingTask, Reservation, Trace } from '../../types';

export interface GuestIntent {
    type: 'Housekeeping' | 'Maintenance' | 'FrontDesk' | 'FB' | 'General';
    action: string;
    details?: string;
    priority: 'Normal' | 'High' | 'Urgent';
}

class GuestActionService {
    /**
     * Processes an intent detected by the AI Concierge.
     */
    async processIntent(reservationId: string, intent: GuestIntent) {
        console.log(`[GuestActionService] Processing intent for ${reservationId}:`, intent);

        switch (intent.type) {
            case 'Housekeeping':
                return this.createHousekeepingTask(reservationId, intent);
            case 'Maintenance':
                return this.createMaintenanceTask(reservationId, intent);
            case 'FrontDesk':
                return this.createFrontDeskTrace(reservationId, intent);
            case 'FB':
                return this.handleFoodRequest(reservationId, intent);
            default:
                console.warn(`[GuestActionService] Unknown intent type: ${intent.type}`);
        }
    }

    private async createHousekeepingTask(reservationId: string, intent: GuestIntent) {
        const res = await fetchItem<Reservation>('reservations', reservationId);
        if (!res || !res.roomId) return;

        const task: HousekeepingTask = {
            id: `hk_${Date.now()}`,
            roomId: res.roomId,
            type: intent.action, // e.g., "Extra Towels"
            status: 'Pending',
            assignedTo: ''
        };

        await addItem('tasks', {
            ...task,
            reservationId,
            department: 'Housekeeping',
            priority: intent.priority,
            createdAt: Date.now(),
        });
        return task;
    }

    private async createMaintenanceTask(reservationId: string, intent: GuestIntent) {
        const res = await fetchItem<Reservation>('reservations', reservationId);
        if (!res || !res.roomId) return;

        const task = {
            id: `maint_${Date.now()}`,
            roomId: res.roomId,
            issue: intent.action,
            details: intent.details || '',
            status: 'Reported',
            priority: intent.priority,
            createdAt: Date.now()
        };

        await addItem('maintenanceTasks', task);
        return task;
    }

    private async createFrontDeskTrace(reservationId: string, intent: GuestIntent) {
        const trace: Trace = {
            id: `trace_${Date.now()}`,
            department: 'Front Desk',
            date: new Date().toISOString().split('T')[0],
            text: `Guest Request via AI: ${intent.action}. ${intent.details || ''}`,
            status: 'Pending'
        };

        // We should add this trace to the reservation or a general trace collection.
        // For now, let's assume traces are a separate collection or we append to reservation.
        // The implementation plan says "Create real Trace objects".
        await addItem('traces', { ...trace, reservationId });
        return trace;
    }

    private async handleFoodRequest(reservationId: string, intent: GuestIntent) {
        // Simple log for now, full F&B integration would create a POS order
        console.log(`[GuestActionService] Food request: ${intent.action}`);
        return { status: 'Received', message: 'F&B team notified' };
    }
}

export const guestActionService = new GuestActionService();
export default guestActionService;
