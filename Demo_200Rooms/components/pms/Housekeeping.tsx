
import React, { useState, useEffect, useRef } from 'react';
import { RoomStatus, ReservationStatus, Room, LoyaltyTier } from '../../types';
import { AlertCircle, Map, List, Package, Box, Search, FileBarChart, Printer, Download, BedDouble, Gift, Activity, CheckCircle, Wrench, ChevronDown } from 'lucide-react';
import { botEngine } from '../../services/kernel/systemBridge';
import RoomProfileModal from '../shared/RoomProfileModal';
import GuestProfileModal from '../shared/GuestProfileModal';
import OracleWidget from '../shared/OracleWidget';
import Inspectable from '../shared/Inspectable';
import { useInspector } from '../../context/InspectorContext';
import { usePms } from '../../services/kernel/persistence';
import { updateItem } from '../../services/kernel/firestoreService';
import UniversalReportCenter from '../shared/UniversalReportCenter';

const CLEANING_HISTORY = [
    { roomId: '101', date: '2026-02-10', type: 'Full Clean', duration: 45, score: 5 },
    { roomId: '102', date: '2026-02-10', type: 'Turnover', duration: 30, score: 4 },
    { roomId: '205', date: '2026-02-09', type: 'Full Clean', duration: 50, score: 5 },
];

