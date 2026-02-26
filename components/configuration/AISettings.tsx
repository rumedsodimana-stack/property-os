import React, { useState, useEffect } from 'react';
import {
    Settings, Zap, DollarSign, TrendingUp, Key,
    Check, AlertCircle, Wifi, WifiOff, CreditCard,
    Package, ArrowRight, Info, Shield, Download, MessageCircle
} from 'lucide-react';
import { aiProvider } from '../../services/intelligence/aiProvider';
import AIChat from '../modules/AIChat';

interface APIKey {
    provider: 'openai' | 'gemini' | 'anthropic' | 'ollama';
    key: string;
    masked: string;
    status: 'active' | 'invalid' | 'expired';
    addedAt: string;
}

interface UsageStats {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageTokensPerRequest: number;
}

interface PricingPackage {
    id: string;
    provider: 'openai' | 'anthropic';
    name: string;
    credits: number;
    price: number;
    savingsPercent?: number;
    popular?: boolean;
}

const AISettings: React.FC = () => {
    const [activeProvider, setActiveProvider] = useState<'openai' | 'gemini' | 'anthropic' | 'ollama'>('ollama');
    const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
    const [showAddKey, setShowAddKey] = useState(false);
    const [newKeyProvider, setNewKeyProvider] = useState<'openai' | 'gemini' | 'anthropic'>('anthropic');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
    const [activeTab, setActiveTab] = useState<'settings' | 'usage' | 'packages' | 'chat'>('chat');

    // Pricing packages
    const packages: PricingPackage[] = [
        {
            id: 'openai-starter',
            provider: 'openai',
            name: 'OpenAI Starter',
            credits: 100,
            price: 15,
        },
        {
            id: 'openai-pro',
            provider: 'openai',
            name: 'OpenAI Pro',
            credits: 500,
            price: 60,
            savingsPercent: 20,
            popular: true
        },
        {
            id: 'claude-starter',
            provider: 'anthropic',
            name: 'Claude Starter',
            credits: 100,
            price: 5,
        },
        {
            id: 'claude-pro',
            provider: 'anthropic',
            name: 'Claude Pro',
            credits: 1000,
            price: 40,
            savingsPercent: 20,
            popular: true
        },
    ];

    // Load settings from localStorage or environment
    useEffect(() => {
        const envProvider = import.meta.env.VITE_AI_PROVIDER as any;
        const savedProvider = localStorage.getItem('ai_provider') as any;

        if (envProvider) {
            setActiveProvider(envProvider);
        } else if (savedProvider) {
            setActiveProvider(savedProvider);
        }

        const savedKeys = localStorage.getItem('api_keys');
        if (savedKeys) {
            setApiKeys(JSON.parse(savedKeys));
        }

        // Get usage stats
        const stats = aiProvider.getUsageStats();
        setUsageStats(stats);
    }, []);

    // Save provider selection
    const handleProviderChange = (provider: 'openai' | 'gemini' | 'anthropic' | 'ollama') => {
        setActiveProvider(provider);
        localStorage.setItem('ai_provider', provider);

        // In production, this would trigger environment variable update
        console.log(`[AI Config] Provider changed to: ${provider}`);
    };

    // Add API key
    const handleAddKey = () => {
        if (!newKeyValue.trim()) return;

        const newKey: APIKey = {
            provider: newKeyProvider,
            key: newKeyValue,
            masked: maskKey(newKeyValue),
            status: 'active',
            addedAt: new Date().toISOString()
        };

        const updatedKeys = [...apiKeys.filter(k => k.provider !== newKeyProvider), newKey];
        setApiKeys(updatedKeys);
        localStorage.setItem('api_keys', JSON.stringify(updatedKeys));

        // In production, securely store in backend
        console.log(`[AI Config] Added ${newKeyProvider} API key`);

        setShowAddKey(false);
        setNewKeyValue('');
    };

    // Mask API key for display
    const maskKey = (key: string): string => {
        if (key.length < 12) return '***';
        return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    };

    // Remove API key
    const handleRemoveKey = (provider: string) => {
        const updatedKeys = apiKeys.filter(k => k.provider !== provider);
        setApiKeys(updatedKeys);
        localStorage.setItem('api_keys', JSON.stringify(updatedKeys));
    };

    // Provider info
    const providerInfo = {
        openai: {
            name: 'OpenAI',
            models: 'GPT-4, GPT-3.5',
            costPerAnalysis: '$0.10 - $0.20',
            quality: 5,
            speed: 4,
            icon: '🤖',
            color: 'emerald'
        },
        anthropic: {
            name: 'Anthropic Claude',
            models: 'Claude Sonnet 4.6, Opus 4.6',
            costPerAnalysis: '$0.02 - $0.05',
            quality: 5,
            speed: 5,
            icon: '🧠',
            color: 'violet'
        },
        gemini: {
            name: 'Google Gemini',
            models: 'Gemini Pro',
            costPerAnalysis: 'Free (rate limited)',
            quality: 4,
            speed: 3,
            icon: '✨',
            color: 'blue'
        },
        ollama: {
            name: 'Ollama (Local)',
            models: 'Llama, Mistral, etc.',
            costPerAnalysis: '$0 (FREE)',
            quality: 4,
            speed: 5,
            icon: '🦙',
            color: 'amber'
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-lg">
                        <Settings className="text-violet-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">AI Configuration</h1>
                        <p className="text-sm text-zinc-400 mt-0.5">Manage AI providers, API keys, and usage</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-green-400 font-medium">Connected</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-4 border-b border-zinc-800">
                {[
                    { id: 'chat', label: 'AI Chat', icon: MessageCircle },
                    { id: 'settings', label: 'Provider Settings', icon: Settings },
                    { id: 'usage', label: 'Usage & Costs', icon: TrendingUp },
                    { id: 'packages', label: 'Buy Credits', icon: Package }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 font-medium transition relative ${activeTab === tab.id
                            ? 'text-violet-400'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="-m-6 h-full">
                        <AIChat />
                    </div>
                )}

                {/* Provider Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        {/* Current Provider */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Zap size={20} className="text-violet-400" />
                                Active AI Provider
                            </h3>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(providerInfo).map(([key, info]) => {
                                    const isActive = activeProvider === key;
                                    const colorClasses = {
                                        emerald: 'border-emerald-500/30 bg-emerald-500/5',
                                        violet: 'border-violet-500/30 bg-violet-500/5',
                                        blue: 'border-blue-500/30 bg-blue-500/5',
                                        amber: 'border-amber-500/30 bg-amber-500/5'
                                    };

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handleProviderChange(key as any)}
                                            className={`p-4 border-2 rounded-xl transition ${isActive
                                                ? colorClasses[info.color as keyof typeof colorClasses]
                                                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="text-3xl">{info.icon}</div>
                                                {isActive && <Check size={20} className="text-green-400" />}
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-white mb-1">{info.name}</div>
                                                <div className="text-xs text-zinc-400 mb-2">{info.models}</div>
                                                <div className="text-sm font-medium text-zinc-300">{info.costPerAnalysis}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* API Keys */}
                        {activeProvider !== 'ollama' && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Key size={20} className="text-violet-400" />
                                        API Keys
                                    </h3>
                                    <button
                                        onClick={() => setShowAddKey(true)}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition flex items-center gap-2"
                                    >
                                        <Key size={18} />
                                        Add API Key
                                    </button>
                                </div>

                                {/* Existing Keys */}
                                <div className="space-y-3">
                                    {apiKeys.map(key => (
                                        <div key={key.provider} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="text-2xl">{providerInfo[key.provider].icon}</div>
                                                <div>
                                                    <div className="font-medium text-white">{providerInfo[key.provider].name}</div>
                                                    <div className="text-sm text-zinc-400 font-mono">{key.masked}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400 font-medium">
                                                    Active
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveKey(key.provider)}
                                                    className="text-red-400 hover:text-red-300 transition"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {apiKeys.length === 0 && (
                                        <div className="text-center py-8 text-zinc-500">
                                            <Key size={40} className="mx-auto mb-3 opacity-30" />
                                            <p>No API keys configured</p>
                                            <p className="text-sm mt-1">Add a key to start using cloud AI providers</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Key Modal */}
                                {showAddKey && (
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
                                            <h3 className="text-lg font-semibold text-white mb-4">Add API Key</h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm text-zinc-400 mb-2 block">Provider</label>
                                                    <select
                                                        value={newKeyProvider}
                                                        onChange={(e) => setNewKeyProvider(e.target.value as any)}
                                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                                    >
                                                        <option value="openai">OpenAI</option>
                                                        <option value="anthropic">Anthropic Claude</option>
                                                        <option value="gemini">Google Gemini</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-sm text-zinc-400 mb-2 block">API Key</label>
                                                    <input
                                                        type="password"
                                                        value={newKeyValue}
                                                        onChange={(e) => setNewKeyValue(e.target.value)}
                                                        placeholder="sk-..."
                                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                                                    />
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setShowAddKey(false)}
                                                        className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleAddKey}
                                                        className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition"
                                                    >
                                                        Add Key
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ollama Setup */}
                        {activeProvider === 'ollama' && (
                            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-amber-500/20 rounded-lg">
                                        <Download size={24} className="text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                            🦙 Ollama - Free Local AI
                                        </h3>
                                        <p className="text-zinc-300 mb-4">
                                            Run AI completely free on your Mac. No API keys, no costs, 100% private.
                                        </p>
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-amber-400">$0</div>
                                                <div className="text-xs text-zinc-400">Per Analysis</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-amber-400">100%</div>
                                                <div className="text-xs text-zinc-400">Private</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-amber-400">Offline</div>
                                                <div className="text-xs text-zinc-400">Works</div>
                                            </div>
                                        </div>
                                        <a
                                            href="https://ollama.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                                        >
                                            <Download size={18} />
                                            Install Ollama
                                            <ArrowRight size={18} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Usage Tab */}
                {activeTab === 'usage' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <div className="text-sm text-zinc-400 mb-2">Total Requests</div>
                                <div className="text-3xl font-bold text-white">{usageStats?.totalRequests || 0}</div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <div className="text-sm text-zinc-400 mb-2">Total Tokens</div>
                                <div className="text-3xl font-bold text-white">{(usageStats?.totalTokens || 0).toLocaleString()}</div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <div className="text-sm text-zinc-400 mb-2">Total Cost</div>
                                <div className="text-3xl font-bold text-emerald-400">
                                    ${(usageStats?.totalCost || 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <div className="text-sm text-zinc-400 mb-2">Avg Tokens/Request</div>
                                <div className="text-3xl font-bold text-white">
                                    {Math.round(usageStats?.averageTokensPerRequest || 0)}
                                </div>
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <DollarSign size={20} className="text-emerald-400" />
                                Cost Analysis
                            </h3>

                            {activeProvider === 'ollama' ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <div className="text-2xl font-bold text-emerald-400 mb-2">Completely FREE!</div>
                                    <p className="text-zinc-400">
                                        Ollama runs locally - no API costs ever
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">{providerInfo[activeProvider].icon}</div>
                                            <div>
                                                <div className="font-medium text-white">{providerInfo[activeProvider].name}</div>
                                                <div className="text-sm text-zinc-400">Current provider</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">
                                                ${(usageStats?.totalCost || 0).toFixed(2)}
                                            </div>
                                            <div className="text-sm text-zinc-400">This month</div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-start gap-3">
                                        <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-zinc-300">
                                            <strong className="text-white">Tip:</strong> Switch to Ollama for completely free AI,
                                            or use Claude 3.5 for 70% cost savings vs GPT-4.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Packages Tab */}
                {activeTab === 'packages' && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Buy AI Credits</h2>
                            <p className="text-zinc-400">Pre-purchase credits for discounted rates</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {packages.map(pkg => (
                                <div
                                    key={pkg.id}
                                    className={`relative bg-zinc-900 border rounded-xl p-6 ${pkg.popular
                                        ? 'border-violet-500/50 shadow-lg shadow-violet-500/20'
                                        : 'border-zinc-800'
                                        }`}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-600 rounded-full text-xs font-semibold text-white">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <div className="text-4xl mb-3">{providerInfo[pkg.provider].icon}</div>
                                        <h3 className="text-xl font-semibold text-white mb-2">{pkg.name}</h3>
                                        <div className="text-3xl font-bold text-white mb-1">
                                            ${pkg.price}
                                        </div>
                                        <div className="text-zinc-400">{pkg.credits} analyses</div>
                                        {pkg.savingsPercent && (
                                            <div className="mt-2 text-sm text-emerald-400 font-medium">
                                                Save {pkg.savingsPercent}%
                                            </div>
                                        )}
                                    </div>

                                    <button className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium">
                                        <CreditCard size={18} />
                                        Purchase Package
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                            <div className="flex items-start gap-4">
                                <Shield size={24} className="text-violet-400 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Secure Payment</h4>
                                    <p className="text-sm text-zinc-400">
                                        All payments processed securely via Stripe. Credits never expire.
                                        Unused credits automatically roll over to next month.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AISettings;
