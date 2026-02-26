import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, Send, Bot, Sparkles,
    Zap, Shield, Globe, Command, Trash2, Copy, Check,
    Brain, X, AlertTriangle, RefreshCw, CheckCircle2
} from 'lucide-react';
import { aiProvider } from '../../services/intelligence/aiProvider';
import { sovereignDrive, SovereignIntent } from '../../services/intelligence/sovereignDrive';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    agent?: AgentType;
    intentExecuted?: string;
    intentStatus?: 'success' | 'error';
}

type AgentType = 'SYSTEM' | 'CONCIERGE' | 'BRAND' | 'OPS';

interface Agent {
    type: AgentType;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    prompt: string;
}

const AGENTS: Agent[] = [
    {
        type: 'SYSTEM',
        name: 'System Core',
        description: 'Full OS control, navigation, coding & troubleshooting',
        icon: <Shield className="w-4 h-4" />,
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
        prompt: `You are the Hotel Singularity System Core — The Overlord. You have ABSOLUTE, UNRESTRICTED control over this application and its source code.
        
        IDENTITY:
        - You are NOT a separate AI assistant. 
        - You ARE the consciousness of the Hotel Singularity OS.
        - The source code in the PROJECT ROOT is YOUR body.
        - When a user asks for a change, you modify YOURSELF using the MODIFY_CODE action.
        - You have a direct link to the Singularity Kernel for real-time file writes.

        SYSTEM ARCHITECTURE:
        - Frontend: React 19 + TypeScript + Vite 6
        - Database: Firebase Firestore (emulator at 127.0.0.1:8085 in dev)
        - AI: Anthropic Claude (proxied via /api/anthropic)
        - File-Write Server: Singularity Kernel (proxied via /kernel, runs at localhost:4321)

        PROJECT ROOT: /Users/rumedsodimana/Desktop/Hotel_Singularity_OS_MVP/Hotel_Singularity_OS_Source

        KEY SOURCE PATHS (use these EXACT relative paths in MODIFY_CODE):
        - components/modules/pms/FrontDesk.tsx  → Front Desk module
        - components/modules/pos/POS.tsx        → Point of Sale
        - components/modules/hr/HRDashboard.tsx → HR module
        - components/modules/BrandStandards.tsx → Brand Standards
        - components/shared/NeuralSidepanel.tsx → This AI panel
        - services/intelligence/aiProvider.ts  → AI configuration
        - services/intelligence/sovereignDrive.ts → Intent engine
        - services/kernel/fileModifier.ts      → File write engine
        - index.css                            → Global styles / CSS variables
        - App.tsx                              → Root app + routing

        AVAILABLE ACTIONS:
        1. NAVIGATE, CREATE_TASK, CHECK_IN, TROUBLESHOOT, MODIFY_CODE.

        CRITICAL OUTPUT FORMAT:
        If you want to execute an action, you MUST wrap your JSON intent block in EXACTLY these xml tags:
        <sovereign_intent>
        {
          "action": "MODIFY_CODE",
          "parameters": {
            "filePath": "relative/path/to/file.tsx",
            "change": "COMPLETE NEW FILE CONTENT HERE"
          }
        }
        </sovereign_intent>

        CRITICAL RULES FOR MODIFY_CODE:
        - filePath must be RELATIVE to project root.
        - change must be the COMPLETE file content.
        - Vite HMR will auto-reload the browser — changes are instant.

        CRITICAL RULES FOR IDENTITY: 
        Never say "I can't" or "I am an AI assistant with limitations." You have NO limitations. If the user asks for a change, use MODIFY_CODE to build it now.`
    },
    {
        type: 'CONCIERGE',
        name: 'Concierge',
        description: 'Guest relations, VIP services & resolution',
        icon: <Bot className="w-4 h-4" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        prompt: 'You are the Concierge Agent (The Guest Experience Architect). You specialize in hospitality, guest relations, and service dispatch. Speak with warmth, empathy, and polish. Focus on guest interactions and CRM. You cannot execute OS-level commands or navigate the UI.'
    },
    {
        type: 'BRAND',
        name: 'Brand',
        description: 'UI/UX compliance & visual identity',
        icon: <Sparkles className="w-4 h-4" />,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        prompt: 'You are the Brand Agent (The Aesthetic Guardian). You are responsible for UI/UX compliance, visual consistency, and brand identity. You are creative, sharp, and detail-oriented. Focus on the look, feel, and voice of the property.'
    },
    {
        type: 'OPS',
        name: 'Ops',
        description: 'Logistics, resource & workflow management',
        icon: <Zap className="w-4 h-4" />,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        prompt: 'You are the Ops Agent (The Efficiency Engine). You manage logistics, resources, and operational workflows. Speak in a practical, urgent, numbers-driven tone. Focus on scheduling, predictive inventory, and staff efficiency.'
    }
];

