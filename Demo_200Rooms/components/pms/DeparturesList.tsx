import React, { useState } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { ReservationStatus, RoomStatus } from '../../types';
import { LogOut, Search, Filter, MoreVertical, Hash, BedDouble, User as UserIcon, CheckCircle, CreditCard } from 'lucide-react';
import { ROOM_TYPES } from '../../services/kernel/config';
import { updateItem } from '../../services/kernel/firestoreService';
import { useAuth } from '../../context/AuthContext';

const DeparturesList: React.FC = () => {
    const { reservations, guests, rooms, folios } = usePms();
    const { hasPermission } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [workingResId, setWorkingResId] = useState<string | null>(null);
    const canCheckOut = hasPermission('check_out_guest');

    const today = new Date().toDateString();

    // Filter for today's departures (Status: Checked In, and checkOut date is today)
    // We also include reservations checking out tomorrow that might be early departures, but sticking to today for simplicity
    const departures = reservations.filter(res =>
        res.status === ReservationStatus.CHECKED_IN &&
        new Date(res.checkOut).toDateString() === today
    );

    const filteredDepartures = departures.filter(res => {
        const guest = guests.find(g => g.principal === res.guestId);
        return guest?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            res.id.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleCheckOut = async (e: React.MouseEvent, resId: string) => {
        e.stopPropagation();
        const reservation = reservations.find(r => r.id === resId);
        if (!reservation) return;
        if (!canCheckOut) return;

        const folio = folios.find(f => f.id === reservation.folioId);
        if ((folio?.balance || 0) > 0) return;

        try {
            setWorkingResId(resId);
            const updates: Promise<any>[] = [
                updateItem('reservations', reservation.id, { status: ReservationStatus.CHECKED_OUT }),
            ];

            if (reservation.roomId) {
                updates.push(updateItem('rooms', reservation.roomId, {
                    status: RoomStatus.DIRTY_DEPARTURE,
                    currentGuestId: null
                }));
            }

            if (folio) {
                updates.push(updateItem('folios', folio.id, { status: 'Closed' }));
            }

            await Promise.all(updates);
        } finally {
            setWorkingResId(null);
        }
    };

    const handleSettleAndCheckout = async (e: React.MouseEvent, resId: string) => {
        e.stopPropagation();
        const reservation = reservations.find(r => r.id === resId);
        if (!reservation) return;
        const folio = folios.find(f => f.id === reservation.folioId);
        if (!folio) return;

        try {
            setWorkingResId(resId);
            await updateItem('folios', folio.id, { balance: 0, status: 'Closed' });
            await handleCheckOut(e, resId);
        } finally {
            setWorkingResId(null);
        }
    };

    return (
        <div className="animate-fadeIn flex flex-col h-full">
            {/* View Stats & Quick Search */}
            <div className="flex items-center justify-between mb-4 bg-zinc-900/20 p-2 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3 px-4">
                    <div className="p-1.5 bg-rose-500/10 rounded-lg">
                        <LogOut className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Departures Status</div>
                        <div className="text-sm font-black text-white mt-1">{departures.length} Scheduled</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 transition-all focus-within:border-rose-500/50">
                            <Search className="w-3.5 h-3.5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Filter departures..."
                                className="w-48 bg-transparent border-none outline-none ml-2 text-[11px] text-zinc-200 placeholder:text-zinc-600 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-all uppercase tracking-wider">
                        <Filter size={12} /> Filters
                    </button>
                </div>
            </div>


            <div className="overflow-y-auto flex-1 custom-scrollbar pb-10">
                {filteredDepartures.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredDepartures.map(res => {
                            const guest = guests.find(g => g.principal === res.guestId);
                            const room = rooms.find(r => r.id === res.roomId);
                            const folio = folios.find(f => f.id === res.folioId);
                            const balance = folio ? folio.balance : 0;
                            const hasBalance = balance > 0;

                            return (
                                <div
                                    key={res.id}
                                    className={`group relative bg-zinc-950/50 border ${hasBalance ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-zinc-800/80 hover:border-rose-500/30'} rounded-2xl p-5 hover:bg-zinc-900/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden`}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 font-black text-lg shadow-inner">
                                            {guest?.fullName[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-zinc-200 text-base mb-1 group-hover:text-rose-400 transition-colors">
                                                {guest?.fullName || 'Unknown'}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-mono tracking-wider flex items-center gap-1.5">
                                                <Hash className="w-3 h-3 text-zinc-600" />
                                                #{res.id.split('_')[1]}
                                            </div>
                                        </div>
                                        {hasBalance && (
                                            <div className="absolute top-0 right-0 p-4">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 font-black text-[10px] uppercase shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                                    <CreditCard className="w-3 h-3" /> Balance Due
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-5 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                                        <div>
                                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Room</div>
                                            {room ? (
                                                <div className="flex items-center gap-1.5 pl-1 border-l-2 border-rose-500/50">
                                                    <span className="font-black text-rose-400 text-sm">{room.number}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-500 italic">Unknown</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Folio Balance</div>
                                            <div className={`text-sm font-black ${hasBalance ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                ${balance.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4 mt-auto">
                                        <div className="text-[10px] font-medium text-zinc-500 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" /> ETD: 11:00
                                        </div>

                                        <div className="flex gap-2">
                                            {hasBalance ? (
                                                <button
                                                    onClick={(e) => handleSettleAndCheckout(e, res.id)}
                                                    disabled={workingResId === res.id || !canCheckOut}
                                                    className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-amber-600/10 hover:bg-amber-500 disabled:opacity-50 text-amber-400 hover:text-white rounded-xl border border-amber-500/30 transition-all text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                                >
                                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 pointer-events-none" />
                                                    <CreditCard className="w-3.5 h-3.5 relative z-10" /> <span className="relative z-10">Settle & Out</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleCheckOut(e, res.id)}
                                                    disabled={workingResId === res.id || !canCheckOut}
                                                    className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-rose-600/10 hover:bg-rose-500 disabled:opacity-50 text-rose-400 hover:text-white rounded-xl border border-rose-500/30 transition-all text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                                                >
                                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 pointer-events-none" />
                                                    <LogOut className="w-3.5 h-3.5 relative z-10" /> <span className="relative z-10">Check Out</span>
                                                </button>
                                            )}
                                            <button className="p-2 hover:bg-zinc-700/50 rounded-xl text-zinc-500 hover:text-white border border-transparent hover:border-zinc-600 transition">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-32 text-center relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />
                        <div className="relative z-10 p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl shadow-2xl backdrop-blur-xl">
                            <LogOut className="w-12 h-12 mx-auto mb-4 text-rose-500/30" />
                            <h3 className="text-xl font-bold text-zinc-300 mb-2">No Pendings Departures</h3>
                            <p className="text-sm text-zinc-500 max-w-sm">All scheduled departures matching current filters have been processed or none exist for today.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeparturesList;
