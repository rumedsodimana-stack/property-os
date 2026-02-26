import React, { useMemo, useState, useEffect, useRef } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { ReservationStatus, RoomStatus } from '../../types';
import { Calendar, ChevronLeft, ChevronRight, User as UserIcon, BedDouble } from 'lucide-react';

const ROW_HEIGHT = 56;
const BUFFER = 5;

const RoomPlan: React.FC = () => {
    const { rooms, reservations, guests } = usePms();
    const [startDate, setStartDate] = useState(new Date());
    const [scrollTop, setScrollTop] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    // Generate 14 days of headers
    const daysToShow = 14;
    const dateHeaders = useMemo(() => {
        const headers = [];
        for (let i = 0; i < daysToShow; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            headers.push(d);
        }
        return headers;
    }, [startDate]);

    const viewStart = useMemo(() => new Date(dateHeaders[0]).setHours(0, 0, 0, 0), [dateHeaders]);
    const viewEnd = useMemo(() => new Date(dateHeaders[13]).setHours(23, 59, 59, 999), [dateHeaders]);

    const reservationsByRoom = useMemo(() => {
        const map = new Map<string, typeof reservations>();
        reservations.forEach(r => {
            if (r.roomId && r.status !== 'Cancelled' &&
                new Date(r.checkOut).getTime() >= viewStart &&
                new Date(r.checkIn).getTime() <= viewEnd) {
                if (!map.has(r.roomId)) map.set(r.roomId, []);
                map.get(r.roomId)!.push(r);
            }
        });
        return map;
    }, [reservations, viewStart, viewEnd]);

    const totalHeight = rooms.length * ROW_HEIGHT;
    const [containerHeight, setContainerHeight] = useState(800);

    useEffect(() => {
        if (scrollRef.current) {
            const observer = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    setContainerHeight(entry.contentRect.height);
                }
            });
            observer.observe(scrollRef.current);
            return () => observer.disconnect();
        }
    }, []);

    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
    const endIndex = Math.min(rooms.length - 1, Math.floor((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER);

    const visibleRooms = rooms.slice(startIndex, endIndex + 1);



    const handleNext = () => {
        const next = new Date(startDate);
        next.setDate(next.getDate() + 7);
        setStartDate(next);
    };

    const handlePrev = () => {
        const prev = new Date(startDate);
        prev.setDate(prev.getDate() - 7);
        setStartDate(prev);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case ReservationStatus.CHECKED_IN: return 'bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)] group-hover/res:shadow-[0_0_20px_rgba(139,92,246,0.3)] group-hover/res:border-violet-400 group-hover/res:bg-violet-500/30';
            case ReservationStatus.CONFIRMED: return 'bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)] group-hover/res:shadow-[0_0_20px_rgba(20,184,166,0.3)] group-hover/res:border-teal-400 group-hover/res:bg-teal-500/30';
            case ReservationStatus.CHECKED_OUT: return 'bg-zinc-600/20 border-zinc-600/50 text-zinc-400 shadow-[0_0_15px_rgba(82,82,91,0.15)] group-hover/res:shadow-[0_0_20px_rgba(82,82,91,0.3)] group-hover/res:border-zinc-500 group-hover/res:bg-zinc-600/30';
            default: return 'bg-zinc-800/80 border-zinc-700 text-zinc-400 group-hover/res:bg-zinc-700 group-hover/res:border-zinc-600';
        }
    };

    return (
        <div className="animate-fadeIn flex flex-col h-full">
            {/* View Stats & Navigation */}
            <div className="flex items-center justify-between mb-4 bg-zinc-900/20 p-2 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3 px-4">
                    <div className="p-1.5 bg-violet-500/10 rounded-lg">
                        <Calendar className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Timeline Overview</div>
                        <div className="text-sm font-black text-white mt-1">
                            {startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} — {dateHeaders[13].toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-xl">
                    <button onClick={handlePrev} className="p-2 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition group"><ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /></button>
                    <button onClick={handleNext} className="p-2 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition group"><ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></button>
                </div>
            </div>

            {/* Gantt Area */}
            <div className="flex-1 overflow-hidden relative shadow-2xl z-10">

                {/* Fixed Unassigned Reservations Bucket */}
                <div className="h-20 border-b border-zinc-800/80 shrink-0 flex items-center px-6 bg-zinc-950/60 relative z-20">
                    <div className="flex flex-col items-center justify-center mr-6 border-r border-zinc-800/80 pr-6">
                        <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5" /> Unassigned</span>
                        <span className="text-xs font-bold text-zinc-500 mt-0.5">Pendings</span>
                    </div>

                    <div className="flex-1 overflow-x-auto scrollbar-hide flex gap-3 h-full items-center">
                        {reservations.filter(r => !r.roomId && r.status !== 'Cancelled').map(res => {
                            const guest = guests.find(g => g.principal === res.guestId);
                            return (
                                <div key={res.id} className="min-w-[160px] p-2.5 bg-zinc-900/80 border border-zinc-700/50 hover:border-amber-500/50 rounded-xl shrink-0 cursor-pointer hover:bg-zinc-800 transition-all duration-300 group shadow-lg flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                        {guest?.fullName[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-zinc-200 truncate group-hover:text-amber-400 transition-colors">{guest?.fullName}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono tracking-wider mt-0.5 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {new Date(res.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Main Grid Header */}
                <div className="flex border-b border-zinc-800/80 bg-zinc-950/80 shrink-0 relative z-20 shadow-md">
                    <div className="w-28 shrink-0 border-r border-zinc-800/80 p-3 flex items-center justify-center bg-zinc-900/50">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">RM / Type</span>
                    </div>
                    <div className="flex-1 flex min-w-max relative">
                        {/* Playhead for 'Today' Header Indicator */}
                        {dateHeaders.some(d => d.toDateString() === new Date().toDateString()) && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,1)] z-30"
                                style={{
                                    left: `${(dateHeaders.findIndex(d => d.toDateString() === new Date().toDateString()) / 14) * 100}%`,
                                    marginLeft: '50px' // Center roughly in a 100px min-width column
                                }}
                            />
                        )}

                        {dateHeaders.map((date, i) => {
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            return (
                                <div key={i} className={`flex-1 min-w-[100px] border-r border-zinc-800/50 p-2 text-center flex flex-col items-center justify-center ${isWeekend ? 'bg-zinc-900/30' : ''} ${isToday ? 'bg-violet-900/10' : ''}`}>
                                    <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isToday ? 'text-violet-400' : 'text-zinc-500'}`}>
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className={`text-base font-black ${isToday ? 'text-violet-300 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'text-zinc-300'}`}>
                                        {date.getDate()}
                                    </div>
                                    <div className={`text-[8px] font-bold uppercase tracking-widest opacity-50 ${isToday ? 'text-violet-400' : 'text-zinc-600'}`}>
                                        {date.toLocaleDateString('en-US', { month: 'short' })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Main Grid Body */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-auto custom-scrollbar relative bg-zinc-950/40"
                >
                    {/* Horizontal Vertical Grid Lines (Visible only behind rows) */}
                    <div className="absolute top-0 left-28 bottom-0 right-0 flex pointer-events-none min-w-max">
                        {/* Today Playhead Line in Body */}
                        {dateHeaders.some(d => d.toDateString() === new Date().toDateString()) && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.3)] z-30 pointer-events-none"
                                style={{
                                    left: `${(dateHeaders.findIndex(d => d.toDateString() === new Date().toDateString()) / 14) * 100}%`,
                                    marginLeft: '50px'
                                }}
                            />
                        )}
                        {dateHeaders.map((_, i) => (
                            <div key={`col-${i}`} className="flex-1 min-w-[100px] border-r border-zinc-800/30"></div>
                        ))}
                    </div>

                    {/* Virtualized Container */}
                    <div
                        className="min-w-max relative"
                        style={{ height: `${totalHeight}px` }}
                    >
                        {visibleRooms.map((room, index) => {
                            const actualIndex = startIndex + index;
                            const roomReservations = reservationsByRoom.get(room.id) || [];

                            return (
                                <div
                                    key={room.id}
                                    className="flex border-b border-zinc-800/40 hover:bg-white/5 transition-colors group h-14 absolute left-0 right-0"
                                    style={{ top: `${actualIndex * ROW_HEIGHT}px`, width: '100%' }}
                                >
                                    <div className="w-28 shrink-0 border-r border-zinc-800 p-2 flex flex-col items-center justify-center bg-zinc-950/80 z-20 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
                                        <span className="text-base font-black text-zinc-200 drop-shadow-md">{room.number}</span>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md mt-0.5 border ${room.status === RoomStatus.CLEAN_READY ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                            room.status.includes('Dirty') ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                                'text-zinc-500 bg-zinc-900 border-zinc-800'
                                            }`}>{room.status.split('/')[0]}</span>
                                    </div>

                                    {/* The Bars Area for This Room */}
                                    <div className="flex-1 relative min-w-[1400px]"> {/* 100px min-w per day * 14 days = 1400 */}
                                        {roomReservations.map(res => {
                                            const checkIn = new Date(res.checkIn);
                                            const checkOut = new Date(res.checkOut);

                                            // Calculate bar position and width relative to the 14-day view
                                            const viewStartTime = new Date(dateHeaders[0]).getTime();
                                            const msPerDay = 1000 * 60 * 60 * 24;

                                            // Left Offset (cap at 0 if starts before view)
                                            let leftOffsetDays = (checkIn.getTime() - viewStartTime) / msPerDay;
                                            if (leftOffsetDays < 0) leftOffsetDays = 0;

                                            // Width (cap at end of view)
                                            let durationDays = (checkOut.getTime() - checkIn.getTime()) / msPerDay;
                                            if (checkIn.getTime() < viewStartTime) {
                                                durationDays = (checkOut.getTime() - viewStartTime) / msPerDay;
                                            }
                                            if (leftOffsetDays + durationDays > 14) {
                                                durationDays = 14 - leftOffsetDays;
                                            }

                                            // Convert to percentages based on total 14 days
                                            const leftPercent = (leftOffsetDays / 14) * 100;
                                            const widthPercent = (durationDays / 14) * 100;

                                            const guest = guests.find(g => g.principal === res.guestId);

                                            return (
                                                <div
                                                    key={res.id}
                                                    className={`absolute top-2.5 bottom-2.5 rounded-xl border flex flex-col justify-center cursor-pointer hover:-translate-y-0.5 hover:z-30 transition-all duration-300 group/res overflow-hidden backdrop-blur-md ${getStatusColor(res.status)}`}
                                                    style={{ left: `${leftPercent}%`, width: `calc(${widthPercent}% - 6px)`, zIndex: 10 }}
                                                    title={`Res ${res.id} - ${guest?.fullName}`}
                                                >
                                                    {/* Subtle internal gradient for 3D effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-50 group-hover/res:opacity-100 transition-opacity" />

                                                    <div className="flex items-center gap-2 px-3 relative z-10 w-full overflow-hidden">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-[11px] font-bold truncate leading-tight group-hover/res:text-white transition-colors">{guest?.fullName}</div>
                                                            <div className="text-[9px] opacity-60 truncate font-mono uppercase tracking-wider group-hover/res:opacity-100 transition-opacity">#{res.id.split('_')[1]}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomPlan;
