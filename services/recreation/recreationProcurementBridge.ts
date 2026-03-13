import { addItem } from "../kernel/firestoreService";
import { RecInventoryItem } from "../../types/recreation";

export interface ProcurementTriggerPayload {
    outletId: string;
    masterItemId: string;
    supplierId?: string;
    leadTimeDays?: number;
    reorderQty?: number;
    notes?: string;
}

export const recreationProcurementBridge = {
    /**
     * Create a procurement request when stock falls below reorderPoint.
     */
    async raiseIfLow(inv: RecInventoryItem, opts: ProcurementTriggerPayload): Promise<string | null> {
        const available = (inv.onHand ?? 0) - (inv.reserved ?? 0);
        if (available >= (inv.reorderPoint ?? 0)) return null;

        const reorderPoint = inv.reorderPoint ?? 0;
        const req = {
            id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            outletId: opts.outletId,
            masterItemId: opts.masterItemId,
            supplierId: opts.supplierId || 'DEFAULT',
            reorderQty: opts.reorderQty || Math.max(reorderPoint * 2, 10),
            leadTimeDays: opts.leadTimeDays || 3,
            notes: opts.notes || 'Auto-generated from Recreation low stock',
            status: 'Pending',
            createdAt: Date.now(),
            moduleSource: 'Recreation'
        };
        await addItem('procurementRequests', req);
        return req.id;
    }
};
