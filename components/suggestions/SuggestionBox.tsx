
import React, { useState, useEffect, useRef } from 'react';
import { SystemAnomaly, systemBus } from '../../services/kernel/systemBridge';
import {
    AlertCircle, CheckCircle, X, Terminal,
    Play, Pause, RefreshCw, Zap, ServerCrash, ShieldAlert, Brain, Search, Activity
} from 'lucide-react';

const SuggestionBox: React.FC = () => {
    const [anomalies, setAnomalies] = useState<SystemAnomaly[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(true);
    const [logFeed, setLogFeed] = useState<string[]>([]);

    useEffect(() => {
        // Listener for Anomalies (Errors/Improvements)
        const handleAnomaly = (anomaly: SystemAnomaly) => {
            if (!isMonitoring) return;
            setAnomalies(prev => [anomaly, ...prev]);
            setLogFeed(prev => [`[ALERT] ${anomaly.module}: ${anomaly.content}`, ...prev.slice(0, 9)]);
        };

        // Listener for General Logs (just for the feed banner)
        const handleLog = (log: any) => {
            if (!isMonitoring) return;
            setLogFeed(prev => [`${log.module} > ${log.action}`, ...prev.slice(0, 9)]);
        };

        systemBus.on('anomaly', handleAnomaly);
        systemBus.on('log', handleLog);

        return () => {
            systemBus.off('anomaly', handleAnomaly);
            systemBus.off('log', handleLog);
        };
    }, [isMonitoring]);

    const handleResolve = (id: string) => {
        setAnomalies(prev => prev.filter(a => a.id !== id));
    };

    const getPriorityStyles = (p: string) => {
        switch (p) {
            case 'Critical': return 'border-rose-500 bg-rose-500/10 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)] animate-pulse';
            case 'High': return 'border-rose-500/50 bg-rose-500/5 text-rose-400';
            case 'Medium': return 'border-amber-500/50 bg-amber-500/5 text-amber-400';
            default: return 'border-zinc-700 bg-zinc-800 text-zinc-400';
        }
    };

    return (
        <div className="module-container bg-transparent flex flex-col h-full overflow-hidden">
            {/* Standardized Suggestion Header */}
            <header className="module-header flex items-center justify-between gap-6 flex-nowrap">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="bg-zinc-800/50 p-3 rounded-2xl border border-zinc-700/50">
                        <Brain className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light text-white tracking-tight leading-none">Autonomic Core</h2>
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">AI Substrate Monitoring</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-nowrap overflow-x-auto scrollbar-hide py-1">
                    <div className={`px-3 py-1.5 border rounded-xl flex items-center gap-2 transition flex-shrink-0 ${isMonitoring ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isMonitoring ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isMonitoring ? 'Core Synced' : 'Core Offline'}
                        </span>
                    </div>

                    <button
                        onClick={() => setIsMonitoring(!isMonitoring)}
                        className={`p-2 rounded-xl border transition flex-shrink-0 ${isMonitoring ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20'}`}
                    >
                        {isMonitoring ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    <div className="h-8 w-px bg-zinc-800 mx-2 flex-shrink-0"></div>

                    {/* Search Placeholder for consistency */}
                    <div className="relative flex-shrink-0">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Find anomalies..."
                            className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-[11px] text-zinc-300 focus:border-violet-500/50 outline-none transition-all focus:w-64"
                        />
                    </div>

                    <button className="flex items-center justify-center gap-2 min-w-[90px] px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-violet-500/50 flex-shrink-0">
                        <Zap className="w-3.5 h-3.5" /> Reports
                    </button>
                </div>
            </header>

            {/* Live Activity Stream Banner */}
            <div className="bg-black border-b border-zinc-900 h-24 p-4 font-mono text-[10px] overflow-hidden relative shrink-0">
                <div className="absolute top-2 right-4 text-zinc-700 font-bold uppercase tracking-widest text-[9px]">
                    Substrate Kernel Feed
                </div>
                <div className="space-y-1 opacity-80">
                    {logFeed.map((log, i) => (
                        <div key={i} className={`truncate ${log.includes('[ALERT]') ? 'text-rose-500 font-bold' : 'text-zinc-600'}`}>
                            <span className="text-zinc-800 mr-2 font-bold opacity-50">&gt;</span> {log}
                        </div>
                    ))}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black to-transparent"></div>
            </div>

            <main className="module-body bg-zinc-950/20">
                {anomalies.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 animate-fadeIn">
                        <div className="p-8 bg-zinc-900/40 rounded-full border border-zinc-800/50 mb-6">
                            <ShieldAlert className="w-16 h-16 opacity-20" />
                        </div>
                        <h3 className="text-xl font-light text-zinc-500">System Nominal</h3>
                        <p className="text-sm mt-2 opacity-50">No active substrate errors or improvement prompts detected.</p>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-4">
                        {anomalies.map(anomaly => (
                            <div
                                key={anomaly.id}
                                className={`bg-zinc-900/50 border rounded-2xl p-5 transition-all duration-200 flex gap-5 hover:shadow-lg ${getPriorityStyles(anomaly.priority)}`}
                            >
                                {/* Icon */}
                                <div className="flex flex-col items-center gap-2 min-w-[50px]">
                                    {anomaly.priority === 'Critical' || anomaly.priority === 'High' ? (
                                        <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                            <ServerCrash className="w-6 h-6" />
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                            <AlertCircle className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-[9px] uppercase tracking-wide text-zinc-500 bg-black/40 px-2 py-0.5 rounded border border-zinc-800">{anomaly.module} ERROR</span>
                                            <span className="text-[9px] text-zinc-600 font-medium">{new Date(anomaly.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <span className="text-[9px] uppercase font-bold border px-2 py-0.5 rounded border-current">{anomaly.priority}</span>
                                    </div>

                                    <h3 className="text-base font-semibold text-zinc-100 mb-2">{anomaly.content}</h3>
                                    <div className="p-3 bg-black/50 border border-zinc-800/50 rounded-xl mb-3 font-mono text-[10px] text-zinc-500 overflow-x-auto">
                                        {anomaly.technicalDetails || "No stack trace available. AI diagnostics in progress..."}
                                    </div>

                                    <div className="text-[9px] text-zinc-600 uppercase font-semibold tracking-wide flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-violet-400" /> Origin: {anomaly.source}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col justify-center gap-2 border-l border-zinc-800/50 pl-5">
                                    <button
                                        onClick={() => handleResolve(anomaly.id)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Heal
                                    </button>
                                    <button
                                        onClick={() => handleResolve(anomaly.id)}
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <X className="w-3 h-3" /> Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <footer className="module-footer flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 px-6 py-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">AI Substrate Online</span>
                    </div>
                    <div className="h-4 w-px bg-zinc-800"></div>
                    <span className="text-[10px] text-zinc-500 font-medium font-mono">Cognitive Load: 14%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-right">Core: Nominal</span>
                </div>
            </footer>
        </div>
    );
};

export default SuggestionBox;
