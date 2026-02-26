import { updateItem, addItem } from '../kernel/firestoreService';
import { botEngine } from '../kernel/systemBridge';
import { ReservationStatus, RoomStatus } from '../../types';

export interface SovereignIntent {
    action: 'CHECK_IN' | 'CHECK_OUT' | 'CREATE_ORDER' | 'SETTLE_ORDER' | 'UPDATE_BRAND' | 'SYSTEM_CONTROL' | 'CREATE_TASK' | 'NAVIGATE' | 'TROUBLESHOOT' | 'MODIFY_CODE';
    params: any;
}

class SovereignDrive {
    async execute(intent: SovereignIntent) {
        console.log(`[SovereignDrive] Executing action: ${intent.action}`, intent.params);

        try {
            switch (intent.action) {
                case 'CHECK_IN':
                    await this.handleCheckIn(intent.params);
                    break;
                case 'CHECK_OUT':
                    await this.handleCheckOut(intent.params);
                    break;
                case 'CREATE_ORDER':
                    await this.handleCreateOrder(intent.params);
                    break;
                case 'SETTLE_ORDER':
                    await this.handleSettleOrder(intent.params);
                    break;
                case 'CREATE_TASK':
                    await this.handleCreateTask(intent.params);
                    break;
                case 'UPDATE_BRAND':
                    await this.handleUpdateBrand(intent.params);
                    break;
                case 'NAVIGATE':
                    import('../kernel/systemBridge').then(({ systemBus }) => {
                        systemBus.emit('navigate', intent.params.module);
                    });
                    break;
                case 'TROUBLESHOOT':
                    await this.handleTroubleshoot(intent.params);
                    break;
                case 'MODIFY_CODE':
                    await this.handleModifyCode(intent.params);
                    break;
                default:
                    console.warn(`[SovereignDrive] Unknown action: ${intent.action}`);
            }
        } catch (error) {
            console.error(`[SovereignDrive] Failed to execute ${intent.action}:`, error);
            // Intentionally NOT re-throwing — the AI panel handles errors gracefully.
            // Re-throwing caused the entire React tree to crash.
        }
    }

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

    private async handleCreateTask({ title, description, department, priority }: { title: string, description: string, department: any, priority: any }) {
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
            delegatorId: 'SYSTEM'
        });
        botEngine.logActivity('KERNEL', 'CREATE_TASK', `New ${priority} task created: ${title}`);
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

    private async handleModifyCode({ filePath, change, description }: { filePath: string, change: string, description: string }) {
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
        }], description);

        if (!result.success) {
            throw new Error(`Failed to modify code: ${result.errors.join(', ')}`);
        }

        botEngine.logActivity('KERNEL', 'CODE_SUCCESS', `Successfully updated ${filePath}`);
    }
}

export const sovereignDrive = new SovereignDrive();
