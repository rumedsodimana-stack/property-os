import React, { useState } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { ReservationStatus, RoomStatus } from '../../types';
import { LogIn, Search, Filter, MoreVertical, Hash, BedDouble, User as UserIcon, CheckCircle } from 'lucide-react';
import { ROOM_TYPES } from '../../services/kernel/config';
import { updateItem } from '../../services/kernel/firestoreService';
import { useInspector } from '../../context/InspectorContext';
import { useAuth } from '../../context/AuthContext';

const ArrivalsList: React.FC = () => {
    const { reservations, guests, rooms } = usePms();
    const { inspect } = useInspector();
    const { hasPermission } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [workingResId, setWorkingResId] = useState<string | null>(null);
    const canCheckIn = hasPermission('check_in_guest');

    const today = new Date().toDateString();

    // Filter for today's arrivals (Status: Confirmed and checkIn date is today)
    const arrivals = reservations.filter(res =>
        res.status === ReservationStatus.CONFIRMED &&
        new Date(res.checkIn).toDateString() === today
    );

    const filteredArrivals = arrivals.filter(res => {
        const guest = guests.find(g => g.principal === res.guestId);
        return guest?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            res.id.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleCheckIn = async (e: React.MouseEvent, resId: string) => {
        e.stopPropagation();
        const reservation = reservations.find(r => r.id === resId);
        if (!reservation?.roomId) return;
        if (!canCheckIn) return;

        try {
            setWorkingResId(resId);
            await Promise.all([
                updateItem('reservations', resId, { status: ReservationStatus.CHECKED_IN }),
                updateItem('rooms', reservation.roomId, {
                    status: RoomStatus.OCCUPIED,
                    currentGuestId: reservation.guestId
                })
            ]);
        } finally {
            setWorkingResId(null);
        }
    };

    return (
        <div className="animate-fadeIn flex flex-col h-full">
            {/* View Stats & Quick Search */}
            <div className="flex items-center justify-between mb-4 bg-zinc-900/20 p-2 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3 px-4">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                        <LogIn className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Arrivals Status</div>
                        <div className="text-sm font-black text-white mt-1">{arrivals.length} Scheduled</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 transition-all focus-within:border-emerald-500/50">
                            <Search className="w-3.5 h-3.5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Filter arrivals..."
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
                {filteredArrivals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredArrivals.map(res => {
                            const guest = guests.find(g => g.principal === res.guestId);
                            const roomType = ROOM_TYPES.find(t => t.id === res.roomTypeId);
                            const room = rooms.find(r => r.id === res.roomId);

                            return (
                                <div
                                    key={res.id}
                                    className="group relative bg-zinc-950/50 border border-zinc-800/80 hover:border-emerald-500/30 rounded-2xl p-5 hover:bg-zinc-900/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
                                    onClick={() => inspect('reservation', res.id)}
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                        {guest?.loyaltyTier !== 'Member' && (
                                            <span className={`text-[9px] uppercase font-black px-2 py-1 rounded-lg border ${guest?.loyaltyTier === 'Diamond' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.2)]' :
                                                'text-amber-500 border-amber-500/30 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                                }`}>
                                                {guest?.loyaltyTier}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-black text-lg shadow-inner">
                                            {guest?.fullName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-zinc-200 text-base mb-1 group-hover:text-emerald-400 transition-colors">
                                                {guest?.fullName || 'Unknown'}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 font-mono tracking-wider flex items-center gap-1.5">
                                                <Hash className="w-3 h-3 text-zinc-600" />
                                                #{res.id.split('_')[1]}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-5 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                                        <div>
                                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Room Type</div>
                                            <div className="text-xs font-bold text-zinc-300">{roomType?.name || 'Standard'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Assigned Room</div>
                                            {room ? (
                                                <div className="flex items-center gap-1.5 pl-1 border-l-2 border-emerald-500/50">
                                                    <span className="font-black text-emerald-400 text-sm">{room.number}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 pl-1 border-l-2 border-amber-500/50">
                                                    <span className="text-xs font-bold text-amber-500">Unassigned</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4 mt-auto">
                                        <div className="text-[10px] font-medium text-zinc-500 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" /> ETA: 14:00
                                        </div>

                                        <div className="flex gap-2">
                                            {room ? (
                                                <button
                                                    onClick={(e) => handleCheckIn(e, res.id)}
                                                    disabled={workingResId === res.id || !canCheckIn}
                                                    className="group/btn relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-500 disabled:opacity-50 text-emerald-400 hover:text-white rounded-xl border border-emerald-500/30 transition-all text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                                >
                                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 pointer-events-none" />
                                                    <CheckCircle className="w-4 h-4 relative z-10" /> <span className="relative z-10">Authorize</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); inspect('reservation', res.id); }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600/10 hover:bg-amber-600 disabled:opacity-50 text-amber-400 hover:text-black rounded-xl border border-amber-500/30 transition-all text-xs font-bold uppercase tracking-wider"
                                                >
                                                    <BedDouble className="w-4 h-4" /> Prep Room
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-32 text-center relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
                        <div className="relative z-10 p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl shadow-2xl backdrop-blur-xl">
                            <LogIn className="w-12 h-12 mx-auto mb-4 text-emerald-500/30" />
                            <h3 className="text-xl font-bold text-zinc-300 mb-2">No Pendings Arrivals</h3>
                            <p className="text-sm text-zinc-500 max-w-sm">All scheduled arrivals matching current filters have been processed or none exist for today.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArrivalsList;
