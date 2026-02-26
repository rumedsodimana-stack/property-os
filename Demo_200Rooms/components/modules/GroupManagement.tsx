/**
 * Group Management Dashboard Component
 * Manage group blocks, rooming lists, and pickup tracking
 */

import React, { useState, useEffect } from 'react';
import { Plus, Users, Upload, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import GroupBlockEngine, { type GroupBlock, type PickupReport } from '../../services/operations/groupBlockEngine';
import { db } from '../../services/kernel/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export const GroupManagement: React.FC = () => {
    const [blocks, setBlocks] = useState<GroupBlock[]>([]);
    const [selectedBlock, setSelectedBlock] = useState<GroupBlock | null>(null);
    const [pickupReport, setPickupReport] = useState<PickupReport | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        initializeData();
    }, []);

    const initializeData = async () => {
        await loadBlocks();
    };

    const loadBlocks = async () => {
        const q = query(collection(db, 'groupBlocks'), orderBy('dates.arrivalDate', 'desc'));
        const snapshot = await getDocs(q);
        setBlocks(snapshot.docs.map((doc: any) => doc.data()));
    };

    const loadPickupReport = async (blockId: string) => {
        const engine = new GroupBlockEngine();
        const report = await engine.getPickupReport(blockId);
        setPickupReport(report);
    };

    return (
        <div className="module-container bg-transparent flex flex-col h-full overflow-hidden">
            {/* Standardized Header */}
            <header className="module-header glass-panel flex items-center justify-between flex-nowrap">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20" style={{ backgroundColor: 'var(--system-accent-alpha)', borderColor: 'var(--system-accent-alpha)', color: 'var(--system-accent)' }}>
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight leading-none">Group Management</h2>
                        <div className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Blocks & Pickup Tracking</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg"
                        style={{ backgroundColor: 'var(--system-accent)' }}
                    >
                        <Plus className="w-4 h-4" />
                        New Block
                    </button>
                </div>
            </header>

            <main className="module-body space-y-8">
                {/* Active Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {blocks.map((block) => (
                        <div
                            key={block.id}
                            onClick={() => {
                                setSelectedBlock(block);
                                loadPickupReport(block.id);
                            }}
                            className="group bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-violet-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-2xl shadow-black/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">{block.groupName}</h3>
                                    <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mt-1">{block.blockCode}</p>
                                </div>
                                <span className={`
                                    px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10
                                    ${block.status === 'tentative' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}
                                    ${block.status === 'definite' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                                    ${block.status === 'actual' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}
                                    ${block.status === 'cancelled' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : ''}
                                `}>
                                    {block.status}
                                </span>
                            </div>

                            <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-end">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
                                        <div className="text-[9px] uppercase font-black text-zinc-500 tracking-widest mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Date Split</div>
                                        <div className="text-[10px] font-semibold text-zinc-300">
                                            {new Date(block.dates.arrivalDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(block.dates.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
                                        <div className="text-[9px] uppercase font-black text-zinc-500 tracking-widest mb-1 flex items-center gap-1.5"><Users className="w-3 h-3" /> Inventory</div>
                                        <div className="text-[11px] font-bold text-zinc-200">
                                            {block.stats.roomsPickedUp} <span className="text-zinc-500 font-medium">/ {block.stats.totalRoomsBlocked}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pickup Progress Bar */}
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                                        <span>Pickup Progress</span>
                                        <span style={{ color: 'var(--system-accent)' }}>{block.stats.pickupPercentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800/80 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]"
                                            style={{
                                                width: `${block.stats.pickupPercentage}%`,
                                                backgroundColor: 'var(--system-accent)',
                                                color: 'var(--system-accent)'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </main>

            {/* Pickup Report Modal */}
            {selectedBlock && pickupReport && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 pb-safe">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedBlock(null); setPickupReport(null); }} />
                    <div className="bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black relative z-10 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 sm:p-8 flex items-start justify-between border-b border-white/5 bg-zinc-900/40">
                            <div>
                                <h2 className="text-3xl font-light text-white tracking-tight leading-none mb-1">{selectedBlock.groupName}</h2>
                                <p className="text-[11px] uppercase font-bold text-zinc-500 tracking-widest">{selectedBlock.blockCode} • Pickup Report</p>
                            </div>
                            <button
                                onClick={() => { setSelectedBlock(null); setPickupReport(null); }}
                                className="p-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors border border-white/5"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
                            {/* Overview Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Blocked', value: pickupReport.totalBlocked, icon: Users, color: 'text-white' },
                                    { label: 'Picked Up', value: pickupReport.totalPickedUp, icon: TrendingUp, color: 'text-emerald-400' },
                                    { label: 'Available', value: pickupReport.totalAvailable, icon: Calendar, color: 'text-[var(--system-accent)]' },
                                    { label: 'Days to Cutoff', value: pickupReport.daysUntilCutoff, icon: Calendar, color: 'text-white' },
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                                        <stat.icon className={`w-5 h-5 mb-2 ${stat.color} opacity-80`} />
                                        <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500 mb-1">{stat.label}</p>
                                        <p className={`text-3xl font-light tracking-tight ${stat.color}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <h3 className="text-[11px] uppercase font-black text-zinc-500 tracking-widest flex items-center gap-2">
                                        Pickup by Room Type
                                    </h3>
                                    <div className="space-y-4">
                                        {pickupReport.byRoomType.map((rt) => (
                                            <div key={rt.roomType} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-5 hover:bg-zinc-900/50 transition-colors">
                                                <div className="flex items-center justify-between mb-3 text-sm">
                                                    <span className="font-semibold text-white capitalize tracking-wide">
                                                        {rt.roomType.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-zinc-400 font-medium bg-zinc-950/80 px-3 py-1 rounded-lg text-xs border border-zinc-800">
                                                        <span className="text-white">{rt.pickedUp}</span> / {rt.blocked}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                                                        style={{
                                                            width: `${rt.pickupPercentage}%`,
                                                            backgroundColor: 'var(--system-accent)',
                                                            boxShadow: '0 0 10px var(--system-accent-alpha)'
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 w-1/3 animate-[shimmer_2s_infinite]" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-[11px] uppercase font-black text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
                                        Group Insights
                                    </h3>

                                    {/* Trend Indicator */}
                                    <div className={`
                                        p-6 rounded-3xl border 
                                        ${pickupReport.trend === 'ahead' ? 'bg-emerald-500/10 border-emerald-500/30' : ''}
                                        ${pickupReport.trend === 'on_pace' ? 'bg-blue-500/10 border-blue-500/30' : ''}
                                        ${pickupReport.trend === 'behind' ? 'bg-rose-500/10 border-rose-500/30' : ''}
                                    `}>
                                        <div className="flex flex-col items-center text-center">
                                            <div className={`
                                                w-12 h-12 rounded-2xl flex items-center justify-center mb-4
                                                ${pickupReport.trend === 'ahead' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                                                ${pickupReport.trend === 'on_pace' ? 'bg-blue-500/20 text-blue-400' : ''}
                                                ${pickupReport.trend === 'behind' ? 'bg-rose-500/20 text-rose-400' : ''}
                                            `}>
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                            <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-1">Pickup Trend</p>
                                            <p className={`
                                                text-xl font-bold capitalize tracking-tight
                                                ${pickupReport.trend === 'ahead' ? 'text-emerald-400' : ''}
                                                ${pickupReport.trend === 'on_pace' ? 'text-blue-400' : ''}
                                                ${pickupReport.trend === 'behind' ? 'text-rose-400' : ''}
                                            `}>
                                                {pickupReport.trend.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-3">
                                        <button className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-900 border border-white/5 hover:border-[var(--system-accent-alpha)] hover:bg-[var(--system-accent-alpha)] text-[var(--system-accent)] hover:text-white rounded-2xl transition-all group font-semibold text-sm">
                                            <Upload className="w-4 h-4 text-[var(--system-accent)] group-hover:text-white transition-colors" />
                                            Import Rooming List
                                        </button>
                                        <button className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white rounded-2xl transition-all font-semibold text-sm">
                                            <DollarSign className="w-4 h-4 text-zinc-400" />
                                            View Financials
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupManagement;
