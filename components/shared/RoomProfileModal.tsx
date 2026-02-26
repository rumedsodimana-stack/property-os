
import React, { useState } from 'react';
import { Room, RoomStatus, User, Reservation, LoyaltyTier, ReservationStatus } from '../../types';
// import { CLEANING_HISTORY, ROOM_MAINTENANCE_LOG, ROOM_ASSETS, CURRENT_PROPERTY } from '../../services/mockData';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import { X, MapPin, User as UserIcon, Calendar, CheckCircle, AlertTriangle, Activity, Wrench, DollarSign, Clock, Lock, Thermometer, ShieldCheck, Hash, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import GuestProfileModal from './GuestProfileModal';
import { botEngine } from '../../services/kernel/systemBridge';
import { usePms } from '../../services/kernel/persistence';
import { updateItem } from '../../services/kernel/firestoreService';

interface RoomProfileModalProps {
    room: Room;
    onClose: () => void;
}

const RoomProfileModal: React.FC<RoomProfileModalProps> = ({ room, onClose }) => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'History' | 'Maintenance' | 'Folio'>('Overview');

    // Use PMS Store to get live data
    const { reservations, guests, folios, loading, assets, maintenanceTasks } = usePms();

    // Drill Down State
    const [drillGuest, setDrillGuest] = useState<User | null>(null);

    // Hydrate Data from Store instead of Mock
    const currentRes = reservations.find(r => r.roomId === room.id && (r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.CONFIRMED));
    const currentGuest = currentRes ? guests.find(g => g.principal === currentRes.guestId) : null;
    const history = reservations.filter(r => r.roomId === room.id && r.status === ReservationStatus.CHECKED_OUT).sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime());

    // Keep these as mock for now until Maintenance/Assets are in store
    const maintenance = maintenanceTasks.filter((m: any) => m.roomId === room.id); // Cast if needed or ensure MaintenanceTask has roomId (it should)
    const cleaning: any[] = []; // CLEANING_HISTORY.filter(c => c.roomId === room.id);
    const roomAssets = assets.filter((a: any) => a.location === room.number || a.location === room.id); // Assuming simple match

    const getStatusColor = (status: RoomStatus | string) => {
        switch (status) {
            case RoomStatus.CLEAN_READY: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
            case RoomStatus.OCCUPIED: return 'bg-violet-500/20 text-violet-400 border-violet-500/50';
            case RoomStatus.DIRTY_DEPARTURE: return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
            case RoomStatus.MAINTENANCE: return 'bg-zinc-700/50 text-zinc-400 border-zinc-600';
            default: return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
        }
    };

    const handleGuestClick = (guest: User) => {
        setDrillGuest(guest);
    };

    // Live Folio Data
    const activeFolio = currentRes ? folios.find(f => f.reservationId === currentRes.id) : null;
    const balance = activeFolio ? activeFolio.balance : 0;

    const handleCheckOut = async () => {
        if (!currentRes || !currentGuest) return;

        // Validation: Check Balance
        if (balance > 0) {
            alert(`Cannot check out. Guest has an outstanding balance of ${CONFIG_PROPERTY.currency} ${balance}. Please settle folio first.`);
            setActiveTab('Folio' as any); // Auto-switch to Folio tab
            return;
        }

        if (confirm(`Check out ${currentGuest.fullName}?`)) {
            try {
                // Update Folio Status if exists
                if (activeFolio) {
                    await updateItem('folios', activeFolio.id, { status: 'Closed' });
                }

                // Update Reservation Status
                await updateItem('reservations', currentRes.id, { status: ReservationStatus.CHECKED_OUT });
                // Update Room Status
                await updateItem('rooms', room.id, { status: RoomStatus.DIRTY_DEPARTURE, currentGuestId: null });

                botEngine.logActivity('PMS', 'CHECK_OUT', `Guest ${currentGuest.fullName} checked out of ${room.number}`, 'System');
                onClose();
            } catch (error) {
                console.error("Check-out failed", error);
                alert("Failed to process check-out. See console for details.");
            }
        }
    };

    const handleCheckIn = async () => {
        // Find an arbitrary arrival for demo purposes if none assigned
        // In real app, this would open a guest selection modal
        // Using STORE data now
        const arrival = reservations.find(r => r.status === ReservationStatus.CONFIRMED && (!r.roomId || r.roomId === room.id));

        if (arrival) {
            const arrivalGuest = guests.find(g => g.principal === arrival.guestId);
            if (confirm(`Check in ${arrivalGuest?.fullName || 'Guest'}?`)) {
                try {
                    await updateItem('reservations', arrival.id, { status: ReservationStatus.CHECKED_IN, roomId: room.id });
                    await updateItem('rooms', room.id, { status: RoomStatus.OCCUPIED, currentGuestId: arrival.guestId });

                    botEngine.logActivity('PMS', 'CHECK_IN', `Guest checked into ${room.number}`, 'System');
                    onClose();
                } catch (error) {
                    console.error("Check-in failed", error);
                }
            }
        } else {
            alert("No arrivals found for this room type.");
        }
    };

    const renderOverview = () => (
        <div className="grid grid-cols-2 gap-6 animate-fadeIn">
            <div className="space-y-6">
                <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
                    <h4 className="text-xs text-zinc-500 uppercase font-bold mb-4 flex items-center justify-between">
                        <span>Current Status</span>
                        <span className="font-mono text-[10px] text-zinc-600">SYS_ID: {room.id}</span>
                    </h4>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`px-4 py-1.5 rounded-full border text-sm font-bold ${getStatusColor(room.status)}`}>
                            {room.status}
                        </div>
                        <div className="text-zinc-400 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Last Cleaned: {cleaning[0] ? new Date(cleaning[0].date).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col items-center">
                            <Thermometer className="w-5 h-5 text-amber-500 mb-1" />
                            <span className="text-xl font-mono text-zinc-200">{room.iotStatus.temp}°C</span>
                            <span className="text-[10px] text-zinc-500">Climate</span>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col items-center">
                            <Lock className={`w-5 h-5 mb-1 ${room.iotStatus.doorLocked ? 'text-emerald-500' : 'text-rose-500'}`} />
                            <span className="text-xl font-mono text-zinc-200">{room.iotStatus.doorLocked ? 'Locked' : 'Open'}</span>
                            <span className="text-[10px] text-zinc-500">Security</span>
                        </div>
                    </div>
                </div>

                {currentGuest ? (
                    <div
                        onClick={() => handleGuestClick(currentGuest)}
                        className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 cursor-pointer hover:border-violet-500/50 transition group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition text-violet-500">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs text-zinc-500 uppercase font-bold mb-4">Current Guest</h4>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-violet-900/20 group-hover:scale-110 transition">
                                {currentGuest.fullName[0]}
                            </div>
                            <div>
                                <div className="text-lg font-medium text-zinc-200 group-hover:text-violet-400 transition">{currentGuest.fullName}</div>
                                <div className="text-xs text-zinc-500 flex items-center gap-2">
                                    {currentGuest.loyaltyTier && <span className="text-amber-500 font-bold">{currentGuest.loyaltyTier}</span>}
                                    <span>•</span>
                                    <span className="font-mono">ID: {currentGuest.principal.split('_')[1]}</span>
                                </div>
                            </div>
                        </div>
                        {/* Check Out Action */}
                        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckOut();
                                }}
                                className="bg-zinc-950 hover:bg-rose-900/20 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2"
                            >
                                <LogOut className="w-3 h-3" /> Check Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center h-40 gap-3 text-zinc-500">
                        <span className="italic">Room is currently vacant.</span>
                        {/* Check In Action for Arrivals */}
                        <button
                            onClick={handleCheckIn}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition"
                        >
                            <LogIn className="w-4 h-4" /> Check In Arrival
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
                    <h4 className="text-xs text-zinc-500 uppercase font-bold mb-4">Quick Actions</h4>
                    <div className="grid grid-cols-1 gap-3">
                        <button className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition text-sm text-zinc-300 group">
                            <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-violet-500" /> Request Cleaning</span>
                            <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded group-hover:bg-zinc-800">Auto-Assign</span>
                        </button>
                        <button className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition text-sm text-zinc-300 group">
                            <span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-500" /> Report Issue</span>
                            <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded group-hover:bg-zinc-800">Eng</span>
                        </button>
                        <button className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition text-sm text-zinc-300 group">
                            <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-teal-500" /> Digital Key Reset</span>
                            <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded group-hover:bg-zinc-800">IoT</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden animate-fadeIn">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold">
                    <tr>
                        <th className="px-6 py-4">Guest</th>
                        <th className="px-6 py-4">Stay Dates</th>
                        <th className="px-6 py-4">Rate</th>
                        <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {history.map(res => {
                        const g = guests.find(u => u.principal === res.guestId);
                        return (
                            <tr key={res.id} className="hover:bg-zinc-900/50 transition">
                                <td className="px-6 py-4">
                                    {g ? (
                                        <button
                                            onClick={() => handleGuestClick(g)}
                                            className="text-zinc-200 font-medium hover:text-violet-400 hover:underline flex flex-col items-start"
                                        >
                                            <span>{g.fullName}</span>
                                            <span className="text-[9px] text-zinc-500 font-mono no-underline">ID: {g.principal.split('_')[1]}</span>
                                        </button>
                                    ) : <span className="text-zinc-500 italic">Unknown</span>}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">{new Date(res.checkIn).toLocaleDateString()} - {new Date(res.checkOut).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-mono">{CONFIG_PROPERTY.currency} {res.rateApplied}</td>
                                <td className="px-6 py-4"><span className="bg-zinc-800 text-zinc-500 px-2 py-1 rounded text-[10px] uppercase font-bold">Completed</span></td>
                            </tr>
                        );
                    })}
                    {history.length === 0 && (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-600 italic">No history records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderFolio = () => {
        if (!activeFolio) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500 animate-fadeIn">
                    <p className="mb-2">No active folio found for this reservation.</p>
                    <button className="text-violet-400 text-xs hover:underline">Create New Folio</button>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Total Charges</div>
                        <div className="text-2xl font-light text-zinc-100">{CONFIG_PROPERTY.currency} {activeFolio.charges.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Outstanding Balance</div>
                        <div className={`text-2xl font-light ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {CONFIG_PROPERTY.currency} {balance.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/30">
                        <h4 className="text-xs text-zinc-500 uppercase font-bold">Folio Charges</h4>
                        <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Post Charge
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-sm text-zinc-400">
                            <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {activeFolio.charges.map(charge => (
                                    <tr key={charge.id} className="hover:bg-zinc-800/30 transition">
                                        <td className="px-6 py-3 font-mono text-xs">{new Date(charge.timestamp).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-zinc-300">{charge.description}</td>
                                        <td className="px-6 py-3"><span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px]">{charge.category}</span></td>
                                        <td className="px-6 py-3 font-mono text-right text-zinc-200">{charge.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {activeFolio.charges.length === 0 && (
                            <div className="text-center py-8 text-zinc-600 italic text-xs">No charges posted yet.</div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg text-zinc-400 text-xs font-bold transition">
                        Print Statement
                    </button>
                    {balance > 0 && (
                        <button
                            onClick={() => {
                                // Mock settlement logic for now
                                if (confirm(`Process payment of ${CONFIG_PROPERTY.currency} ${balance} for guest ${currentGuest?.fullName}?`)) {
                                    updateItem('folios', activeFolio.id, { balance: 0 }); // In real app, adds a negative 'Payment' charge
                                }
                            }}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/20 transition flex items-center gap-2"
                        >
                            <DollarSign className="w-4 h-4" /> Settle Balance
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderMaintenance = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-4">
                {maintenance.map(log => (
                    <div key={log.id} className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${log.status === 'Closed' ? 'bg-zinc-800 text-zinc-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                <Wrench className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-200">{log.issue}</div>
                                <div className="text-xs text-zinc-500">{new Date(log.date).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xs font-bold uppercase px-2 py-1 rounded mb-1 ${log.status === 'Closed' ? 'bg-zinc-800 text-zinc-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {log.status}
                            </div>
                            {log.cost > 0 && <div className="text-xs text-zinc-400 font-mono">Cost: {log.cost}</div>}
                        </div>
                    </div>
                ))}
                {maintenance.length === 0 && <div className="text-zinc-600 text-sm text-center p-8">No maintenance logs recorded.</div>}
            </div>

            <h4 className="text-xs text-zinc-500 uppercase font-bold mt-6 mb-2">Room Assets</h4>
            <div className="grid grid-cols-2 gap-4">
                {roomAssets.map((asset: any) => (
                    <div key={asset.id} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                        <span className="text-sm text-zinc-300">{asset.name}</span>
                        <span className="text-[10px] text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded">{asset.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
                <div
                    className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* Header */}
                    <div className="relative z-10 px-8 pt-8 pb-4 flex justify-between items-start border-b border-zinc-800">
                        <div>
                            <h2 className="text-3xl font-light text-zinc-100 flex items-center gap-3">
                                Room {room.number}
                                <span className="text-sm bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-zinc-400 font-mono tracking-wide">
                                    {room.typeId.toUpperCase().replace('RT_', '')}
                                </span>
                            </h2>
                            <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Floor {room.number[0]}</span>
                                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Sensor Online</span>
                                <span className="flex items-center gap-1 font-mono text-zinc-600"><Hash className="w-3 h-3" /> {room.id}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition border border-zinc-800">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-8 border-b border-zinc-800 bg-zinc-900/30">
                        {['Overview', 'History', 'Maintenance', 'Folio'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-4 text-sm font-medium transition relative ${activeTab === tab ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500"></div>}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-8 overflow-y-auto flex-1 bg-zinc-950">
                        {activeTab === 'Overview' && renderOverview()}
                        {activeTab === 'History' && renderHistory()}
                        {activeTab === 'Maintenance' && renderMaintenance()}
                        {activeTab === 'Folio' && renderFolio()}
                    </div>
                </div>
            </div>

            {/* Drill Down to Guest */}
            {drillGuest && (
                <div className="z-[70] relative">
                    <GuestProfileModal
                        guest={drillGuest}
                        onClose={() => setDrillGuest(null)}
                    />
                </div>
            )}
        </>
    );
};

export default RoomProfileModal;
