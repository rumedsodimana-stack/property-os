export type FrontDeskAssignmentScope = 'selected' | 'all_unassigned';

export type FrontDeskAssignmentStrategy =
    | 'same_type_ready'
    | 'same_type_fallback'
    | 'upgrade_ready'
    | 'upgrade_fallback';

export interface FrontDeskAssignmentBatchRuleSet {
    scope: FrontDeskAssignmentScope;
    prioritizeVip: boolean;
    allowUpgrades: boolean;
    allowNotReadyFallback: boolean;
}

export interface FrontDeskAssignmentBatchEntry {
    reservationId: string;
    guestName: string;
    requestedTypeName: string;
    assignedRoomId: string;
    assignedRoomNumber?: string;
    strategy?: FrontDeskAssignmentStrategy;
    vip: boolean;
    previousRoomId?: string;
}

export interface FrontDeskAssignmentBatchRecord {
    id: string;
    createdAtIso: string;
    createdAtEpoch: number;
    assigned: number;
    unassigned: number;
    total: number;
    rules: FrontDeskAssignmentBatchRuleSet;
    entries: FrontDeskAssignmentBatchEntry[];
}

interface SaveFrontDeskAssignmentBatchInput {
    assigned: number;
    unassigned: number;
    total: number;
    rules: FrontDeskAssignmentBatchRuleSet;
    entries: FrontDeskAssignmentBatchEntry[];
}

const STORAGE_KEY = 'frontdesk_assignment_batches_v1';
const MAX_BATCH_RECORDS = 20;

const readRecords = (): FrontDeskAssignmentBatchRecord[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed as FrontDeskAssignmentBatchRecord[];
    } catch {
        return [];
    }
};

const writeRecords = (records: FrontDeskAssignmentBatchRecord[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
        // Ignore storage write failures to keep front desk actions non-blocking.
    }
};

export const listFrontDeskAssignmentBatches = (): FrontDeskAssignmentBatchRecord[] => {
    const records = readRecords();
    return [...records].sort((a, b) => b.createdAtEpoch - a.createdAtEpoch);
};

export const getLatestFrontDeskAssignmentBatch = (): FrontDeskAssignmentBatchRecord | null => {
    const records = listFrontDeskAssignmentBatches();
    return records[0] || null;
};

export const saveFrontDeskAssignmentBatch = (
    input: SaveFrontDeskAssignmentBatchInput
): FrontDeskAssignmentBatchRecord | null => {
    if (!input.entries.length) return null;

    const createdAtEpoch = Date.now();
    const record: FrontDeskAssignmentBatchRecord = {
        id: `assign_batch_${createdAtEpoch}_${Math.random().toString(36).slice(2, 8)}`,
        createdAtIso: new Date(createdAtEpoch).toISOString(),
        createdAtEpoch,
        assigned: input.assigned,
        unassigned: input.unassigned,
        total: input.total,
        rules: input.rules,
        entries: input.entries
    };

    const records = readRecords();
    const nextRecords = [record, ...records].slice(0, MAX_BATCH_RECORDS);
    writeRecords(nextRecords);
    return record;
};

export const clearFrontDeskAssignmentBatch = (batchId: string) => {
    if (!batchId) return;
    const records = readRecords();
    writeRecords(records.filter(record => record.id !== batchId));
};
