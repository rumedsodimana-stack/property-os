import { addItem, fetchItems, fetchItem, updateItem, deleteItem } from '../kernel/firestoreService';
import { ShiftPattern, RosterShift } from '../../types';

/**
 * Service for managing shift patterns.
 */
export const shiftPatternService = {
    /** Fetch all shift patterns */
    getAll: async (): Promise<ShiftPattern[]> => {
        return await fetchItems<ShiftPattern>('shiftPatterns');
    },
    /** Fetch a single shift pattern by id */
    get: async (id: string): Promise<ShiftPattern | null> => {
        return await fetchItem<ShiftPattern>('shiftPatterns', id);
    },
    /** Create a new shift pattern */
    create: async (data: Omit<ShiftPattern, 'id'>): Promise<string> => {
        const docRef = await addItem('shiftPatterns', data);
        return docRef.id;
    },
    /** Update an existing shift pattern */
    update: async (id: string, data: Partial<ShiftPattern>) => {
        await updateItem('shiftPatterns', id, data);
    },
    /** Delete a shift pattern */
    delete: async (id: string) => {
        await deleteItem('shiftPatterns', id);
    },
};

/**
 * Service for managing roster shifts.
 */
export const rosterShiftService = {
    getAll: async (): Promise<RosterShift[]> => {
        return await fetchItems<RosterShift>('rosterShifts');
    },
    get: async (id: string): Promise<RosterShift | null> => {
        return await fetchItem<RosterShift>('rosterShifts', id);
    },
    create: async (data: Omit<RosterShift, 'id'>): Promise<string> => {
        const docRef = await addItem('rosterShifts', data);
        return docRef.id;
    },
    update: async (id: string, data: Partial<RosterShift>) => {
        await updateItem('rosterShifts', id, data);
    },
    delete: async (id: string) => {
        await deleteItem('rosterShifts', id);
    },
};
