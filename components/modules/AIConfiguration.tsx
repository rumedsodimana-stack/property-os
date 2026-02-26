import React, { useState, useEffect, useRef } from 'react';
import {
    Bot, MessageCircle, Key, BarChart2, Cpu, Plus, Settings,
    Send, Trash2, Copy, Zap, Sparkles, Check, ChevronRight,
    Activity, Users, Shield, Globe, Power, Edit2, Loader,
    AlertTriangle, TrendingUp, DollarSign, Package, ArrowUpRight,
    Brain, Wand2, FlaskConical, ToggleLeft, ToggleRight, X
} from 'lucide-react';
import { aiProvider } from '../../services/intelligence/aiProvider';
import { agentService, AgentDefinition, ALL_CAPABILITIES } from '../../services/intelligence/agentService';
import { composeOperatingPrompt } from '../../services/intelligence/aiOperatingCharter';
import { autonomousBrandOrchestrator } from '../../services/brand/autonomousBrandOrchestrator';
import BrandPreviewModal from './BrandPreviewModal';
import { BrandStandards } from '../../services/brand/brandStandardsParser';
import { FileChange } from '../../services/brand/codeGenerator';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    model?: string;
    tokens?: number;
    cost?: number;
    agentName?: string;
    hasBrandStandards?: boolean;
    brandStandards?: BrandStandards;
    brandChanges?: FileChange[];
}

type NavSection = 'agents' | 'chat' | 'models' | 'keys' | 'usage';

// ─── Constants ────────────────────────────────────────────────────────────────
const ANTHROPIC_KEY = (import.meta.env as any).VITE_ANTHROPIC_API_KEY || '';
const ACTIVE_PROVIDER = ((import.meta.env as any).VITE_AI_PROVIDER as string) || 'anthropic';

const MODEL_OPTIONS = [
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', tier: 'balanced', badge: '⚡ Recommended' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', tier: 'balanced', badge: '' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', tier: 'fast', badge: '' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', tier: 'powerful', badge: '' },
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai', tier: 'balanced', badge: '' },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'gemini', tier: 'balanced', badge: '' },
    { id: 'llama3.2', name: 'Llama 3.2 (Local)', provider: 'ollama', tier: 'free', badge: '🦙 FREE' },
];

