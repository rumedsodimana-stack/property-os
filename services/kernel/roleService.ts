import { addItem, fetchItems, fetchItem, updateItem, deleteItem } from './firestoreService';
import { SystemRole } from '../../types';

/**
 * Service for managing system roles and permissions.
 */
export const roleService = {
    /** Fetch all system roles */
    getAll: async (): Promise<SystemRole[]> => {
        return await fetchItems<SystemRole>('systemRoles');
    },
    /** Fetch a single role by id */
    get: async (id: string): Promise<SystemRole | null> => {
        return await fetchItem<SystemRole>('systemRoles', id);
    },
    /** Create a new system role */
    create: async (data: Omit<SystemRole, 'id'>): Promise<string> => {
        const docRef = await addItem('systemRoles', data);
        return docRef.id;
    },
    /** Update an existing role */
    update: async (id: string, data: Partial<SystemRole>) => {
        await updateItem('systemRoles', id, data);
    },
    /** Delete a role */
    delete: async (id: string) => {
        await deleteItem('systemRoles', id);
    },
};