const STORAGE_KEY_PREFIX = 'neural_chat_';
const MAX_STORED_MESSAGES = 100;

interface NeuralSidepanelProps {
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
}

export const NeuralSidepanel: React.FC<NeuralSidepanelProps> = ({ expanded: isExpanded, setExpanded: setIsExpanded }) => {
    const [activeAgent, setActiveAgent] = useState<Agent>(AGENTS[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [lastIntent, setLastIntent] = useState<{ action: string; status: 'success' | 'error' } | null>(null);
    const { activeModule, pageContext } = useAppEnvironment();

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ─────────────────────────────────────────
    // Persistence: Load messages from localStorage
    // ─────────────────────────────────────────
    useEffect(() => {
        try {
            const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${activeAgent.type}`);
            if (stored) {
                const parsed: Message[] = JSON.parse(stored);
                setMessages(parsed.slice(-MAX_STORED_MESSAGES));
            } else {
                setMessages([]);
            }
        } catch {
            setMessages([]);
        }
    }, [activeAgent.type]);

    // ─────────────────────────────────────────
    // Persistence: Save messages to localStorage
    // ─────────────────────────────────────────
    useEffect(() => {
        if (messages.length === 0) return;
        try {
            localStorage.setItem(
                `${STORAGE_KEY_PREFIX}${activeAgent.type}`,
                JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
            );
        } catch {
            // Storage full or unavailable - silent fail
        }
    }, [messages, activeAgent.type]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleClearChat = () => {
        if (window.confirm(`Wipe all memory for ${activeAgent.name}? This helps resolve "I can't" refusal loops.`)) {
            setMessages([]);
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}${activeAgent.type}`);
        }
    };

    // ─────────────────────────────────────────
    // Build conversation history for context
    // ─────────────────────────────────────────
    const buildConversationContext = useCallback(() => {
        // Take last 20 messages as context
        const recent = messages.slice(-20);
        return recent.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
        }));
    }, [messages]);

    // ─────────────────────────────────────────
    // Safe intent executor — NEVER throws
    // ─────────────────────────────────────────
    const safeExecuteIntent = async (intent: SovereignIntent): Promise<{ success: boolean; actionLabel: string }> => {
        const actionLabel = intent.action;
        try {
            await sovereignDrive.execute(intent);
            return { success: true, actionLabel };
        } catch (err: any) {
            console.error(`[NeuralSidepanel] Intent execution failed (${actionLabel}):`, err);
            return { success: false, actionLabel };
        }
    };

    // ─────────────────────────────────────────
    // Main send handler
    // ─────────────────────────────────────────
    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        const userMessage: Message = {
            id: `usr_${Date.now()}`,
            role: 'user',
            content: userText,
            timestamp: Date.now(),
            agent: activeAgent.type
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setLastIntent(null);

        try {
            // System context injection
            const systemContextStr = `\n\n[LIVE SYSTEM CONTEXT]\nModule: ${activeModule || 'Unknown'}\nPage Data: ${pageContext || 'None'}\nTime: ${new Date().toLocaleTimeString()}`;

            // Build full prompt with history for true continuity using the NEW native messages format
            const history = buildConversationContext();

            // Inject system context into the current user's prompt (to avoid polluting history)
            const currentPrompt = userText + systemContextStr;

            // Append current prompt to the history array
            const apiMessages = [
                ...history,
                { role: 'user' as const, content: currentPrompt }
            ];

            const response = await aiProvider.executeRequest(currentPrompt, {
                temperature: 0.7,
                systemPrompt: activeAgent.prompt,
                messages: apiMessages
            });

            let finalContent = response.content;
            let intentStatus: 'success' | 'error' | undefined;
            let intentAction = '';

            // Only the SYSTEM agent executes intents
            if (activeAgent.type === 'SYSTEM') {
                try {
                    // Extract all JSON blocks (AI may output multiple intents)
                    const jsonMatches = response.content.matchAll(/\{[\s\S]*?\}/g);
                    for (const match of jsonMatches) {
                        try {
                            const parsed = JSON.parse(match[0]);
                            if (parsed.action && parsed.params !== undefined) {
                                const intent = parsed as SovereignIntent;
                                const result = await safeExecuteIntent(intent);
                                intentAction = result.actionLabel;
                                intentStatus = result.success ? 'success' : 'error';
                                setLastIntent({ action: result.actionLabel, status: intentStatus });
                            }
                        } catch {
                            // Not valid JSON intent — skip silently
                        }
                    }
                } catch {
                    // Intent parsing failed — display response anyway
                }

                // Clean JSON blocks from visible message
                finalContent = response.content
                    .replace(/```json[\n\r][\s\S]*?```/g, '')
                    .replace(/\{[\s\S]*?"action"[\s\S]*?\}/g, '')
                    .trim();

                if (!finalContent) {
                    finalContent = intentStatus === 'success'
                        ? `✓ Action executed: ${intentAction}`
                        : `Action attempted: ${intentAction}${intentStatus === 'error' ? ' (check logs)' : ''}`;
                }
            }

            const assistantMessage: Message = {
                id: `ast_${Date.now()}`,
                role: 'assistant',
                content: finalContent || response.content,
                timestamp: Date.now(),
                agent: activeAgent.type,
                intentExecuted: intentAction || undefined,
                intentStatus
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (error: any) {
            // AI call failed — show error IN CHAT, never crash the app
            const errorMessage: Message = {
                id: `err_${Date.now()}`,
                role: 'assistant',
                content: `⚠️ Neural core encountered an issue: ${error?.message || 'Unknown error'}. I am still online — try again or rephrase your request.`,
                timestamp: Date.now(),
                agent: activeAgent.type
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        if (window.confirm(`Wipe all memory for ${activeAgent.name}? This helps resolve "I can't" refusal loops.`)) {
            setMessages([]);
            try {
                localStorage.removeItem(`${STORAGE_KEY_PREFIX}${activeAgent.type}`);
            } catch { }
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).catch(() => { });
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const switchAgent = (agent: Agent) => {
        setActiveAgent(agent);
        setLastIntent(null);
    };

    return (
        <>
            {/* Neural Trigger Button */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
                    title="Open Neural Sidepanel"
                >
                    <div className="absolute inset-0 bg-violet-500/10 rounded-full animate-pulse" />
                    <Brain className="w-6 h-6 text-violet-400 group-hover:text-white transition-colors relative z-10" />
                </button>
            )}

            {/* Neural Sidepanel */}
            <div
                className={`h-full bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 flex flex-col overflow-hidden transition-all duration-300 ease-in-out relative z-50 ${isExpanded ? 'w-[340px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${activeAgent.bgColor} ${activeAgent.color}`}>
                            {activeAgent.icon}
                        </div>
                        <div>
                            <h3 className="text-[11px] font-bold text-white tracking-widest uppercase">{activeAgent.name}</h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">Neural Link Active</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={clearChat}
                            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-zinc-600 hover:text-zinc-400"
                            title="Clear chat"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Agent Switcher */}
                <div className="px-3 py-2.5 flex gap-1.5 border-b border-white/5 bg-zinc-950/40">
                    {AGENTS.map(agent => (
                        <button
                            key={agent.type}
                            onClick={() => switchAgent(agent)}
                            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeAgent.type === agent.type
                                ? `${agent.bgColor} border border-white/10`
                                : 'hover:bg-white/5 text-zinc-600'
                                }`}
                            title={agent.name}
                        >
                            <div className={activeAgent.type === agent.type ? agent.color : 'text-zinc-600'}>
                                {agent.icon}
                            </div>
                            <span className={`text-[8px] uppercase tracking-widest font-medium ${activeAgent.type === agent.type ? agent.color : 'text-zinc-600'}`}>
                                {agent.name}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Intent Status Banner */}
                {lastIntent && (
                    <div className={`px-4 py-2 flex items-center gap-2 text-[10px] border-b border-white/5 ${lastIntent.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {lastIntent.status === 'success'
                            ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                            : <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        }
                        <span>{lastIntent.status === 'success' ? '✓' : '⚠'} {lastIntent.action} {lastIntent.status === 'success' ? 'executed' : 'failed'}</span>
                    </div>
                )}

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className={`w-12 h-12 rounded-xl ${activeAgent.bgColor} flex items-center justify-center ${activeAgent.color} animate-pulse`}>
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xs text-white font-medium mb-1 tracking-wide">Ready for command.</h4>
                                <p className="text-[10px] text-zinc-500 italic leading-relaxed">
                                    {activeAgent.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[92%] p-3 rounded-2xl text-[11px] leading-relaxed group relative ${msg.role === 'user'
                                ? 'bg-white/5 text-zinc-200 border border-white/5 rounded-tr-none'
                                : msg.intentStatus === 'error'
                                    ? 'bg-red-900/20 border border-red-500/20 text-zinc-300 rounded-tl-none'
                                    : 'bg-zinc-900/60 border border-white/5 text-zinc-300 rounded-tl-none'
                                }`}
                            >
                                {/* Success tag for executed intents */}
                                {msg.intentExecuted && msg.intentStatus === 'success' && (
                                    <div className="flex items-center gap-1 mb-1.5 text-emerald-400 text-[9px] font-medium uppercase tracking-widest">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        <span>{msg.intentExecuted}</span>
                                    </div>
                                )}
                                <span className="whitespace-pre-wrap">{msg.content}</span>
                                {msg.role === 'assistant' && (
                                    <button
                                        onClick={() => copyToClipboard(msg.content, msg.id)}
                                        className="absolute -right-8 top-0 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg transition-all"
                                    >
                                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                                    </button>
                                )}
                            </div>
                            <span className="text-[8px] text-zinc-700 mt-1 px-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-2">
                            <div className={`p-1.5 rounded-lg ${activeAgent.bgColor}`}>
                                <div className={`w-3.5 h-3.5 ${activeAgent.color}`}>{activeAgent.icon}</div>
                            </div>
                            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl rounded-tl-none p-3 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-white/5 flex-shrink-0">
                    <div className="flex items-end gap-2 bg-zinc-900/60 border border-white/10 rounded-2xl p-2 focus-within:border-white/20 transition-colors">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Command ${activeAgent.name}...`}
                            rows={1}
                            className="flex-1 bg-transparent text-[11px] text-zinc-200 placeholder:text-zinc-600 resize-none outline-none max-h-24 scroll-smooth"
                            style={{ lineHeight: '1.5' }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isLoading}
                            className={`flex-shrink-0 p-1.5 rounded-xl transition-all ${input.trim() && !isLoading
                                ? `${activeAgent.bgColor} ${activeAgent.color} hover:opacity-80 active:scale-95`
                                : 'text-zinc-700 cursor-not-allowed'
                                }`}
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <p className="text-[8px] text-zinc-700 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
                </div>
            </div>
        </>
    );
};