const COLOR_MAP: Record<string, string> = {
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    zinc: 'bg-zinc-800 border-zinc-700 text-zinc-400',
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

const AgentCard: React.FC<{
    agent: AgentDefinition;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onToggle: () => void;
    onDelete: () => void;
}> = ({ agent, isSelected, onSelect, onEdit, onToggle, onDelete }) => {
    const colorCls = COLOR_MAP[agent.color] || COLOR_MAP.zinc;
    return (
        <div
            onClick={onSelect}
            className={`relative group p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${isSelected
                ? 'bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-500/10'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${colorCls}`}>
                    {agent.avatar}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition">
                        <Edit2 size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 transition">
                        {agent.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    </button>
                    {!agent.isDefault && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition">
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>

            <div className="font-semibold text-white text-sm mb-0.5">{agent.name}</div>
            <div className="text-[11px] text-zinc-500 mb-3 line-clamp-2">{agent.description}</div>

            <div className="flex flex-wrap gap-1 mb-3">
                {agent.capabilities.slice(0, 3).map(cap => {
                    const c = ALL_CAPABILITIES.find(a => a.id === cap);
                    return c ? (
                        <span key={cap} className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[9px] font-medium uppercase tracking-wider">
                            {c.label}
                        </span>
                    ) : null;
                })}
                {agent.capabilities.length > 3 && (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-[9px]">+{agent.capabilities.length - 3}</span>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${agent.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                    {agent.isActive ? 'Active' : 'Inactive'}
                </div>
                <span className="text-[10px] text-zinc-600">{agent.department}</span>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AIConfiguration: React.FC = () => {
    const [section, setSection] = useState<NavSection>('agents');
    const [agents, setAgents] = useState<AgentDefinition[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(null);
    const [showAgentEditor, setShowAgentEditor] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Partial<AgentDefinition> | null>(null);
    const [savingAgent, setSavingAgent] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [activeModel, setActiveModel] = useState('claude-3-5-sonnet-20241022');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Keys state
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [showKeyInput, setShowKeyInput] = useState<string | null>(null);
    const [keyInputValue, setKeyInputValue] = useState('');

    // Brand preview
    const [showPreview, setShowPreview] = useState(false);
    const [previewStandards, setPreviewStandards] = useState<BrandStandards | null>(null);
    const [previewChanges, setPreviewChanges] = useState<FileChange[]>([]);
    const [isApplying, setIsApplying] = useState(false);

    // Load agents
    useEffect(() => {
        const unsub = agentService.subscribe(setAgents);
        return unsub;
    }, []);

    // Load API keys from localStorage + env
    useEffect(() => {
        const saved = localStorage.getItem('api_keys');
        const keys: Record<string, string> = {};
        if (saved) {
            const arr = JSON.parse(saved);
            arr.forEach((k: any) => { keys[k.provider] = k.key; });
        }
        if (ANTHROPIC_KEY && !keys.anthropic) keys.anthropic = ANTHROPIC_KEY;
        setApiKeys(keys);
        // Persist if not already
        if (ANTHROPIC_KEY && !saved) {
            const arr = [{ provider: 'anthropic', key: ANTHROPIC_KEY, masked: `${ANTHROPIC_KEY.substring(0, 8)}...${ANTHROPIC_KEY.slice(-4)}`, status: 'active', addedAt: new Date().toISOString() }];
            localStorage.setItem('api_keys', JSON.stringify(arr));
            localStorage.setItem('ai_provider', 'anthropic');
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Agent CRUD ─────────────────────────────────────────────
    const handleCreateAgent = () => {
        setEditingAgent({
            name: '',
            description: '',
            department: 'Operations',
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            systemPrompt: '',
            capabilities: [],
            isDefault: false,
            isActive: true,
            avatar: '🤖',
            color: 'violet',
            requestCount: 0,
        });
        setShowAgentEditor(true);
    };

    const handleEditAgent = (agent: AgentDefinition) => {
        setEditingAgent({ ...agent });
        setShowAgentEditor(true);
    };

    const handleSaveAgent = async () => {
        if (!editingAgent?.name) return;
        setSavingAgent(true);
        try {
            if ((editingAgent as AgentDefinition).id) {
                await agentService.update((editingAgent as AgentDefinition).id, editingAgent);
            } else {
                await agentService.create({ ...editingAgent, createdAt: Date.now() } as any);
            }
            setShowAgentEditor(false);
            setEditingAgent(null);
        } finally {
            setSavingAgent(false);
        }
    };

    const handleToggleAgent = async (agent: AgentDefinition) => {
        await agentService.update(agent.id, { isActive: !agent.isActive });
    };

    const handleDeleteAgent = async (agent: AgentDefinition) => {
        if (confirm(`Delete "${agent.name}"?`)) await agentService.delete(agent.id);
    };

    // ── Chat ───────────────────────────────────────────────────
    const handleSend = async () => {
        if (!chatInput.trim() || chatLoading) return;

        const agent = selectedAgent;
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput.trim(),
            timestamp: new Date().toISOString(),
        };
        setMessages(p => [...p, userMsg]);
        setChatInput('');
        setChatLoading(true);

        const apiKey = apiKeys[ACTIVE_PROVIDER] || ANTHROPIC_KEY || '';
        const systemPrompt = composeOperatingPrompt(agent?.systemPrompt ||
            `You are the AI Assistant for Hotel Singularity OS. You help hotel managers with operations, brand standards, and insights. Be concise and actionable.`);
        const fullPrompt = `${systemPrompt}\n\nUSER: ${chatInput.trim()}`;

        try {
            const response = await aiProvider.executeRequest(fullPrompt, {
                provider: ACTIVE_PROVIDER as any,
                apiKey,
                model: agent?.model || activeModel,
            });

            const hasBrandKeywords = /color|font|check-in|check-out|#[0-9A-Fa-f]{6}/i.test(response.content);
            let brandStandards: BrandStandards | undefined;
            let brandChanges: FileChange[] | undefined;
            if (hasBrandKeywords) {
                try {
                    const preview = await autonomousBrandOrchestrator.previewChanges(response.content);
                    if (preview.standards) { brandStandards = preview.standards; brandChanges = preview.changes; }
                } catch { /* silent */ }
            }

            setMessages(p => [...p, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                timestamp: response.timestamp,
                model: response.model,
                tokens: response.usage.total,
                cost: response.usage.cost,
                agentName: agent?.name,
                hasBrandStandards: !!brandStandards,
                brandStandards,
                brandChanges,
            }]);
        } catch (err: any) {
            setMessages(p => [...p, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${err.message}`,
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setChatLoading(false);
        }
    };

    // ── Key management ─────────────────────────────────────────
    const saveKey = (provider: string) => {
        const updated = { ...apiKeys, [provider]: keyInputValue };
        setApiKeys(updated);
        const arr = Object.entries(updated).map(([p, k]) => ({
            provider: p, key: String(k), masked: `${String(k).substring(0, 8)}...${String(k).slice(-4)}`, status: 'active', addedAt: new Date().toISOString()
        }));
        localStorage.setItem('api_keys', JSON.stringify(arr));
        localStorage.setItem('ai_provider', provider);
        setShowKeyInput(null);
        setKeyInputValue('');
    };

    const maskKey = (k: string) => k ? `${k.substring(0, 8)}...${k.slice(-4)}` : '';

    // ─── Nav items ─────────────────────────────────────────────
    const navItems: { id: NavSection; icon: React.ElementType; label: string; count?: number }[] = [
        { id: 'agents', icon: Bot, label: 'Agents', count: agents.filter(a => a.isActive).length },
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
        { id: 'models', icon: Cpu, label: 'Models' },
        { id: 'keys', icon: Key, label: 'API Keys' },
        { id: 'usage', icon: BarChart2, label: 'Usage' },
    ];

    return (
        <div className="flex h-full bg-zinc-950 overflow-hidden">

            {/* ── Left Sidebar ── */}
            <div className="w-56 flex-shrink-0 border-r border-zinc-800/80 flex flex-col bg-zinc-950">
                <div className="p-5 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
                            <Brain size={16} className="text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-white">AI Command</div>
                            <div className="text-[10px] text-zinc-500">Singularity Intelligence</div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-0.5">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSection(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${section === item.id
                                ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                }`}
                        >
                            <item.icon size={16} />
                            <span className="flex-1 text-left font-medium">{item.label}</span>
                            {item.count !== undefined && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${section === item.id ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Key status pill at bottom */}
                <div className="p-4 border-t border-zinc-800/60">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${apiKeys.anthropic ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${apiKeys.anthropic ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {apiKeys.anthropic ? 'Claude Connected' : 'No Key Set'}
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* === AGENTS PANEL === */}
                {section === 'agents' && (
                    <div className="flex flex-1 overflow-hidden">
                        {/* Agent list */}
                        <div className="w-80 flex-shrink-0 border-r border-zinc-800/80 flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-zinc-800/60">
                                <div>
                                    <h2 className="text-sm font-semibold text-white">AI Agents</h2>
                                    <p className="text-[10px] text-zinc-500">{agents.filter(a => a.isActive).length} active • {agents.length} total</p>
                                </div>
                                <button
                                    onClick={handleCreateAgent}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition"
                                >
                                    <Plus size={13} />
                                    New
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {agents.map(agent => (
                                    <AgentCard
                                        key={agent.id}
                                        agent={agent}
                                        isSelected={selectedAgent?.id === agent.id}
                                        onSelect={() => setSelectedAgent(agent)}
                                        onEdit={() => handleEditAgent(agent)}
                                        onToggle={() => handleToggleAgent(agent)}
                                        onDelete={() => handleDeleteAgent(agent)}
                                    />
                                ))}
                                {agents.length === 0 && (
                                    <div className="text-center py-12 text-zinc-600">
                                        <Bot size={40} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No agents yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Agent detail */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {selectedAgent ? (
                                <div className="max-w-2xl space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border ${COLOR_MAP[selectedAgent.color] || COLOR_MAP.zinc}`}>
                                            {selectedAgent.avatar}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-xl font-semibold text-white">{selectedAgent.name}</h2>
                                                {selectedAgent.isDefault && (
                                                    <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-semibold uppercase tracking-wider">Default</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-400 mb-2">{selectedAgent.description}</p>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                <span>{selectedAgent.department}</span>
                                                <span>•</span>
                                                <span>{selectedAgent.model}</span>
                                                {selectedAgent.linkedJobTitle && <><span>•</span><span className="text-violet-400">Linked: {selectedAgent.linkedJobTitle}</span></>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditAgent(selectedAgent)}
                                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition flex items-center gap-1.5">
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button onClick={() => { setSelectedAgent(selectedAgent); setSection('chat'); }}
                                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition flex items-center gap-1.5">
                                                <MessageCircle size={12} /> Chat
                                            </button>
                                        </div>
                                    </div>

                                    {/* System Prompt */}
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Brain size={12} /> System Prompt
                                        </h3>
                                        <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{selectedAgent.systemPrompt}</pre>
                                    </div>

                                    {/* Capabilities */}
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                                        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Zap size={12} /> Capabilities
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedAgent.capabilities.map(capId => {
                                                const cap = ALL_CAPABILITIES.find(a => a.id === capId);
                                                return cap ? (
                                                    <div key={capId} className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                                                        {cap.label}
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Requests', value: selectedAgent.requestCount || 0 },
                                            { label: 'Model', value: selectedAgent.model.split('-').slice(0, 3).join(' ') },
                                            { label: 'Provider', value: selectedAgent.provider },
                                        ].map(s => (
                                            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                                                <div className="text-lg font-bold text-white mb-1">{s.value}</div>
                                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl mb-4">🤖</div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Select an Agent</h3>
                                    <p className="text-sm text-zinc-500 max-w-xs mb-6">Click on any agent to view details, edit its system prompt, or start a chat.</p>
                                    <button onClick={handleCreateAgent} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-xl transition">
                                        <Plus size={16} /> Create New Agent
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* === CHAT PANEL === */}
                {section === 'chat' && (
                    <div className="flex flex-1 overflow-hidden">
                        {/* Conversation */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Chat header */}
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60 bg-zinc-900/40">
                                <div className="flex items-center gap-3">
                                    {selectedAgent ? (
                                        <>
                                            <div className="text-2xl">{selectedAgent.avatar}</div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">{selectedAgent.name}</div>
                                                <div className="text-[10px] text-zinc-500">{selectedAgent.model}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
                                                <Brain size={14} className="text-white" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">Singularity AI</div>
                                                <div className="text-[10px] text-zinc-500">{activeModel}</div>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium ml-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        Online
                                    </div>
                                </div>
                                <button onClick={() => setMessages([])}
                                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition">
                                    <Trash2 size={15} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                        <div className="text-5xl mb-3 select-none">{selectedAgent?.avatar || '🧠'}</div>
                                        <h3 className="text-base font-semibold text-white mb-1">
                                            {selectedAgent ? `Chat with ${selectedAgent.name}` : 'Singularity Intelligence'}
                                        </h3>
                                        <p className="text-sm text-zinc-500 mb-6 max-w-sm">
                                            {selectedAgent?.description || 'Ask anything about hotel operations, brand standards, or management insights.'}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                                            {['What can you help with?', 'Optimize my revenue strategy', 'Analyze brand standards', 'Staff scheduling advice'].map(q => (
                                                <button key={q} onClick={() => setChatInput(q)}
                                                    className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 hover:bg-violet-500/5 text-zinc-400 hover:text-white text-xs rounded-xl transition text-left">
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="flex-shrink-0 w-7 h-7 bg-violet-500/10 rounded-lg flex items-center justify-center text-sm">
                                                {selectedAgent?.avatar || '🧠'}
                                            </div>
                                        )}
                                        <div className={`max-w-[72%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-violet-600 text-white rounded-tr-sm'
                                            : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm'}`}>
                                            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</div>
                                            {msg.hasBrandStandards && msg.brandStandards && msg.brandChanges && (
                                                <button onClick={() => { setPreviewStandards(msg.brandStandards!); setPreviewChanges(msg.brandChanges!); setShowPreview(true); }}
                                                    className="mt-2 w-full px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs flex items-center justify-center gap-1.5">
                                                    <Sparkles size={12} /> Apply Brand Standards
                                                </button>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                                                <span className="text-[10px] opacity-50">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                                {msg.tokens && <span className="text-[10px] opacity-50">{msg.tokens} tok</span>}
                                                {msg.cost !== undefined && msg.cost > 0 && <span className="text-[10px] text-emerald-400/70">${msg.cost.toFixed(4)}</span>}
                                                <button onClick={() => navigator.clipboard.writeText(msg.content)} className="ml-auto opacity-40 hover:opacity-100 transition">
                                                    <Copy size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {chatLoading && (
                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 bg-violet-500/10 rounded-lg flex items-center justify-center text-sm">{selectedAgent?.avatar || '🧠'}</div>
                                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                                            <div className="flex gap-1.5">
                                                {[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-zinc-800/60 bg-zinc-900/30">
                                <div className="flex gap-2">
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                        placeholder={selectedAgent ? `Message ${selectedAgent.name}...` : 'Message Singularity AI...'}
                                        className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition"
                                        disabled={chatLoading}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!chatInput.trim() || chatLoading}
                                        className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition flex items-center gap-2 text-sm font-medium"
                                    >
                                        {chatLoading ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Agent selector sidebar */}
                        <div className="w-48 flex-shrink-0 border-l border-zinc-800/60 flex flex-col bg-zinc-950/50">
                            <div className="p-3 border-b border-zinc-800/60">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Active Agent</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                <button
                                    onClick={() => setSelectedAgent(null)}
                                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition ${!selectedAgent ? 'bg-violet-500/10 border border-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                                >
                                    <Brain size={14} />
                                    <span className="truncate">General AI</span>
                                </button>
                                {agents.filter(a => a.isActive).map(agent => (
                                    <button
                                        key={agent.id}
                                        onClick={() => setSelectedAgent(agent)}
                                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition ${selectedAgent?.id === agent.id ? 'bg-violet-500/10 border border-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
                                    >
                                        <span>{agent.avatar}</span>
                                        <span className="truncate">{agent.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* === MODELS PANEL === */}
                {section === 'models' && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h2 className="text-lg font-semibold text-white mb-1">AI Models</h2>
                        <p className="text-sm text-zinc-500 mb-6">Select the model used for your agents and direct chat.</p>
                        <div className="grid grid-cols-2 gap-4 max-w-3xl">
                            {MODEL_OPTIONS.map(model => {
                                const isActive = activeModel === model.id;
                                return (
                                    <button key={model.id} onClick={() => setActiveModel(model.id)}
                                        className={`p-5 rounded-2xl border text-left transition-all duration-200 ${isActive
                                            ? 'bg-violet-500/10 border-violet-500/40 shadow-lg shadow-violet-900/20'
                                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${model.provider === 'anthropic' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                                                : model.provider === 'openai' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : model.provider === 'gemini' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                                {model.provider}
                                            </div>
                                            {isActive && <Check size={16} className="text-violet-400" />}
                                        </div>
                                        <div className="font-semibold text-white mb-1">{model.name}</div>
                                        {model.badge && <div className="text-xs text-zinc-400">{model.badge}</div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === KEYS PANEL === */}
                {section === 'keys' && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h2 className="text-lg font-semibold text-white mb-1">API Keys</h2>
                        <p className="text-sm text-zinc-500 mb-6">Manage your AI provider credentials. Keys are stored locally.</p>
                        <div className="max-w-2xl space-y-4">
                            {[
                                { provider: 'anthropic', name: 'Anthropic Claude', icon: '🧠', color: 'violet' },
                                { provider: 'openai', name: 'OpenAI GPT', icon: '🤖', color: 'emerald' },
                                { provider: 'gemini', name: 'Google Gemini', icon: '✨', color: 'sky' },
                            ].map(p => {
                                const hasKey = !!apiKeys[p.provider];
                                return (
                                    <div key={p.provider} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="text-2xl">{p.icon}</div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-white text-sm">{p.name}</div>
                                                <div className={`text-[10px] font-medium ${hasKey ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                    {hasKey ? `Key set • ${maskKey(apiKeys[p.provider])}` : 'No key configured'}
                                                </div>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                                        </div>
                                        {showKeyInput === p.provider ? (
                                            <div className="flex gap-2">
                                                <input
                                                    autoFocus
                                                    type="password"
                                                    value={keyInputValue}
                                                    onChange={e => setKeyInputValue(e.target.value)}
                                                    placeholder={`Enter ${p.name} API key...`}
                                                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-violet-500 transition"
                                                    onKeyDown={e => e.key === 'Enter' && saveKey(p.provider)}
                                                />
                                                <button onClick={() => saveKey(p.provider)} className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-xl transition">Save</button>
                                                <button onClick={() => { setShowKeyInput(null); setKeyInputValue(''); }} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl transition">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setShowKeyInput(p.provider); setKeyInputValue(apiKeys[p.provider] || ''); }}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition flex items-center gap-2">
                                                <Key size={13} />
                                                {hasKey ? 'Update Key' : 'Add Key'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === USAGE PANEL === */}
                {section === 'usage' && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <h2 className="text-lg font-semibold text-white mb-1">Usage & Costs</h2>
                        <p className="text-sm text-zinc-500 mb-6">Session statistics for this browser session.</p>
                        {(() => {
                            const stats = aiProvider.getUsageStats();
                            return (
                                <div className="max-w-2xl space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Requests', value: stats.totalRequests, icon: Activity, color: 'violet' },
                                            { label: 'Tokens Used', value: stats.totalTokens.toLocaleString(), icon: Cpu, color: 'sky' },
                                            { label: 'Session Cost', value: `$${stats.totalCost.toFixed(4)}`, icon: DollarSign, color: 'emerald' },
                                            { label: 'Avg Tokens', value: Math.round(stats.averageTokensPerRequest), icon: TrendingUp, color: 'amber' },
                                        ].map(s => (
                                            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <s.icon size={14} className="text-zinc-500" />
                                                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{s.label}</span>
                                                </div>
                                                <div className="text-2xl font-bold text-white">{s.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {stats.totalRequests === 0 && (
                                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                                            <Activity size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No requests made this session. Start chatting to see usage stats.</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* ── Agent Editor Modal ── */}
            {showAgentEditor && editingAgent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                            <h3 className="font-semibold text-white text-sm">{(editingAgent as any).id ? 'Edit Agent' : 'New AI Agent'}</h3>
                            <button onClick={() => { setShowAgentEditor(false); setEditingAgent(null); }} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition"><X size={15} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Agent Name *</label>
                                    <input value={editingAgent.name || ''} onChange={e => setEditingAgent(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition" placeholder="e.g. Night Audit AI" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Emoji Avatar</label>
                                    <input value={editingAgent.avatar || '🤖'} onChange={e => setEditingAgent(p => ({ ...p, avatar: e.target.value }))}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Department</label>
                                    <input value={editingAgent.department || ''} onChange={e => setEditingAgent(p => ({ ...p, department: e.target.value }))}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Model</label>
                                    <select value={editingAgent.model || 'claude-3-5-sonnet-20241022'} onChange={e => setEditingAgent(p => ({ ...p, model: e.target.value }))}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition">
                                        {MODEL_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Color</label>
                                    <select value={editingAgent.color || 'violet'} onChange={e => setEditingAgent(p => ({ ...p, color: e.target.value }))}
                                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition">
                                        {['violet', 'sky', 'emerald', 'amber', 'rose', 'indigo'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Description</label>
                                <input value={editingAgent.description || ''} onChange={e => setEditingAgent(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition" placeholder="Short description of what this agent does" />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">System Prompt *</label>
                                <textarea value={editingAgent.systemPrompt || ''} onChange={e => setEditingAgent(p => ({ ...p, systemPrompt: e.target.value }))}
                                    rows={5} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition resize-none"
                                    placeholder="You are an AI agent for... Your role is to..." />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Capabilities</label>
                                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                                    {ALL_CAPABILITIES.map(cap => {
                                        const selected = (editingAgent.capabilities || []).includes(cap.id);
                                        return (
                                            <button key={cap.id} onClick={() => setEditingAgent(p => {
                                                const caps = p.capabilities || [];
                                                return { ...p, capabilities: selected ? caps.filter(c => c !== cap.id) : [...caps, cap.id] };
                                            })}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition border ${selected ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}>
                                                {selected && <span className="mr-1">✓</span>}{cap.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-zinc-800">
                            <button onClick={() => { setShowAgentEditor(false); setEditingAgent(null); }} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-xl transition">Cancel</button>
                            <button onClick={handleSaveAgent} disabled={savingAgent || !editingAgent.name}
                                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm rounded-xl transition flex items-center justify-center gap-2">
                                {savingAgent ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                                {savingAgent ? 'Saving...' : 'Save Agent'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Preview Modal */}
            {previewStandards && (
                <BrandPreviewModal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    standards={previewStandards}
                    changes={previewChanges}
                    onApply={async () => {
                        setIsApplying(true);
                        try {
                            await autonomousBrandOrchestrator.processDocument(JSON.stringify(previewStandards), true);
                            setShowPreview(false);
                        } finally { setIsApplying(false); }
                    }}
                    isApplying={isApplying}
                />
            )}
        </div>
    );
};

export default AIConfiguration;
