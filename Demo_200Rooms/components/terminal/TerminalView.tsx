
import React, { useState, useEffect, useRef } from 'react';
import { systemBus, SystemLog, SystemPerformance } from '../../services/kernel/systemBridge';
import { Pause, Play, Trash2, Terminal as TerminalIcon, Activity, Cpu, Network, Search } from 'lucide-react';

const TerminalView: React.FC = () => {
    const [lines, setLines] = useState<SystemLog[]>([]);
    const [metrics, setMetrics] = useState<SystemPerformance>({ cpu: 0, memory: 0, network: 0, requests: 0, uptime: 0 });
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const handleLog = (log: SystemLog) => {
            if (isPaused) return;
            setLines(prev => {
                const newLines = [...prev, log];
                if (newLines.length > 150) newLines.shift(); // Memory management
                return newLines;
            });
        };

        const handlePerf = (perf: SystemPerformance) => {
            setMetrics(perf);
        };

        systemBus.on('log', handleLog);
        systemBus.on('performance', handlePerf);

        return () => {
            systemBus.off('log', handleLog);
            systemBus.off('performance', handlePerf);
        };
    }, [isPaused]);

    useEffect(() => {
        if (scrollRef.current && !isPaused) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines, isPaused]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'text-emerald-500';
            case 'WARNING': return 'text-amber-500';
            case 'ERROR': return 'text-rose-500 font-bold';
            default: return 'text-zinc-400';
        }
    };

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="module-container bg-transparent flex flex-col h-full overflow-hidden">
            {/* Standardized Terminal Header */}
            <header className="module-header flex items-center justify-between gap-6 flex-nowrap">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="bg-zinc-800/50 p-3 rounded-2xl border border-zinc-700/50">
                        <TerminalIcon className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light text-white tracking-tight leading-none">System Terminal</h2>
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Real-time Kernel Telemetry</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-nowrap overflow-x-auto scrollbar-hide py-1">
                    {/* Metrics in Header */}
                    <div className="hidden lg:flex items-center gap-4 px-4 border-r border-zinc-800/50 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-3 h-3 text-zinc-600" />
                            <span className={`text-[10px] font-mono ${metrics.cpu > 80 ? 'text-rose-500' : 'text-zinc-500'}`}>{metrics.cpu}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-zinc-600" />
                            <span className={`text-[10px] font-mono ${metrics.memory > 80 ? 'text-amber-500' : 'text-zinc-500'}`}>{metrics.memory}%</span>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`p-2 rounded-xl border transition ${isPaused ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                            title={isPaused ? "Resume Stream" : "Pause Stream"}
                        >
                            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={() => setLines([])}
                            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-rose-500 transition"
                            title="Clear Logs"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-zinc-800 mx-2 flex-shrink-0"></div>

                    {/* Search Placeholder for consistency */}
                    <div className="relative flex-shrink-0">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Filter logs..."
                            className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-[11px] text-zinc-300 focus:border-violet-500/50 outline-none transition-all focus:w-64"
                        />
                    </div>

                    <button className="flex items-center justify-center gap-2 min-w-[90px] px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-violet-500/50 flex-shrink-0">
                        <Activity className="w-3.5 h-3.5" /> Reports
                    </button>
                </div>
            </header>

            <main className="module-body p-0 flex flex-col bg-black">
                {/* Terminal Surface */}
                <div
                    ref={scrollRef}
                    className="flex-1 p-6 overflow-y-auto space-y-1 custom-scrollbar font-mono text-xs md:text-[13px] selection:bg-violet-500/30"
                >
                    {lines.length === 0 && (
                        <div className="text-zinc-700 animate-pulse font-mono tracking-tighter">
                            [SYSTEM] Initializing Kernel Bus...<br />
                            [SYSTEM] Awaiting user interaction telemetry...
                        </div>
                    )}

                    {lines.map((log) => (
                        <div key={log.id} className="flex gap-3 hover:bg-zinc-900/50 px-2 py-1 rounded-lg transition-colors group">
                            <span className="text-zinc-700 shrink-0 font-medium text-[11px]">
                                {log.timestamp.substring(11, 19)}
                            </span>
                            <span className={`shrink-0 font-semibold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide min-w-[70px] text-center ${log.module === 'KERNEL' ? 'bg-zinc-800/80 text-zinc-400' :
                                log.module === 'POS' ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-violet-500/10 text-violet-400'
                                }`}>
                                {log.module}
                            </span>
                            <span className="flex-1 break-all flex items-center gap-2 text-[12px]">
                                <span className="text-zinc-600 uppercase text-[9px] font-semibold">[{log.source}]</span>
                                <span className={log.status === 'ERROR' ? 'text-rose-400' : 'text-zinc-300'}>
                                    {log.action} <span className="text-zinc-500 font-normal opacity-60">— {log.details}</span>
                                </span>
                            </span>
                            <span className="shrink-0 text-[10px] font-mono opacity-40 group-hover:opacity-80 transition-opacity">
                                <span className={getStatusColor(log.status)}>{log.latency}ms</span>
                            </span>
                        </div>
                    ))}

                    {!isPaused && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-emerald-500 font-bold block">➜</span>
                            <span className="bg-emerald-500 w-2 h-4 animate-pulse"></span>
                        </div>
                    )}
                </div>

                {/* Console Status Bar */}
                <footer className="module-footer flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 px-6 py-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-bold text-zinc-400 uppercase tracking-widest">System Online</span>
                        </div>
                        <div className="h-4 w-px bg-zinc-800"></div>
                        <span className="text-[10px] text-zinc-600 font-mono">BUFFER: {lines.length}/150 | UPTIME: {formatUptime(metrics.uptime)}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-right">Node: Active</span>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default TerminalView;
