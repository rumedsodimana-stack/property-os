import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    Room, Reservation, User, Folio, MasterInventoryItem,
    BanquetEvent, Outlet, PosOrder, Asset, MaintenanceTask, MenuItem,
    Candidate, TrainingModule, Shift, PayrollRun, Supplier, GLAccount,
    PurchaseOrder, ProcurementRequest, RFQ, Invoice, CashierDrop,
    Recipe, RecipeDraft, Incident, Task, Visitor, Table, EmployeeProfile,
    YieldRule,
    ShiftPattern, RosterShift, SystemRole,
    BusinessBlock, LedgerEntry, BrandDocument, BrandChange
} from '../../types';
import { PropertyConfiguration, defaultPropertyConfig } from '../../types/configuration';

import { subscribeToItems } from './firestoreService';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

interface PmsState {
    rooms: Room[];
    reservations: Reservation[];
    guests: User[];
    folios: Folio[];
    inventory: MasterInventoryItem[];
    // New Entities
    tables: Table[]; // Added tables
    events: BanquetEvent[];
    outlets: Outlet[];
    posOrders: PosOrder[];
    assets: Asset[];
    maintenanceTasks: MaintenanceTask[];
    menuItems: MenuItem[];
    candidates: Candidate[];
    trainingModules: TrainingModule[];
    employees: EmployeeProfile[]; // Added employees
    shifts: Shift[];
    payroll: PayrollRun[];
    suppliers: Supplier[];
    glAccounts: GLAccount[];
    purchaseOrders: PurchaseOrder[];
    procurementRequests: ProcurementRequest[];
    rfqs: RFQ[];
    invoices: Invoice[];
    cashierDrops: CashierDrop[];
    recipes: Recipe[];
    recipeDrafts: RecipeDraft[];
    incidents: Incident[];
    tasks: Task[];
    visitors: Visitor[];
    yieldRules: YieldRule[];
    // Added HR collections
    shiftPatterns: ShiftPattern[];
    rosterShifts: RosterShift[];
    systemRoles: SystemRole[];
    businessBlocks: BusinessBlock[];
    ledgerEntries: LedgerEntry[];
    brandDocuments: BrandDocument[];
    brandChanges: BrandChange[];
    clearData: () => void;

    loading: boolean;
    seeding: boolean;
    error: string | null;
}

const initialState: PmsState = {
    rooms: [],
    reservations: [],
    guests: [],
    folios: [],
    inventory: [],
    tables: [],
    events: [],
    outlets: [],
    posOrders: [],
    assets: [],
    maintenanceTasks: [],
    menuItems: [],
    candidates: [],
    trainingModules: [],
    employees: [],
    shifts: [],
    payroll: [],
    suppliers: [],
    glAccounts: [],
    purchaseOrders: [],
    procurementRequests: [],
    rfqs: [],
    invoices: [],
    cashierDrops: [],
    recipes: [],
    recipeDrafts: [],
    incidents: [],
    tasks: [],
    visitors: [],
    yieldRules: [],
    // New collections
    shiftPatterns: [],
    rosterShifts: [],
    systemRoles: [],
    businessBlocks: [],
    ledgerEntries: [],
    brandDocuments: [],
    brandChanges: [],
    clearData: () => { },
    loading: true,
    seeding: false,
    error: null
};

const PmsContext = createContext<PmsState>(initialState);

export const usePms = () => useContext(PmsContext);

