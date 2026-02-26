import React, { useState } from 'react';
import { BusinessBlock } from '../../types';
import { Briefcase, Plus, Search, Filter, MoreVertical, Hash, Calendar, Users, Building2, ChevronRight, Activity, TrendingUp, CheckCircle, LogOut } from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { ReportEngine, ReportDimension, ReportMetric } from '../shared/ReportEngine';

const BusinessBlocks: React.FC = () => {
    const { businessBlocks: blocks, reservations } = usePms();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'List' | 'Analytics'>('List');

    const groupDimensions: ReportDimension[] = [
        { key: 'status', label: 'Block Status' },
        { key: 'companyId', label: 'Company / Agency' },
        { key: 'month', label: 'Arrival Month' }
    ];

    const groupMetrics: ReportMetric[] = [
        { key: 'blockedCount', label: 'Blocked Rooms', aggregation: 'sum' },
        { key: 'bookedCount', label: 'Actual Bookings', aggregation: 'sum' },
        { key: 'revenue', label: 'Est. Revenue', aggregation: 'sum', format: (v) => `$${v.toLocaleString()}` }
    ];

    const enrichedBlocks = React.useMemo(() => {
        return blocks.map(block => {
            const blockRes = reservations.filter(r => r.blockId === block.id);
            const bookedCount = blockRes.length;

            // Calculate total blocked rooms across all dates/types
            let blockedCount = 0;
            let estRevenue = 0;

            Object.values(block.roomAllocations || {}).forEach(dateAlloc => {
                Object.entries(dateAlloc).forEach(([typeId, count]) => {
                    blockedCount += count;
                    estRevenue += count * (block.contractedRates[typeId] || 0);
                });
            });

            return {
                ...block,
                month: new Date(block.startDate).toLocaleString('default', { month: 'long' }),
                bookedCount,
                blockedCount,
                revenue: estRevenue
            };
        });
    }, [blocks, reservations]);


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Definite': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'Tentative': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            case 'Prospect': return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
            case 'Cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
            default: return 'bg-zinc-800 text-zinc-500 border-zinc-700';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const filteredBlocks = enrichedBlocks.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className="animate-fadeIn flex flex-col h-full">
            {/* View Stats & Navigation */}
            <div className="flex items-center justify-between mb-4 bg-zinc-900/20 p-2 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3 px-4">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg">
                        <Briefcase className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Group Business</div>
                        <div className="text-sm font-black text-white mt-1">${enrichedBlocks.reduce((sum, b) => sum + b.revenue, 0).toLocaleString()} Revenue</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl">
                        <button
                            onClick={() => setActiveTab('List')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'List'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                }`}
                        >
                            <Building2 className="w-3.5 h-3.5" /> Ops
                        </button>
                        <button
                            onClick={() => setActiveTab('Analytics')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'Analytics'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                }`}
                        >
                            <TrendingUp className="w-3.5 h-3.5" /> Stats
                        </button>
                    </div>

                    <button className="group relative overflow-hidden flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest">
                        <Plus className="w-3.5 h-3.5 relative z-10" /> <span className="relative z-10">New Block</span>
                    </button>
                </div>
            </div>


            {activeTab === 'List' ? (
                <div className="flex flex-col h-full">
                    {/* Search & Filter Bar */}
                    <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-950/40 relative z-20">
                        <div className="flex gap-4 w-full max-w-2xl">
                            <div className="relative group w-full max-w-md">
                                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity rounded-xl" />
                                <div className="relative flex items-center bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 transition-all group-focus-within:border-amber-500/50">
                                    <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search active blocks..."
                                        className="w-full bg-transparent border-none outline-none ml-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:w-full transition-all duration-300"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button className="flex justify-center items-center gap-2 px-5 py-3 bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:border-zinc-500 transition-all">
                                <Filter size={14} /> Refine List
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar pb-10">
                        {filteredBlocks.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                                {filteredBlocks.map(block => (
                                    <div
                                        key={block.id}
                                        className="group relative bg-zinc-950/50 border border-zinc-800/80 hover:border-amber-500/30 rounded-2xl p-6 hover:bg-zinc-900/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col"
                                    >
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-amber-400 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all shadow-inner">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-zinc-200 text-lg mb-1 group-hover:text-amber-400 transition-colors">{block.name}</h3>
                                                    <div className="text-[10px] text-zinc-500 font-mono tracking-widest flex items-center gap-2">
                                                        <span className="flex items-center gap-1 text-zinc-400"><Hash className="w-3 h-3 text-zinc-600" />{block.code}</span>
                                                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                        <span className="font-bold text-zinc-400">{block.companyId || 'Direct Booking'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${getStatusColor(block.status)}`}>
                                                {block.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-zinc-600" /> Dates & Cutoff</div>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="text-sm font-bold text-zinc-300">
                                                        {formatDate(block.startDate)} - {formatDate(block.endDate)}
                                                    </div>
                                                    <div className="text-xs text-amber-500 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse" />
                                                        Cutoff: {formatDate(block.cutoffDate)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                                                <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-2 flex items-center gap-1.5"><Users className="w-3 h-3 text-zinc-600" /> Block Pickup</div>
                                                <div className="flex justify-between items-end mb-2">
                                                    <div className="text-xl font-black text-white">{block.bookedCount} <span className="text-sm text-zinc-500 font-bold">/ {block.blockedCount}</span></div>
                                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Est. ${block.revenue.toLocaleString()}</div>
                                                </div>

                                                {/* Custom Progress Bar matching card colors based on status */}
                                                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50 relative">
                                                    <div
                                                        className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r shadow-[0_0_10px_currentColor] transition-all duration-1000 ${block.status === 'Definite' ? 'from-emerald-600 to-emerald-400 text-emerald-500' :
                                                            block.status === 'Tentative' ? 'from-amber-600 to-amber-400 text-amber-500' :
                                                                block.status === 'Prospect' ? 'from-violet-600 to-violet-400 text-violet-500' :
                                                                    'from-zinc-600 to-zinc-400 text-zinc-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (block.bookedCount / (block.blockedCount || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-5 mt-auto">
                                            <div className="text-[10px] font-medium text-zinc-500 flex items-center gap-2">
                                                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500/50" /> Contract Signed</span>
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                <span className="flex items-center gap-1"><LogOut className="w-3 h-3 text-amber-500/50" /> Routing Enabled</span>
                                            </div>

                                            <div className="flex gap-2">
                                                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wider block">
                                                    Manage Folio
                                                </button>
                                                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors text-xs font-bold uppercase tracking-wider block">
                                                    Inspect
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-32 text-center relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
                                <div className="relative z-10 p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-3xl shadow-2xl backdrop-blur-xl">
                                    <Briefcase className="w-12 h-12 mx-auto mb-4 text-amber-500/30" />
                                    <h3 className="text-xl font-bold text-zinc-300 mb-2">No Active Blocks</h3>
                                    <p className="text-sm text-zinc-500 max-w-sm">No business blocks matching your criteria were found. Adjust filters or create a new block.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <ReportEngine
                        title="Group Intelligence"
                        data={enrichedBlocks}
                        dimensions={groupDimensions}
                        metrics={groupMetrics}
                        defaultDimension="status"
                        defaultMetric="revenue"
                    />
                </div>
            )}
        </div>
    );
};

export default BusinessBlocks;
