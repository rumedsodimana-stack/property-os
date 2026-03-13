import { fetchItem, updateItem } from "../kernel/firestoreService";
import { RecInventoryItem } from "../../types/recreation";

const buildId = (outletId: string, masterItemId: string) => `ri_${outletId}_${masterItemId}`;

const upsertInventory = async (payload: Partial<RecInventoryItem> & { id: string }) => {
    await updateItem('rec_inventory', payload.id, {
        ...payload,
        updatedAt: Date.now()
    });
};

const updateMasterStock = async (masterItemId: string, nextOnHand: number) => {
    // Align native outlet inventory with master inventory roll-up (simplistic single-location update)
    await updateItem('master_inventory', masterItemId, {
        totalStock: nextOnHand
    });
};

export const recreationInventoryBridge = {
    async reserve(outletId: string, masterItemId: string, qty: number): Promise<RecInventoryItem> {
        const id = buildId(outletId, masterItemId);
        const existing = await fetchItem<RecInventoryItem>('rec_inventory', id);
        const onHand = existing?.onHand ?? 0;
        const reserved = existing?.reserved ?? 0;
        const nextReserved = reserved + qty;
        await upsertInventory({ id, outletId, masterItemId, onHand, reserved: nextReserved, reorderPoint: existing?.reorderPoint ?? 0 });
        return { id, outletId, masterItemId, onHand, reserved: nextReserved, reorderPoint: existing?.reorderPoint ?? 0 };
    },

    async consume(outletId: string, masterItemId: string, qty: number): Promise<RecInventoryItem> {
        const id = buildId(outletId, masterItemId);
        const existing = await fetchItem<RecInventoryItem>('rec_inventory', id);
        const onHand = Math.max((existing?.onHand ?? 0) - qty, 0);
        const reserved = Math.max((existing?.reserved ?? 0) - qty, 0);
        await upsertInventory({ id, outletId, masterItemId, onHand, reserved, reorderPoint: existing?.reorderPoint ?? 0 });
        await updateMasterStock(masterItemId, onHand);
        return { id, outletId, masterItemId, onHand, reserved, reorderPoint: existing?.reorderPoint ?? 0 };
    },

    async release(outletId: string, masterItemId: string, qty: number): Promise<RecInventoryItem> {
        const id = buildId(outletId, masterItemId);
        const existing = await fetchItem<RecInventoryItem>('rec_inventory', id);
        const reserved = Math.max((existing?.reserved ?? 0) - qty, 0);
        const onHand = existing?.onHand ?? 0;
        await upsertInventory({ id, outletId, masterItemId, onHand, reserved, reorderPoint: existing?.reorderPoint ?? 0 });
        await updateMasterStock(masterItemId, onHand);
        return { id, outletId, masterItemId, onHand, reserved, reorderPoint: existing?.reorderPoint ?? 0 };
    },

    async setReorderPoint(outletId: string, masterItemId: string, reorderPoint: number): Promise<RecInventoryItem> {
        const id = buildId(outletId, masterItemId);
        const existing = await fetchItem<RecInventoryItem>('rec_inventory', id);
        const onHand = existing?.onHand ?? 0;
        const reserved = existing?.reserved ?? 0;
        await upsertInventory({ id, outletId, masterItemId, onHand, reserved, reorderPoint });
        return { id, outletId, masterItemId, onHand, reserved, reorderPoint };
    }
};