export const PmsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [store, setStore] = useState<PmsState>(initialState);

    useEffect(() => {
        // Unsubscribe functions
        const unsubscribers: (() => void)[] = [];

        const init = async () => {
            try {
                // Check if seeded (Rooms OR Inventory missing) - Simple check to trigger seeding
                // Check if seeded (Rooms OR Inventory missing) - Simple check to trigger seeding
                /* 
                const roomsColl = collection(db, 'rooms');
                const pmsSnap = await getCountFromServer(roomsColl);

                if (pmsSnap.data().count === 0) {
                    console.log("Database empty. Seeding...");
                    setStore(s => ({ ...s, seeding: true }));
                    await seedDatabase();
                    setStore(s => ({ ...s, seeding: false }));
                    console.log("Seeding complete.");
                } else {
                    console.log("Database already seeded.");
                }
                */
                // Helper to add subscription
                const sub = <T>(collectionName: string, key: keyof PmsState) => {
                    const unsub = subscribeToItems<T>(collectionName, (items) => {
                        setStore(s => ({ ...s, [key]: items }));
                    });
                    unsubscribers.push(unsub);
                };

                // Subscribe to Core PMS
                sub<Room>('rooms', 'rooms');
                sub<Reservation>('reservations', 'reservations');
                sub<User>('guests', 'guests');
                sub<Folio>('folios', 'folios');
                sub<MasterInventoryItem>('master_inventory', 'inventory');

                // Subscribe to Extended Modules
                sub<BanquetEvent>('events', 'events');
                sub<Table>('tables', 'tables');
                sub<Outlet>('outlets', 'outlets');
                sub<PosOrder>('posOrders', 'posOrders');
                sub<Asset>('assets', 'assets');
                sub<MaintenanceTask>('maintenanceTasks', 'maintenanceTasks');
                sub<MenuItem>('menuItems', 'menuItems');
                sub<Candidate>('candidates', 'candidates');
                sub<TrainingModule>('trainingModules', 'trainingModules');
                sub<EmployeeProfile>('employees', 'employees');
                sub<Shift>('shifts', 'shifts');
                sub<PayrollRun>('payroll', 'payroll');
                sub<ShiftPattern>('shiftPatterns', 'shiftPatterns');
                sub<RosterShift>('rosterShifts', 'rosterShifts');
                sub<SystemRole>('systemRoles', 'systemRoles');
                sub<Supplier>('suppliers', 'suppliers');
                sub<GLAccount>('glAccounts', 'glAccounts');
                sub<PurchaseOrder>('purchaseOrders', 'purchaseOrders');
                sub<ProcurementRequest>('procurementRequests', 'procurementRequests');
                sub<RFQ>('rfqs', 'rfqs');
                sub<Invoice>('invoices', 'invoices');
                sub<CashierDrop>('cashierDrops', 'cashierDrops');
                sub<Recipe>('recipes', 'recipes');
                sub<RecipeDraft>('recipeDrafts', 'recipeDrafts');
                sub<Incident>('incidents', 'incidents');
                sub<Task>('tasks', 'tasks');
                sub<Visitor>('visitors', 'visitors');
                sub<YieldRule>('yieldRules', 'yieldRules');
                sub<BusinessBlock>('businessBlocks', 'businessBlocks');
                sub<LedgerEntry>('ledgerEntries', 'ledgerEntries');
                sub<BrandDocument>('brand_documents', 'brandDocuments');
                sub<BrandChange>('brand_changes', 'brandChanges');

                setStore(s => ({ ...s, loading: false }));

            } catch (error: any) {
                console.error("PMS Init Error:", error);
                setStore(s => ({ ...s, loading: false, error: error.message || 'Unknown PMS Error' }));
            }
        };

        init();

        return () => {
            unsubscribers.forEach(u => u());
        };
    }, []);

    const clearData = async () => {
        try {
            console.log("Starting Hard Wipe...");
            const collections = [
                'rooms', 'reservations', 'guests', 'folios', 'master_inventory',
                'events', 'tables', 'outlets', 'posOrders', 'assets', 'maintenanceTasks',
                'menuItems', 'candidates', 'trainingModules', 'employees', 'shifts',
                'payroll', 'suppliers', 'glAccounts', 'purchaseOrders', 'procurementRequests',
                'rfqs', 'invoices', 'cashierDrops', 'recipes', 'recipeDrafts',
                'incidents', 'tasks', 'visitors', 'yieldRules', 'businessBlocks', 'ledgerEntries',
                'brand_documents', 'brand_changes'
            ];

            for (const colName of collections) {
                const colRef = collection(db, colName);
                const snapshot = await getDocs(colRef);
                const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
                console.log(`Cleared collection: ${colName}`);
            }

            // LocalStorage clear
            localStorage.removeItem('hotel_singularity_db');
            localStorage.removeItem('property_config');
            console.log("Wipe Complete. Reloading...");
            window.location.reload();
        } catch (e) {
            console.error("Failed to clear data", e);
        }
    };

    return React.createElement(PmsContext.Provider, { value: { ...store, clearData } }, children);
};

export const savePropertyConfig = (config: PropertyConfiguration): void => {
    try {
        localStorage.setItem('property_config', JSON.stringify(config));
    } catch (error) {
        console.error('Failed to save property config:', error);
    }
};

export const getPropertyConfig = (): PropertyConfiguration => {
    try {
        const stored = localStorage.getItem('property_config');
        return stored ? JSON.parse(stored) : defaultPropertyConfig;
    } catch (error) {
        console.error('Failed to load property config:', error);
        return defaultPropertyConfig;
    }
};
