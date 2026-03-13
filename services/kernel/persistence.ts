import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
    Room, Reservation, User, Folio, MasterInventoryItem,
    BanquetEvent, Outlet, PosOrder, Asset, MaintenanceTask, MenuItem,
    Candidate, TrainingModule, Shift, PayrollRun, Supplier, GLAccount,
    PurchaseOrder, ProcurementRequest, RFQ, Invoice, CashierDrop,
    Recipe, RecipeDraft, Incident, Task, Visitor, Table, EmployeeProfile,
    YieldRule, CompsetSnapshot, DemandEvent, RateRecommendation, RatePushLog, LosRestriction,
    ShiftPattern, RosterShift, SystemRole,
    BusinessBlock, LedgerEntry, BrandDocument, BrandChange, GuestKey
} from '../../types';
import { PropertyConfiguration, defaultPropertyConfig } from '../../types/configuration';

import { subscribeToItems } from './firestoreService';
import { collection, getDocs, deleteDoc, getCountFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { tenantService } from './tenantService';
import { seedDatabase } from './seeder';

export const PROPERTY_CONFIG_UPDATED_EVENT = 'hs:property-config-updated';

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
    maintenance?: MaintenanceTask[]; // Alias for maintenanceTasks
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
    guestKeys: GuestKey[];
    compsetSnapshots: CompsetSnapshot[];
    demandEvents: DemandEvent[];
    rateRecommendations: RateRecommendation[];
    ratePushLogs: RatePushLog[];
    losRestrictions: LosRestriction[];
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
    guestKeys: [],
    compsetSnapshots: [],
    demandEvents: [],
    rateRecommendations: [],
    ratePushLogs: [],
    losRestrictions: [],
    clearData: () => { },
    loading: true,
    seeding: false,
    error: null
};

const PmsContext = createContext<PmsState>(initialState);

export const usePms = () => useContext(PmsContext);

export const PmsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [store, setStore] = useState<PmsState>(initialState);
    const unsubscribersRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        const init = async () => {
            try {
                const activePropertyId = tenantService.getActivePropertyId();
                console.log(`[PMS] Bootstrapping tenant scope: ${activePropertyId}`);

                // ── Demo-only auto-seeding ────────────────────────────────
                // Only seed when the active property is a demo property
                // (identified by the 'demo_property_' prefix). Real enrolled
                // hotels start empty and are populated exclusively by user
                // input or AI-assisted data entry — never auto-seeded.
                const isDemoProperty = activePropertyId.startsWith('demo_property_');
                if (isDemoProperty) {
                    try {
                        const roomsColl = collection(db, `properties/${activePropertyId}/rooms`);
                        const countSnap = await getCountFromServer(roomsColl);
                        if (countSnap.data().count === 0) {
                            console.log('[PMS] Demo property is empty — seeding demo data…');
                            setStore(s => ({ ...s, seeding: true }));
                            await seedDatabase();
                            setStore(s => ({ ...s, seeding: false }));
                            console.log('[PMS] Demo seeding complete.');
                        } else {
                            console.log('[PMS] Demo property already seeded — skipping.');
                        }
                    } catch (seedErr) {
                        console.warn('[PMS] Demo seeding check failed (non-fatal):', seedErr);
                        setStore(s => ({ ...s, seeding: false }));
                    }
                }
                // Helper to add subscription
                const sub = <T>(collectionName: string, key: keyof PmsState, strict = true) => {
                    const unsub = subscribeToItems<T>(collectionName, (items) => {
                        setStore(s => ({ ...s, [key]: items }));
                    }, (error) => {
                        console.error(`[PMS] Subscription failed for ${collectionName}:`, error);
                        if (!strict) return;
                        setStore(s => ({
                            ...s,
                            error: `Data source unavailable for "${collectionName}". Check auth/permissions.`
                        }));
                    });
                    unsubscribersRef.current.push(unsub);
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
                sub<GuestKey>('guest_keys', 'guestKeys', false);
                sub<CompsetSnapshot>('compset_snapshots', 'compsetSnapshots', false);
                sub<DemandEvent>('demand_events', 'demandEvents', false);
                sub<RateRecommendation>('rate_recommendations', 'rateRecommendations', false);
                sub<RatePushLog>('rate_push_log', 'ratePushLogs', false);
                sub<LosRestriction>('los_restrictions', 'losRestrictions', false);

                setStore(s => ({ ...s, loading: false }));

            } catch (error: any) {
                console.error("PMS Init Error:", error);
                setStore(s => ({ ...s, loading: false, error: error.message || 'Unknown PMS Error' }));
            }
        };

        init();

        return () => {
            unsubscribersRef.current.forEach(u => u());
            unsubscribersRef.current = [];
        };
    }, []);

    const clearData = async () => {
        if (import.meta.env.PROD) {
            console.warn('[PMS] clearData() is disabled in production');
            return;
        }
        try {
            console.log("Starting Hard Wipe...");
            const collections = [
                'rooms', 'reservations', 'guests', 'folios', 'master_inventory',
                'events', 'tables', 'outlets', 'posOrders', 'assets', 'maintenanceTasks',
                'menuItems', 'candidates', 'trainingModules', 'employees', 'shifts',
                'payroll', 'suppliers', 'glAccounts', 'purchaseOrders', 'procurementRequests',
                'rfqs', 'invoices', 'cashierDrops', 'recipes', 'recipeDrafts',
                'incidents', 'tasks', 'visitors', 'yieldRules', 'businessBlocks', 'ledgerEntries',
                'brand_documents', 'brand_changes', 'guest_keys', 'guest_key_events',
                'ota_events', 'ota_reservations', 'payment_intents', 'payment_refunds', 'room_service_orders',
                'gds_events', 'gds_reservations', 'guest_messages', 'api_clients', 'api_webhooks',
                'loyalty_ledger', 'reviews', 'review_responses', 'review_stats', 'review_channels', 'post_stay_surveys',
                'compset_snapshots', 'demand_events', 'rate_recommendations', 'rate_push_log', 'los_restrictions'
            ];

            for (const colName of collections) {
                const colRef = collection(db, `properties/${tenantService.getActivePropertyId()}/${colName}`);
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
        window.dispatchEvent(new CustomEvent<PropertyConfiguration>(PROPERTY_CONFIG_UPDATED_EVENT, { detail: config }));
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
