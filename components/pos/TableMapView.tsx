import React, { useState, useEffect, useMemo } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { Outlet, Table } from '../../types';
import { LayoutGrid, List, Users, Clock, Calendar, MapPin, ChevronDown, Plus, User, Phone, Mail, Star, AlertCircle, Cake, Heart, AlertTriangle } from 'lucide-react';
import { subscribeToItems } from '../../services/kernel/firestoreService';

// Dining Reservation Type (different from hotel reservation)
interface DiningReservation {
    id: string;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    partySize: number;
    reservationTime: string;
    arrivalTime?: string;
    tableId?: string;
    outletId: string;
    status: 'Confirmed' | 'Seated' | 'Completed' | 'No Show' | 'Cancelled';
    specialNotes?: string;
    occasion?: 'Birthday' | 'Anniversary' | 'Business' | 'Date Night' | 'Celebration';
    allergies?: string[];
    preferences?: string;
    createdAt: number;
    isVIP?: boolean;
}

interface TableMapViewProps {
    selectedOutlet: Outlet;
    onOutletChange: (outlet: Outlet) => void;
    onSelectTable?: (tableId: string, reservation?: DiningReservation) => void;
}

const TableMapView: React.FC<TableMapViewProps> = ({ selectedOutlet, onOutletChange, onSelectTable }) => {
    const { outlets: OUTLETS, tables: TABLES } = usePms();
    const [view, setView] = useState<'layout' | 'reservations'>('layout');
    const [reservations, setReservations] = useState<DiningReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReservation, setSelectedReservation] = useState<DiningReservation | null>(null);
    const [showGuestProfile, setShowGuestProfile] = useState(false);
    const [showOutletDropdown, setShowOutletDropdown] = useState(false);
    const [showNewReservation, setShowNewReservation] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToItems<DiningReservation>('dining_reservations', (data) => {
            setReservations(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Filter reservations by outlet
    const outletReservations = useMemo(() => {
        return reservations.filter(r => r.outletId === selectedOutlet.id || (OUTLETS[0] && selectedOutlet.id === OUTLETS[0].id));
    }, [reservations, selectedOutlet, OUTLETS]);

    // O(1) lookup for table reservations
    const reservationsByTable = useMemo(() => {
        const map = new Map<string, DiningReservation>();
        outletReservations.forEach(r => {
            if (r.tableId && r.status === 'Confirmed') {
                map.set(r.tableId, r);
            }
        });
        return map;
    }, [outletReservations]);

    // Pagination for tables
    const ITEMS_PER_PAGE = 48;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(TABLES.length / ITEMS_PER_PAGE);
    const visibleTables = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return TABLES.slice(start, start + ITEMS_PER_PAGE);
    }, [TABLES, currentPage]);

    // Auto-allocate table based on party size
    const autoAllocateTable = (partySize: number): string | undefined => {
        const availableTables = TABLES.filter(t => {
            const hasReservation = outletReservations.some(r => r.tableId === t.id && r.status === 'Confirmed');
            return !hasReservation && t.seats >= partySize && t.status === 'Available';
        }).sort((a, b) => a.seats - b.seats); // Get smallest table that fits

        return availableTables[0]?.id;
    };

    const getOccasionIcon = (occasion?: string) => {
        switch (occasion) {
            case 'Birthday': return <Cake className="w-4 h-4 text-pink-400" />;
            case 'Anniversary': return <Heart className="w-4 h-4 text-rose-400" />;
            case 'Business': return <Star className="w-4 h-4 text-amber-400" />;
            default: return null;
        }
    };

    const handleTableClick = (table: Table) => {
        const reservation = reservationsByTable.get(table.id);
        if (onSelectTable) {
            onSelectTable(table.id, reservation);
        }
    };

    const handleGuestClick = (reservation: DiningReservation) => {
        setSelectedReservation(reservation);
        setShowGuestProfile(true);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-500/20">
                        <LayoutGrid className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light text-white tracking-tight">Table Map</h2>
                        <div className="text-xs text-zinc-500">
                            {selectedOutlet.name} • {selectedOutlet.seatingCapacity} seats
                        </div>
                    </div>
                </div>

                {/* Navigation + Outlet Selector */}
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                        <button
                            onClick={() => setView('layout')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${view === 'layout' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Layout
                        </button>
                        <button
                            onClick={() => setView('reservations')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${view === 'reservations' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Reservations
                        </button>
                    </div>

                    {/* Outlet Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowOutletDropdown(!showOutletDropdown)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white hover:border-violet-500/50 transition"
                        >
                            <span className="font-bold text-xs">{selectedOutlet.name}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showOutletDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showOutletDropdown && (
                            <div className="absolute top-full right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl z-50 min-w-[220px] overflow-hidden">
                                <div className="px-4 py-2 text-[10px] text-zinc-500 uppercase font-bold bg-zinc-950/50 border-b border-zinc-800">
                                    Select Outlet
                                </div>
                                {OUTLETS.map(outlet => (
                                    <button
                                        key={outlet.id}
                                        onClick={() => {
                                            onOutletChange(outlet);
                                            setShowOutletDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 transition border-b border-zinc-800/50 last:border-0 ${selectedOutlet.id === outlet.id ? 'bg-violet-600/10 text-violet-400' : 'text-zinc-300'
                                            }`}
                                    >
                                        <div className="font-bold">{outlet.name}</div>
                                        <div className="text-[10px] text-zinc-500">{outlet.type} • {outlet.seatingCapacity} seats</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {view === 'layout' && (
                <div className="flex-1">
                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            Available
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            Reserved
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                            Occupied
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            VIP Reserved
                        </div>
                    </div>

                    {/* Table Layout Grid */}
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {visibleTables.map(table => {
                            const reservation = reservationsByTable.get(table.id);
                            const isReserved = !!reservation;
                            const isVIP = reservation?.isVIP;
                            const isOccupied = table.status === 'Occupied';

                            return (
                                <div
                                    key={table.id}
                                    onClick={() => handleTableClick(table)}
                                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${isVIP ? 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10' :
                                        isReserved ? 'bg-amber-500/10 border-amber-500/50' :
                                            isOccupied ? 'bg-violet-500/10 border-violet-500/50' :
                                                'bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/50'
                                        }`}
                                >
                                    {/* VIP Badge */}
                                    {isVIP && (
                                        <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                                            VIP
                                        </div>
                                    )}

                                    {/* Table Number */}
                                    <div className="text-center mb-2">
                                        <div className="text-2xl font-bold text-white">{table.number}</div>
                                        <div className="text-[10px] text-zinc-500 uppercase">Table</div>
                                    </div>

                                    {/* Seats */}
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <Users className="w-3 h-3 text-zinc-500" />
                                        <span className="text-xs text-zinc-400">{table.seats}</span>
                                    </div>

                                    {/* Reservation Info */}
                                    {isReserved && (
                                        <div className="mt-2 pt-2 border-t border-zinc-800">
                                            <div className="text-[9px] text-zinc-400 truncate">{reservation.guestName}</div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3 text-amber-500" />
                                                <span className="text-[10px] text-amber-500 font-bold">{reservation.reservationTime}</span>
                                            </div>
                                            {reservation.occasion && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    {getOccasionIcon(reservation.occasion)}
                                                    <span className="text-[9px] text-zinc-500">{reservation.occasion}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Status Indicator */}
                                    <div className={`absolute top-2 left-2 w-2 h-2 rounded-full ${isVIP ? 'bg-rose-500' :
                                        isReserved ? 'bg-amber-500' :
                                            isOccupied ? 'bg-violet-500' :
                                                'bg-emerald-500'
                                        }`}></div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Previous
                            </button>
                            <span className="text-xs font-bold text-zinc-500">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {view === 'reservations' && (
                <div className="flex-1">
                    {/* Actions */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-sm text-zinc-500">
                            {outletReservations.length} reservations for today
                        </div>
                        <button
                            onClick={() => setShowNewReservation(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold text-white transition"
                        >
                            <Plus className="w-4 h-4" />
                            New Reservation
                        </button>
                    </div>

                    {/* Reservations List */}
                    <div className="space-y-3">
                        {outletReservations.map(reservation => (
                            <div
                                key={reservation.id}
                                className={`bg-zinc-900/50 border rounded-2xl p-4 hover:bg-zinc-900/80 transition ${reservation.isVIP ? 'border-rose-500/30' : 'border-zinc-800'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    {/* Left: Guest Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {reservation.isVIP && (
                                                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[9px] font-bold rounded-full uppercase">VIP</span>
                                            )}
                                            <span className="text-[10px] text-zinc-600 font-mono">#{reservation.id}</span>
                                        </div>

                                        {/* Guest Name - Clickable */}
                                        <button
                                            onClick={() => handleGuestClick(reservation)}
                                            className="text-lg font-bold text-white hover:text-violet-400 transition text-left"
                                        >
                                            {reservation.guestName}
                                        </button>

                                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {reservation.partySize} guests
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {reservation.reservationTime}
                                            </div>
                                            {reservation.tableId && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    Table {reservation.tableId.split('_')[1]}
                                                </div>
                                            )}
                                        </div>

                                        {/* Special Notes */}
                                        {(reservation.specialNotes || reservation.occasion || reservation.allergies) && (
                                            <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap gap-2">
                                                {reservation.occasion && (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-violet-500/10 text-violet-400 text-[10px] rounded-lg">
                                                        {getOccasionIcon(reservation.occasion)}
                                                        {reservation.occasion}
                                                    </span>
                                                )}
                                                {reservation.allergies?.map((allergy, i) => (
                                                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 text-rose-400 text-[10px] rounded-lg">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {allergy}
                                                    </span>
                                                ))}
                                                {reservation.specialNotes && (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] rounded-lg">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {reservation.specialNotes}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Status & Actions */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${reservation.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                                            reservation.status === 'Seated' ? 'bg-violet-500/10 text-violet-500' :
                                                reservation.status === 'Completed' ? 'bg-zinc-500/10 text-zinc-500' :
                                                    'bg-rose-500/10 text-rose-500'
                                            }`}>
                                            {reservation.status}
                                        </span>

                                        {!reservation.tableId && (
                                            <button
                                                onClick={() => {
                                                    const tableId = autoAllocateTable(reservation.partySize);
                                                    if (tableId) {
                                                        setReservations(prev => prev.map(r =>
                                                            r.id === reservation.id ? { ...r, tableId } : r
                                                        ));
                                                    } else {
                                                        alert('No suitable table available');
                                                    }
                                                }}
                                                className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg transition"
                                            >
                                                Auto-Allocate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Guest Profile Modal */}
            {showGuestProfile && selectedReservation && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-light text-white">Guest Profile</h3>
                            <button
                                onClick={() => setShowGuestProfile(false)}
                                className="text-zinc-500 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Guest Header */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                                    {selectedReservation.guestName.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xl font-bold text-white">{selectedReservation.guestName}</h4>
                                        {selectedReservation.isVIP && (
                                            <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full">VIP</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-zinc-500">Dining Guest</div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                                        <Phone className="w-3 h-3" />
                                        Phone
                                    </div>
                                    <div className="text-white font-medium">{selectedReservation.guestPhone}</div>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                                        <Mail className="w-3 h-3" />
                                        Email
                                    </div>
                                    <div className="text-white font-medium text-sm">{selectedReservation.guestEmail}</div>
                                </div>
                            </div>

                            {/* Reservation Details */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                <h5 className="text-xs text-zinc-500 uppercase font-bold mb-3">Current Reservation</h5>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-[10px] text-zinc-600 uppercase">Party Size</div>
                                        <div className="text-lg font-bold text-white">{selectedReservation.partySize}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-zinc-600 uppercase">Time</div>
                                        <div className="text-lg font-bold text-white">{selectedReservation.reservationTime}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-zinc-600 uppercase">Table</div>
                                        <div className="text-lg font-bold text-white">{selectedReservation.tableId?.split('_')[1] || 'TBD'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Allergies & Preferences */}
                            {(selectedReservation.allergies || selectedReservation.preferences) && (
                                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                                    <h5 className="text-xs text-rose-400 uppercase font-bold mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3" />
                                        Allergies & Preferences
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedReservation.allergies?.map((allergy, i) => (
                                            <span key={i} className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded-lg font-bold">
                                                {allergy}
                                            </span>
                                        ))}
                                        {selectedReservation.preferences && (
                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg">
                                                {selectedReservation.preferences}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedReservation.specialNotes && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <h5 className="text-xs text-zinc-500 uppercase font-bold mb-2">Special Notes</h5>
                                    <p className="text-sm text-zinc-300">{selectedReservation.specialNotes}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowGuestProfile(false)}
                                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold text-white transition"
                            >
                                Close
                            </button>
                            <button className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-bold text-white transition">
                                Edit Reservation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableMapView;
