import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Link, History, CheckCircle, AlertCircle, XCircle, Settings, Plus, Play, Pause, AlertTriangle, Key, Layers, Activity, Server, ArrowRight } from 'lucide-react';
import { OTAChannel, otaAdapter } from '../../services/operations/otaAdapter';
import { OTA_CHANNELS } from './OTAChannels';
import { channelManager } from '../../services/operations/channelManager';
import AddChannelWizard from './ota/AddChannelWizard';

const OTAChannelsConfig: React.FC = () => {
    const [channels, setChannels] = useState<OTAChannel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<OTAChannel | null>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = channelManager.subscribe(setChannels);
        return () => unsubscribe();
    }, []);

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'Connected': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: <CheckCircle size={14} className="text-emerald-500" /> };
            case 'Syncing': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: <RefreshCw size={14} className="text-amber-500 animate-spin" /> };
            case 'Disconnected': return { bg: 'bg-zinc-800', border: 'border-zinc-700', text: 'text-zinc-500', icon: <XCircle size={14} className="text-zinc-500" /> };
            default: return { bg: 'bg-zinc-800', border: 'border-zinc-700', text: 'text-zinc-500', icon: <AlertCircle size={14} className="text-zinc-500" /> };
        }
    };

    return (
        <div className="flex flex-col h-full gap-8 animate-fadeIn">
            {/* Header section */}
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-light text-white flex items-center gap-3">
                    <Globe className="text-violet-400" size={28} />
                    Distribution & Channel Management
                </h2>
                <p className="text-xs text-zinc-400 max-w-2xl">
                    Configure your direct connections to Online Travel Agencies (OTAs) and Global Distribution Systems (GDS). Manage rates, inventory allocations, webhooks, and API credentials in real-time.
                </p>
            </div>

            {/* Metrics Overview (Mock Data) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Active Channels', value: channels.filter(c => c.status === 'Connected').length, icon: Layers, trend: '+1 this month' },
                    { label: 'Sync Success Rate', value: '99.8%', icon: Activity, trend: 'Optimal' },
                    { label: 'Avg Network Latency', value: '142ms', icon: Server, trend: '-12ms' },
                    { label: 'Pending Updates', value: '0', icon: RefreshCw, trend: 'Synced' },
                ].map((metric, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 hover:bg-zinc-900/60 transition duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400">
                                <metric.icon size={18} />
                            </div>
                            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">{metric.trend}</span>
                        </div>
                        <div className="text-2xl font-light text-white tracking-tight">{metric.value}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">{metric.label}</div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Channel List */}
                <div className="col-span-1 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Configured OTAs</h3>
                        <button
                            onClick={() => setIsWizardOpen(true)}
                            className="text-[10px] bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold uppercase transition"
                        >
                            <Plus size={12} /> Add Config
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {channels.map((channel) => {
                            const theme = getStatusTheme(channel.status);
                            const isSelected = selectedChannel?.id === channel.id;

                            return (
                                <div
                                    key={channel.id}
                                    onClick={() => setSelectedChannel(channel)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${isSelected ? 'bg-zinc-800/80 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800/40 hover:border-zinc-700'}`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2.5 shadow-inner shrink-0">
                                            <img src={channel.icon} alt={channel.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-bold text-zinc-100 truncate">{channel.name}</h4>
                                            </div>
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${theme.bg} ${theme.border} ${theme.text}`}>
                                                {theme.icon}
                                                {channel.status}
                                            </div>
                                        </div>
                                        {isSelected && <ArrowRight size={16} className="text-violet-400" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Channel Details Panel */}
                <div className="col-span-1 lg:col-span-2">
                    {selectedChannel ? (
                        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl h-full flex flex-col p-8 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-[80px] -translate-y-1/2 translate-x-1/4 rounded-full pointer-events-none transition-all duration-700 group-hover:bg-violet-500/10"></div>

                            <div className="flex items-start justify-between mb-8 pb-6 border-b border-zinc-800/50">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-inner">
                                        <img src={selectedChannel.icon} alt={selectedChannel.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight">{selectedChannel.name}</h3>
                                        <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-black">Integration Profile</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-zinc-700/50">
                                        <Pause size={14} /> Suspend Sync
                                    </button>
                                    <button
                                        onClick={() => channelManager.syncAvailability('rt_standard', 10)}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-900/20 transition flex items-center gap-2"
                                    >
                                        <RefreshCw size={14} className={selectedChannel.status === 'Syncing' ? 'animate-spin' : ''} /> Force Full Sync
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 flex-1">
                                {/* Left Column */}
                                <div className="space-y-8">
                                    <section>
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Activity size={14} /> Connection Health
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30">
                                                <span className="text-zinc-400">Inventory Sync</span>
                                                <span className="text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30">
                                                <span className="text-zinc-400">Rate Push</span>
                                                <span className="text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30">
                                                <span className="text-zinc-400">Reservations Pull</span>
                                                <span className="text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Polling</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Settings size={14} /> System Mapping
                                        </h4>
                                        <button className="w-full text-left p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl hover:bg-zinc-800/50 transition group flex justify-between items-center">
                                            <div>
                                                <div className="text-sm font-bold text-zinc-200 group-hover:text-violet-400 transition">Room Type Map</div>
                                                <div className="text-xs text-zinc-500 mt-1">4 of 5 local types mapped</div>
                                            </div>
                                            <ArrowRight size={16} className="text-zinc-600 group-hover:text-violet-400 transition" />
                                        </button>
                                        <button className="w-full text-left p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl hover:bg-zinc-800/50 transition group flex justify-between items-center mt-3">
                                            <div>
                                                <div className="text-sm font-bold text-zinc-200 group-hover:text-violet-400 transition">Rate Plan Map</div>
                                                <div className="text-xs text-zinc-500 mt-1">2 rate plans mapped</div>
                                            </div>
                                            <ArrowRight size={16} className="text-zinc-600 group-hover:text-violet-400 transition" />
                                        </button>
                                    </section>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-8">
                                    <section>
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <History size={14} /> Live Sync Log
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="relative pl-4 border-l-2 border-zinc-800">
                                                <div className="absolute w-2 h-2 rounded-full bg-emerald-500 -left-[5px] top-1.5"></div>
                                                <div className="text-xs font-mono text-zinc-500 mb-0.5">Today, {new Date(selectedChannel.lastSync || Date.now()).toLocaleTimeString()}</div>
                                                <div className="text-sm text-zinc-300">ARI (Avail/Rates) push successful.</div>
                                            </div>
                                            <div className="relative pl-4 border-l-2 border-zinc-800">
                                                <div className="absolute w-2 h-2 rounded-full bg-emerald-500 -left-[5px] top-1.5"></div>
                                                <div className="text-xs font-mono text-zinc-500 mb-0.5">Today, 08:15:22</div>
                                                <div className="text-sm text-zinc-300">Pulled 2 new reservations.</div>
                                            </div>
                                            <div className="relative pl-4 border-l-2 border-zinc-800">
                                                <div className="absolute w-2 h-2 rounded-full bg-rose-500 -left-[5px] top-1.5"></div>
                                                <div className="text-xs font-mono text-zinc-500 mb-0.5">Yesterday, 23:59:10</div>
                                                <div className="text-sm text-zinc-300">Rate push failed: Timeout (<span className="text-rose-400 font-mono text-xs">ERR_NET_TIMEOUT</span>)</div>
                                            </div>
                                        </div>
                                        <button className="text-xs text-violet-400 hover:text-violet-300 uppercase tracking-widest font-bold mt-4 flex items-center gap-1 transition">
                                            View Full Logs <ArrowRight size={12} />
                                        </button>
                                    </section>

                                    <section>
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Key size={14} /> Credentials & Webhooks
                                        </h4>
                                        <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/30 space-y-4">
                                            <div>
                                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Provider ID</div>
                                                <div className="font-mono text-xs text-zinc-300 p-2 bg-zinc-900 rounded-lg">{selectedChannel.id}-982X3</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 flex justify-between">
                                                    Webhook Endpoint
                                                    <span className="text-emerald-500">Secured</span>
                                                </div>
                                                <div className="font-mono text-xs text-zinc-300 p-2 bg-zinc-900 rounded-lg pr-12 relative overflow-hidden text-ellipsis whitespace-nowrap">
                                                    https://api.hotelsingularity.com/v1/ota/webhook/{selectedChannel.id}
                                                </div>
                                            </div>
                                            <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-300 transition border border-zinc-700/50">
                                                Rotate API Keys
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-zinc-900/20 border border-zinc-800/30 border-dashed rounded-2xl h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                            <Globe size={48} className="text-zinc-700/50" />
                            <p className="text-sm font-medium">Select a channel to view its configuration</p>
                        </div>
                    )}
                </div>
            </div>

            {isWizardOpen && (
                <AddChannelWizard
                    onClose={() => setIsWizardOpen(false)}
                    onComplete={(channelId) => {
                        setIsWizardOpen(false);
                        // In a real app we'd trigger a refresh or optimistically add it. 
                        // For the purpose of the UI demo, we'll just close it.
                    }}
                />
            )}
        </div>
    );
};

export default OTAChannelsConfig;
