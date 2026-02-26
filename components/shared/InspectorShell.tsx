import React from 'react';
import { useInspector } from '../../context/InspectorContext';
import { usePms } from '../../services/kernel/persistence';
import { LedgerEntry } from '../../types'; // Import LedgerEntry for stubbing
import GuestProfileModal from './GuestProfileModal';
import RoomProfileModal from './RoomProfileModal';
import ReservationProfileModal from './ReservationProfileModal';
import InventoryItemModal from './InventoryItemModal';
import SupplierProfileModal from './SupplierProfileModal';
import EventProfileModal from './EventProfileModal';
import AssetProfileModal from './AssetProfileModal';
import MaintenanceTaskModal from './MaintenanceTaskModal';
import VisitorProfileModal from './VisitorProfileModal';
import StaffProfileModal from '../hr/StaffProfileModal';
import CandidateProfileModal from './CandidateProfileModal';
import TrainingModuleModal from './TrainingModuleModal';
import TransactionModal from './TransactionModal';

// Stub for Ledger Entries until Finance module is fully refactored
const LEDGER_ENTRIES: LedgerEntry[] = [];

const InspectorShell: React.FC = () => {
    const { state, closeInspector } = useInspector();
    const {
        rooms, guests, reservations, inventory,
        events, employees, assets, maintenanceTasks,
        visitors, candidates, trainingModules,
        shifts, payroll, suppliers
    } = usePms();

    if (!state.isOpen || !state.type || !state.id) return null;

    const { type, id } = state;

    switch (type) {
        case 'guest': {
            const guest = guests.find(g => g.principal === id);
            if (!guest) return null;
            return <GuestProfileModal guest={guest} onClose={closeInspector} />;
        }
        case 'room': {
            const room = rooms.find(r => r.id === id);
            if (!room) return null;
            return <RoomProfileModal room={room} onClose={closeInspector} />;
        }
        case 'reservation': {
            const reservation = reservations.find(r => r.id === id);
            if (!reservation) return null;
            return <ReservationProfileModal reservation={reservation} onClose={closeInspector} />;
        }
        case 'inventory': {
            const item = inventory.find(i => i.id === id);
            if (!item) return null;
            return <InventoryItemModal item={item} onClose={closeInspector} />;
        }
        case 'supplier': {
            const supplier = suppliers.find(s => s.id === id);
            if (!supplier) return null;
            return <SupplierProfileModal supplier={supplier} onClose={closeInspector} />;
        }
        case 'event': {
            const event = events.find(e => e.id === id);
            if (!event) return null;
            return <EventProfileModal event={event} onClose={closeInspector} />;
        }
        case 'employee': {
            const staff = employees.find(s => s.principal === id);
            if (!staff) return null;
            return (
                <StaffProfileModal
                    employee={staff}
                    shifts={shifts.filter(s => s.employeeId === staff.principal)}
                    payrollHistory={payroll.filter(p => p.employeeId === staff.principal)}
                    onClose={closeInspector}
                />
            );
        }
        case 'asset': {
            const asset = assets.find(a => a.id === id);
            if (!asset) return null;
            return <AssetProfileModal asset={asset} onClose={closeInspector} />;
        }
        case 'maintenance_task': {
            const task = maintenanceTasks.find(t => t.id === id);
            if (!task) return null;
            return <MaintenanceTaskModal task={task} onClose={closeInspector} />;
        }
        case 'visitor': {
            const visitor = visitors.find(v => v.id === id);
            if (!visitor) return null;
            return <VisitorProfileModal visitor={visitor} onClose={closeInspector} />;
        }
        case 'candidate': {
            const candidate = candidates.find(c => c.id === id);
            if (!candidate) return null;
            return <CandidateProfileModal candidate={candidate} onClose={closeInspector} />;
        }
        case 'training_module': {
            const module = trainingModules.find(m => m.id === id);
            if (!module) return null;
            return <TrainingModuleModal module={module} onClose={closeInspector} />;
        }
        case 'transaction': {
            const entry = LEDGER_ENTRIES.find(e => e.id === id);
            if (!entry) return null;
            return <TransactionModal transaction={entry} onClose={closeInspector} />;
        }
        default:
            return null;
    }
};

export default InspectorShell;