const Housekeeping: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Tasks' | 'FloorPlan' | 'Inventory' | 'Reports'>('Tasks');
    const { rooms, inventory, reservations, guests, loading } = usePms();
    const { inspect } = useInspector();

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Inventory State
    const [inventoryFilter, setInventoryFilter] = useState<string>('All');

    // Report State
    const [reportConfig, setReportConfig] = useState({ type: 'Efficiency', range: 'Today', format: 'PDF' });
    const [generatedReport, setGeneratedReport] = useState<any[] | null>(null);

    // Derived Stats
    const cleanCount = rooms.filter(r => r.status === RoomStatus.CLEAN_READY).length;
    const progress = rooms.length ? Math.round((cleanCount / rooms.length) * 100) : 0;
    const lowStockCount = inventory
        .filter(i => ['Linen', 'Amenity', 'Chemical', 'Paper'].includes(i.category))
        .filter(i => i.totalStock < (i.parLevel * 0.3)).length;

    const getPriority = (room: Room) => {
        const res = reservations.find(r => r.roomId === room.id && (r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.CONFIRMED));
        const guest = res ? guests.find(g => g.principal === res.guestId) : null;

        if (room.status === RoomStatus.DIRTY_DEPARTURE) return { level: 'Critical', score: 3 };
        if (guest?.loyaltyTier === LoyaltyTier.PLATINUM || guest?.loyaltyTier === LoyaltyTier.DIAMOND) return { level: 'VIP', score: 2 };
        if (room.status === RoomStatus.DIRTY_STAYOVER) return { level: 'High', score: 1 };
        if (room.status === RoomStatus.MINIBAR_PENDING) return { level: 'Service', score: 1.5 };
        return { level: 'Standard', score: 0 };
    };

    const sortedRooms = [...rooms].sort((a, b) => getPriority(b).score - getPriority(a).score);

    // Search Filtering
    const filteredRooms = sortedRooms.filter(r => {
        const search = searchTerm.toLowerCase();
        const res = reservations.find(res => res.roomId === r.id && res.status === ReservationStatus.CHECKED_IN);
        const guest = res ? guests.find(g => g.principal === res.guestId) : null;
        return (
            r.number.includes(search) ||
            (guest && guest.fullName.toLowerCase().includes(search))
        );
    });

    const getStatusColor = (status: RoomStatus | string) => {
        switch (status) {
            case RoomStatus.CLEAN_READY: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case RoomStatus.DIRTY_DEPARTURE: return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case RoomStatus.DIRTY_STAYOVER: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case RoomStatus.MINIBAR_PENDING: return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
            case RoomStatus.MAINTENANCE: return 'bg-zinc-800 text-zinc-500 border-zinc-700';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    const handleGenerateReport = () => {
        // Mock Report Generation
        const data = CLEANING_HISTORY.map(h => ({
            col1: `Room ${h.roomId}`,
            col2: new Date(h.date).toLocaleDateString(),
            col3: h.type,
            col4: `${h.duration} mins`,
            col5: `Score: ${h.score}/5`
        }));
        setGeneratedReport(data);
        botEngine.logActivity('HK', 'Report_Gen', `Type: ${reportConfig.type}`);
    };

    // --- SEARCH LOGIC ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        if (val.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const matches: any[] = [];
        const term = val.toLowerCase();
        rooms.forEach(r => {
            if (r.number.includes(term)) matches.push({ type: 'Room', label: `Room ${r.number}`, sub: r.status, id: r.id, data: r });
        });
        setSuggestions(matches.slice(0, 5));
        setShowSuggestions(true);
    };

    const handleSuggestionClick = (item: any) => {
        setSearchTerm('');
        setShowSuggestions(false);
        if (item.type === 'Room') {
            inspect('room', item.data.id);
        }
    };

    // --- RENDERERS ---
    const handleQuickAction = async (e: React.MouseEvent, room: Room, action: 'CLEAN' | 'DIRTY' | 'MAINTENANCE') => {
        e.stopPropagation();
        try {
            let newStatus = room.status;
            let logMsg = '';

            switch (action) {
                case 'CLEAN':
                    newStatus = RoomStatus.CLEAN_READY;
                    logMsg = `Room ${room.number} marked Clean`;
                    break;
                case 'DIRTY':
                    newStatus = RoomStatus.DIRTY_STAYOVER;
                    logMsg = `Room ${room.number} marked Dirty`;
                    break;
                case 'MAINTENANCE':
                    newStatus = RoomStatus.MAINTENANCE;
                    logMsg = `Room ${room.number} placed in Maintenance`;
                    break;
            }

            await updateItem('rooms', room.id, { status: newStatus });
            botEngine.logActivity('HK', 'STATUS_UPDATE', logMsg, 'Admin_01');
        } catch (error) {
            console.error("Failed to update room status", error);
        }
    };

    const renderTasks = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredRooms.map(room => {
                const res = reservations.find(r => r.roomId === room.id && (r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.CHECKED_OUT || r.status === ReservationStatus.CONFIRMED));
                const guest = res ? guests.find(g => g.principal === res.guestId) : null;
                const priority = getPriority(room);

                // Determine card glow/border based on priority
                const isCritical = priority.level === 'Critical';
                const isVIP = priority.level === 'VIP';

                const cardGlowClass = isCritical ? 'hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] border-rose-500/30' :
                    isVIP ? 'hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] border-violet-500/30' :
                        'hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-zinc-700/50';

                return (
                    <div
                        key={room.id}
                        className={`group relative h-40 rounded-2xl border p-5 flex flex-col justify-between cursor-default overflow-hidden transition-all duration-300 hover:-translate-y-1 ${cardGlowClass} bg-zinc-900/60 backdrop-blur-sm`}
                    >
                        {/* Subtle internal gradient glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        {/* Priority Pulse */}
                        {(isCritical || isVIP) && (
                            <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none -mr-10 -mt-10"
                                style={{ backgroundColor: isCritical ? '#f43f5e' : '#8b5cf6' }} />
                        )}

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-3xl font-black tracking-tight text-white drop-shadow-md leading-none">{room.number}</span>
                                <div className={`text-[10px] uppercase font-bold mt-2 px-2 py-0.5 rounded-lg border flex-shrink-0 self-start ${getStatusColor(room.status)}`}>
                                    {room.status.split('/')[0]}
                                </div>
                            </div>
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-lg border border-zinc-700/50">
                                    Lvl {room.number[0]}
                                </span>
                                {guest && (
                                    <div className="mt-2 text-xs font-bold text-zinc-300 truncate max-w-[100px]" title={guest.fullName}>
                                        {guest.fullName.split(' ')[0]}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="relative z-10 mt-auto grid grid-cols-3 gap-2">
                            <button
                                onClick={(e) => handleQuickAction(e, room, 'CLEAN')}
                                className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-xl py-2 flex justify-center items-center transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                title="Mark Clean"
                            >
                                <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => handleQuickAction(e, room, 'DIRTY')}
                                className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20 hover:border-amber-500 rounded-xl py-2 flex justify-center items-center transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                title="Mark Dirty"
                            >
                                <Activity className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => handleQuickAction(e, room, 'MAINTENANCE')}
                                className="bg-zinc-800 hover:bg-rose-500 text-zinc-400 hover:text-white border border-zinc-700 hover:border-rose-500 rounded-xl py-2 flex justify-center items-center transition-all duration-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                                title="Maintenance"
                            >
                                <Wrench className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderFloorPlan = () => {
        const floors: { [key: string]: Room[] } = {};
        filteredRooms.forEach(r => {
            const floor = r.number.charAt(0);
            if (!floors[floor]) floors[floor] = [];
            floors[floor].push(r);
        });

        return (
            <div className="space-y-4">
                {Object.keys(floors).sort().map(floor => (
                    <div key={floor} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Map className="w-4 h-4" /> Level {floor}
                        </h3>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                            {floors[floor].map(room => (
                                <div
                                    key={room.id}
                                    onClick={() => inspect('room', room.id)}
                                    className={`w-14 h-14 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-150 hover:scale-105 ${getStatusColor(room.status)} bg-opacity-40`}
                                >
                                    <span className="text-sm font-bold opacity-90">{room.number}</span>
                                    <span className="text-[7px] uppercase font-bold opacity-60">
                                        {room.status.split('/')[0].slice(0, 3)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderInventory = () => {
        const categories = ['All', 'Linen', 'Amenity', 'Chemical', 'Paper'];
        const filteredInventory = inventoryFilter === 'All'
            ? inventory
            : inventory.filter(i => i.category === inventoryFilter);

        return (
            <div className="relative flex flex-col gap-6">
                {/* Oracle Trigger: Inventory Thresholds */}
                <div className="absolute -top-14 right-0 z-20">
                    <OracleWidget context={{ moduleId: 'Housekeeping', fieldId: 'InventoryThresholds' }} size="sm" />
                </div>

                {/* Filter Controls - Glass Pill */}
                <div className="flex items-center p-1 bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-lg w-fit">
                    <div className="px-4 border-r border-zinc-800 flex items-center gap-2">
                        <Package className="w-4 h-4 text-zinc-500" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inventory View</span>
                    </div>
                    <div className="flex gap-1 px-2 py-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setInventoryFilter(cat)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${inventoryFilter === cat ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inventory List View */}
                <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-700/50 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950/80 text-zinc-500 uppercase text-[10px] font-black tracking-widest border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-5">Item Identifier</th>
                                <th className="px-6 py-5">Classification</th>
                                <th className="px-6 py-5">Supply Integrity</th>
                                <th className="px-6 py-5">Metrics</th>
                                <th className="px-6 py-5 text-right">Logistics</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredInventory.map((item, index) => {
                                const percentage = Math.min(100, (item.totalStock / item.parLevel) * 100);
                                const isLow = percentage < 30;
                                const isWarning = percentage >= 30 && percentage < 50;

                                const getCategoryStyle = (cat: string) => {
                                    switch (cat) {
                                        case 'Linen': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                                        case 'Amenity': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                                        case 'Chemical': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
                                        case 'Paper': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                                        default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
                                    }
                                };

                                return (
                                    <tr key={item.id}
                                        className="hover:bg-white/[0.02] transition-colors group cursor-default"
                                        style={{ animationDelay: `${index * 50}ms` }}>
                                        <td className="px-6 py-5 font-bold text-zinc-200 flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl border ${getCategoryStyle(item.category)}`}>
                                                <Box className="w-4 h-4" />
                                            </div>
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getCategoryStyle(item.category)}`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 w-1/3">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 relative">
                                                    <div
                                                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${isLow ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : isWarning ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.8)]'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[11px] font-black font-mono w-12 text-right ${isLow ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-teal-400'}`}>
                                                    {Math.round(percentage)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className={`font-mono text-sm font-black ${isLow ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-zinc-100'}`}>
                                                    {item.totalStock} <span className="text-zinc-600 font-bold text-xs uppercase tracking-wider">/ {item.parLevel} {item.unit}</span>
                                                </span>
                                                {isLow && <span className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-1 animate-pulse flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Critical Level</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="px-4 py-2 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-violet-500/20 hover:border-violet-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] opacity-0 group-hover:opacity-100">
                                                Requisition
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const handleExportCSV = () => {
        if (!generatedReport) return;
        const headers = ['Room/Item', 'Date', 'Type', 'Metric', 'Detail'];
        const rows = generatedReport.map(r => `"${r.col1}","${r.col2}","${r.col3}","${r.col4}","${r.col5}"`);
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Housekeeping_${reportConfig.type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handlePrintReport = () => {
        window.print();
    };

    const renderReports = () => (
        <UniversalReportCenter defaultCategory="Housekeeping" />
    );

    return (
        <div className="module-container">
            {/* Header / Command Center */}
            <div className="module-header glass-panel">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
                        <BedDouble className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-light text-white">Housekeeping Operations</h1>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Environmental Services</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-md mx-8">
                    <div className="relative group" ref={searchRef}>
                        <div className="relative flex items-center bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2 transition-all focus-within:border-violet-500/50">
                            <Search className="w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search rooms, staff, or tasks..."
                                className="w-full bg-transparent border-none outline-none ml-3 text-sm text-zinc-200 placeholder:text-zinc-600"
                                value={searchTerm}
                                onChange={e => handleSearchChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
                        {[
                            { id: 'Tasks', label: 'Board', icon: List },
                            { id: 'FloorPlan', label: 'Map', icon: Map },
                            { id: 'Inventory', label: 'Supplies', icon: Package },
                            { id: 'Reports', label: 'BI', icon: FileBarChart },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-zinc-800 text-white shadow-lg shadow-black/40'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="module-body overflow-y-auto custom-scrollbar">
                <div className="flex-1">
                    {/* Progress Indicators moved to content area */}
                    {activeTab !== 'Reports' && (
                        <div className="mb-6 flex justify-end items-center gap-4">
                            {lowStockCount > 0 && (
                                <div className="hidden md:flex items-center gap-2 text-[10px] text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 font-bold animate-pulse uppercase tracking-widest">
                                    <AlertCircle className="w-3.5 h-3.5" /> {lowStockCount} Alert
                                </div>
                            )}
                            <div className="w-48 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                                <div className="bg-gradient-to-r from-violet-600 to-teal-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{progress}% Clean</div>
                        </div>
                    )}

                    {activeTab === 'Tasks' && renderTasks()}
                    {activeTab === 'FloorPlan' && renderFloorPlan()}
                    {activeTab === 'Inventory' && renderInventory()}
                    {activeTab === 'Reports' && renderReports()}
                </div>
            </main>

            {/* Standard Footer (Aligned to remain same across modules) */}
            <footer className="module-footer">
                <div className="flex items-center gap-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    <Activity className="w-3 h-3 text-emerald-500" /> System Nominal
                    <div className="h-4 w-[1px] bg-zinc-800" />
                    <span>User: Admin_01</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-[9px] text-zinc-500 uppercase font-medium">Singularity Grand • Bahrain Lab</div>
                </div>
            </footer>
        </div>
    );
};

export default Housekeeping;
