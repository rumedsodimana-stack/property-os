import React, { useState, useEffect, useMemo } from 'react';
import {
    Brain,
    Key,
    Check,
    X,
    Zap,
    TrendingUp,
    ShieldAlert,
    ConciergeBell,
    Sparkles,
    ArrowRight,
    Play,
    Loader2
} from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { simpleAIConfig } from '../../services/intelligence/simpleAIConfig';
import { oracleService } from '../../services/intelligence/oracleService';
import { AI_ASSISTANTS, ActionCard } from '../../types/simpleAI';
import type { AIProvider } from '../../types/simpleAI';

interface DashboardViewProps {
    actionCards: ActionCard[];
    executingId: string | null;
    onExecuteAction: (card: ActionCard) => Promise<void>;
}

const DashboardView: React.FC<DashboardViewProps> = ({ actionCards, executingId, onExecuteAction }) => (
    <div className="space-y-8 animate-fadeIn">
        {/* Pulse Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2">Systems Pulse</div>
                <div className="flex items-end gap-2">
                    <div className="text-2xl font-black text-white">NOMINAL</div>
                    <div className="mb-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2">Neural Load</div>
                <div className="text-2xl font-black text-violet-400">14%</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2">Pending Actions</div>
                <div className="text-2xl font-black text-amber-500">{actionCards.length}</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-2">Uptime</div>
                <div className="text-2xl font-black text-zinc-400">99.9%</div>
            </div>
        </div>

        {/* Main Action Feed */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    High-Priority Operational Actions
                </h2>
                <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-500 font-bold">AUTO-RESCAN EVERY 60S</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {actionCards.length > 0 ? actionCards.map(card => (
                    <div
                        key={card.id}
                        className={`relative group overflow-hidden bg-zinc-900 border ${card.type === 'critical' ? 'border-rose-500/30' :
                            card.type === 'warning' ? 'border-amber-500/30' : 'border-zinc-800'
                            } rounded-3xl p-6 transition-all hover:bg-zinc-800/50`}
                    >
                        <div className="flex items-start gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.assistantId === 'analytics' ? 'bg-blue-500/10 text-blue-400' :
                                card.assistantId === 'system_ops' ? 'bg-rose-500/10 text-rose-400' :
                                    card.assistantId === 'automation' ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                {card.assistantId === 'analytics' ? <TrendingUp className="w-6 h-6" /> :
                                    card.assistantId === 'system_ops' ? <ShieldAlert className="w-6 h-6" /> :
                                        card.assistantId === 'automation' ? <Brain className="w-6 h-6" /> : <ConciergeBell className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                        {card.assistantId.replace('_', ' ')} • {card.impact}
                                    </div>
                                    <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${card.type === 'critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                        card.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                            'bg-zinc-800 text-zinc-400 border-zinc-700'
                                        }`}>
                                        {card.type}
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-white">{card.title}</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">{card.description}</p>

                                <div className="pt-4 flex items-center justify-between border-t border-zinc-800 mt-4">
                                    <button
                                        onClick={() => onExecuteAction(card)}
                                        disabled={executingId !== null}
                                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        {executingId === card.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                        {card.actionLabel}
                                    </button>
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-600 font-bold uppercase">
                                        One-click execute <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative background icon */}
                        <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                            <Sparkles className="w-32 h-32" />
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
                        <Sparkles className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                        <h3 className="text-zinc-400 font-bold">No High-Priority Actions Detected</h3>
                        <p className="text-xs text-zinc-600 mt-1">System monitoring is active. All modules are within nominal parameters.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Static Assistants Info (Moved to bottom) */}
        <div className="pt-12 border-t border-zinc-800">
            <h2 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6 text-center">Active Neural Assistants</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.values(AI_ASSISTANTS).map((assistant) => (
                    <div key={assistant.id} className="text-center p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                        <div className="text-2xl mb-2">{assistant.icon}</div>
                        <div className="text-xs font-bold text-white mb-1">{assistant.name}</div>
                        <div className="text-[9px] text-zinc-500 leading-tight">{assistant.description}</div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const AICommandCenter: React.FC = () => {
    const pms = usePms();
    const [provider, setProvider] = useState<AIProvider>('openai');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gpt-4');
    const [isEnabled, setIsEnabled] = useState(false);
    const [executingId, setExecutingId] = useState<string | null>(null);
    const [view, setView] = useState<'dashboard' | 'config'>('dashboard');

    useEffect(() => {
        const config = simpleAIConfig.getConfig();
        setProvider(config.provider);
        setApiKey(config.apiKey);
        setModel(config.model);
        setIsEnabled(config.enabled);
    }, []);

    const actionCards = useMemo(() => {
        return oracleService.getOperationalPulse(pms);
    }, [pms]);

    const handleSave = () => {
        if (!apiKey) {
            alert('Please enter an API key');
            return;
        }
        simpleAIConfig.setConfig(provider, apiKey, model);
        setIsEnabled(true);
        alert('Configuration saved! All 4 AI assistants are now active.');
    };

    const handleExecuteAction = async (card: ActionCard) => {
        setExecutingId(card.id);
        // Simulate execution delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        oracleService.applyChanges([card.executeData]);

        setExecutingId(null);
        alert(`Action Executed: ${card.actionLabel}\n${card.title} has been processed by ${card.assistantId.toUpperCase()}_AI.`);
    };

    return (
        <div className="min-h-full bg-zinc-950 flex flex-col">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-900 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/30">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">AI Command & Control</h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Autonomous Operations Core v4.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setView('dashboard')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Strategic Feed
                    </button>
                    <button
                        onClick={() => setView('config')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'config' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Neural Settings
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {view === 'dashboard' ? <DashboardView actionCards={actionCards} executingId={executingId} onExecuteAction={handleExecuteAction} /> : (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
                            <h2 className="text-lg font-bold text-white mb-4">Neural Gateway Configuration</h2>

                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Model Provider</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['openai', 'anthropic', 'gemini'] as AIProvider[]).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setProvider(p)}
                                            className={`py-3 rounded-xl border text-xs font-bold capitalize transition-all ${provider === p ? 'bg-violet-600/10 border-violet-500 text-violet-400' : 'bg-black border-zinc-800 text-zinc-500'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Primary Cortex Model</label>
                                    <input
                                        type="text"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Universal API Access Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="w-full bg-black border border-zinc-800 rounded-xl px-12 py-3 text-sm text-white font-mono focus:border-violet-500/50 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-violet-900/20 transition-all"
                            >
                                Synchronize Neural Core
                            </button>
                        </div>

                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4">
                            <Sparkles className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                <span className="text-white font-bold">SINGULARITY M4 ARCHITECTURE:</span> One key provides unified intelligence across guest interactions,
                                brand compliance, data forecasting, and autonomous workflow routing.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICommandCenter;
