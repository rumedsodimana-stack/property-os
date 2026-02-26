import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Trash2, Copy, Bot, User, Zap, Sparkles } from 'lucide-react';
import { aiProvider } from '../../services/intelligence/aiProvider';
import { autonomousBrandOrchestrator } from '../../services/brand/autonomousBrandOrchestrator';
import BrandPreviewModal from './BrandPreviewModal';
import { BrandStandards } from '../../services/brand/brandStandardsParser';
import { FileChange } from '../../services/brand/codeGenerator';
import { composeOperatingPrompt } from '../../services/intelligence/aiOperatingCharter';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    model?: string;
    tokens?: number;
    cost?: number;
    hasBrandStandards?: boolean;
    brandStandards?: BrandStandards;
    brandChanges?: FileChange[];
}

const AIChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeProvider, setActiveProvider] = useState<string>('ollama');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Brand preview modal state
    const [showPreview, setShowPreview] = useState(false);
    const [previewStandards, setPreviewStandards] = useState<BrandStandards | null>(null);
    const [previewChanges, setPreviewChanges] = useState<FileChange[]>([]);
    const [isApplying, setIsApplying] = useState(false);

    // Load active provider from localStorage or env
    useEffect(() => {
        const envProvider = (import.meta.env as any).VITE_AI_PROVIDER;
        const saved = localStorage.getItem('ai_provider');
        const provider = envProvider || saved || 'ollama';
        setActiveProvider(provider);

        // If no key saved yet in localStorage, seed it from env
        const savedKeys = localStorage.getItem('api_keys');
        if (!savedKeys && (import.meta.env as any).VITE_ANTHROPIC_API_KEY) {
            const envKey = (import.meta.env as any).VITE_ANTHROPIC_API_KEY;
            const keys = [{ provider: 'anthropic', key: envKey, masked: `${envKey.substring(0, 8)}...${envKey.slice(-4)}`, status: 'active', addedAt: new Date().toISOString() }];
            localStorage.setItem('api_keys', JSON.stringify(keys));
        }
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Get correct model for provider
            const modelMap: Record<string, string> = {
                ollama: 'llama3.2',
                anthropic: 'claude-3-5-sonnet-20241022',
                openai: 'gpt-4',
                gemini: 'gemini-pro'
            };

            // Read API key from localStorage or env
            const getApiKey = (): string => {
                // Try localStorage first (set via AISettings UI)
                const savedKeys = localStorage.getItem('api_keys');
                if (savedKeys) {
                    const keys = JSON.parse(savedKeys);
                    const match = keys.find((k: any) => k.provider === activeProvider);
                    if (match?.key) return match.key;
                }
                // Fall back to env
                const envKeyMap: Record<string, string> = {
                    anthropic: (import.meta.env as any).VITE_ANTHROPIC_API_KEY || '',
                    openai: (import.meta.env as any).VITE_OPENAI_API_KEY || '',
                    gemini: (import.meta.env as any).VITE_GEMINI_API_KEY || '',
                    ollama: ''
                };
                return envKeyMap[activeProvider] || '';
            };

            // System prompt - gives AI context about the app
            const systemPrompt = composeOperatingPrompt(`You are the AI Assistant for Hotel Singularity OS, an advanced autonomous hotel brand standards management system.

YOUR ROLE:
- You are the Brand Standards AI Assistant
- You help hotel managers analyze brand documents, extract standards, and maintain consistency
- You work within a complete hotel operations platform (PMS, POS, Housekeeping, etc.)

YOUR CAPABILITIES:
1. **Brand Document Analysis**: Extract colors (hex codes), fonts, policies, operating hours, service standards
2. **Color Extraction**: Parse text for hex codes, RGB values, color names
3. **Policy Interpretation**: Explain hotel policies, check-in/out times, service guidelines
4. **Standards Compliance**: Help ensure brand consistency across all departments
5. **Department Impact**: Explain how brand changes affect each of 8 hotel departments

THE SYSTEM YOU'RE IN:
- Hotel Singularity OS manages: Front Desk, POS, Housekeeping, Events, Engineering, Security, HR, Procurement
- The Brand Standards module uses you to automatically adapt the entire system when brand guidelines change
- Your analyses trigger code generation, UI updates, and system-wide adaptations

DEPARTMENTS YOU SUPPORT:
1. Front Desk (PMS) - Check-in/out, reservations, guest services
2. Food & Beverage (POS) - Restaurant, bar, room service
3. Housekeeping - Room cleaning, maintenance requests
4. Events - Banquets, conferences, weddings
5. Engineering - Facility maintenance, repairs
6. Security - Access control, surveillance
7. HR - Staff management, scheduling
8. Procurement - Inventory, suppliers

HOW TO HELP USERS:
- When asked about brand standards: Extract specific details (colors, fonts, times, policies)
- When given a document: Analyze it thoroughly and provide structured output
- When asked about impact: Explain how changes affect specific departments
- Be concise but comprehensive
- Always provide actionable insights

RESPONSE FORMAT:
- For color extraction: Provide hex codes (#RRGGBB format)
- For times: Use 24-hour format (14:00, not 2 PM)
- For policies: Be specific and implementation-focused
- For general questions: Relate answers to hotel brand management

USER'S QUESTION:
`);

            // Combine system prompt with user input
            const fullPrompt = systemPrompt + input.trim();

            // Call AI provider with correct configuration
            const response = await aiProvider.executeRequest(fullPrompt, {
                provider: activeProvider as any,
                apiKey: getApiKey(),
                model: modelMap[activeProvider] || 'llama3.2',
            });

            // Check if response contains brand standards
            const hasBrandKeywords = /color|font|check-in|check-out|#[0-9A-Fa-f]{6}/i.test(response.content);
            let brandStandards: BrandStandards | undefined;
            let brandChanges: FileChange[] | undefined;

            if (hasBrandKeywords) {
                try {
                    const preview = await autonomousBrandOrchestrator.previewChanges(response.content);
                    if (preview.standards) {
                        brandStandards = preview.standards;
                        brandChanges = preview.changes;
                    }
                } catch (error) {
                    console.warn('[AI Chat] Brand detection failed:', error);
                }
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.content,
                timestamp: response.timestamp,
                model: response.model,
                tokens: response.usage.total,
                cost: response.usage.cost,
                hasBrandStandards: !!brandStandards,
                brandStandards,
                brandChanges
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${error.message}. Make sure ${activeProvider} is running and configured.`,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear chat
    const handleClear = () => {
        setMessages([]);
    };

    // Copy message
    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    // Open brand preview
    const handleOpenBrandPreview = (msg: Message) => {
        if (msg.brandStandards && msg.brandChanges) {
            setPreviewStandards(msg.brandStandards);
            setPreviewChanges(msg.brandChanges);
            setShowPreview(true);
        }
    };

    // Apply brand standards
    const handleApplyStandards = async () => {
        if (!previewStandards || !previewChanges) return;

        setIsApplying(true);
        try {
            const result = await autonomousBrandOrchestrator.processDocument(
                JSON.stringify(previewStandards),
                true // auto-apply
            );

            if (result.success) {
                setShowPreview(false);
                // Show success toast
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 right-4 z-[10000] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slideDown';
                toast.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="font-medium">Brand standards applied successfully!</span>
                `;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 5000);
            } else {
                alert('Failed to apply brand standards: ' + (result.error || 'Unknown error'));
            }
        } catch (error: any) {
            alert('Error applying brand standards: ' + error.message);
        } finally {
            setIsApplying(false);
        }
    };

    // Provider info
    const providerInfo: Record<string, { name: string; icon: string; color: string }> = {
        ollama: { name: 'Ollama', icon: '🦙', color: 'amber' },
        anthropic: { name: 'Claude', icon: '🧠', color: 'violet' },
        gemini: { name: 'Gemini', icon: '✨', color: 'blue' },
        openai: { name: 'GPT', icon: '🤖', color: 'emerald' }
    };

    const currentProvider = providerInfo[activeProvider] || providerInfo.ollama;

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg">
                        <MessageCircle className="text-violet-400" size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">AI Chat</h3>
                        <p className="text-sm text-zinc-400">
                            Chatting with {currentProvider.icon} {currentProvider.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-zinc-400">Connected</span>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Clear chat"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">{currentProvider.icon}</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Start a conversation with {currentProvider.name}
                        </h3>
                        <p className="text-zinc-400 mb-6">
                            Ask questions, test analysis, or just chat!
                        </p>
                        <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="text-sm text-zinc-300 space-y-2">
                                <p className="font-medium text-white mb-2">Example prompts:</p>
                                <div className="space-y-1 text-left">
                                    <p>• "Extract colors from: Primary #FF6B6B, Accent #4ECDC4"</p>
                                    <p>• "What are typical hotel brand standards?"</p>
                                    <p>• "Explain check-in policies in 3 bullet points"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="flex-shrink-0 w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                                <Bot size={18} className="text-violet-400" />
                            </div>
                        )}

                        <div
                            className={`max-w-[70%] rounded-xl p-4 ${msg.role === 'user'
                                ? 'bg-violet-600 text-white'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-100'
                                }`}
                        >
                            <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                            {/* Brand Standards Button */}
                            {msg.hasBrandStandards && msg.brandStandards && msg.brandChanges && (
                                <button
                                    onClick={() => handleOpenBrandPreview(msg)}
                                    className="mt-3 w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium text-sm"
                                >
                                    <Sparkles size={16} />
                                    Apply Brand Standards
                                </button>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-700/30">
                                <span className="text-xs text-zinc-400">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                                {msg.tokens && (
                                    <span className="text-xs text-zinc-400">
                                        {msg.tokens} tokens
                                    </span>
                                )}
                                {msg.cost !== undefined && (
                                    <span className="text-xs text-emerald-400 font-medium">
                                        ${msg.cost.toFixed(4)}
                                    </span>
                                )}
                                <button
                                    onClick={() => handleCopy(msg.content)}
                                    className="ml-auto text-zinc-500 hover:text-zinc-300 transition"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>

                        {msg.role === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                <User size={18} className="text-emerald-400" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                            <Bot size={18} className="text-violet-400" />
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder={`Message ${currentProvider.name}...`}
                        className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition flex items-center gap-2 font-medium"
                    >
                        {isLoading ? (
                            <>
                                <Zap size={18} className="animate-pulse" />
                                Thinking...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Send
                            </>
                        )}
                    </button>
                </div>

                {/* Quick prompts */}
                {messages.length === 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {[
                            'What can you help me with?',
                            'Explain brand standards',
                            'Extract colors from text'
                        ].map(prompt => (
                            <button
                                key={prompt}
                                onClick={() => setInput(prompt)}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg whitespace-nowrap transition"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Brand Preview Modal */}
            {previewStandards && (
                <BrandPreviewModal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    standards={previewStandards}
                    changes={previewChanges}
                    onApply={handleApplyStandards}
                    isApplying={isApplying}
                />
            )}
        </div>
    );
};

export default AIChat;
