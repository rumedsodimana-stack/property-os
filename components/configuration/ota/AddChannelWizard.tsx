import React, { useState } from 'react';
import { X, Search, Globe, ChevronRight, Lock, Key, Network, CheckCircle, Activity, Play, Zap, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { otaAdapter } from '../../../services/operations/otaAdapter';
import { channelManager } from '../../../services/operations/channelManager';

interface AddChannelWizardProps {
    onClose: () => void;
    onComplete: (channelId: string) => void;
}

const PROVIDERS = [
    { id: 'booking', name: 'Booking.com', icon: 'https://cdn.worldvectorlogo.com/logos/bookingcom-1.svg', type: 'OAuth', health: 99.9, color: 'from-blue-500/20 to-indigo-500/5' },
    { id: 'expedia', name: 'Expedia', icon: 'https://cdn.worldvectorlogo.com/logos/expedia-2.svg', type: 'API Key', health: 99.5, color: 'from-yellow-500/20 to-amber-500/5' },
    { id: 'airbnb', name: 'Airbnb', icon: 'https://cdn.worldvectorlogo.com/logos/airbnb-2.svg', type: 'OAuth', health: 99.8, color: 'from-rose-500/20 to-pink-500/5' },
    { id: 'agoda', name: 'Agoda', icon: 'https://cdn.worldvectorlogo.com/logos/agoda.svg', type: 'API Key', health: 98.2, color: 'from-cyan-500/20 to-blue-500/5' },
    { id: 'siteminder', name: 'SiteMinder', icon: 'https://cdn.worldvectorlogo.com/logos/siteminder.svg', type: 'Channel Mgr', health: 99.9, color: 'from-emerald-500/20 to-teal-500/5' },
];

const MOCK_MAPPINGS = [
    { pms: 'Double Deluxe (DLX)', ota: 'Deluxe Double Room', confidence: 98 },
    { pms: 'Standard Twin (STW)', ota: 'Twin Room - Standard', confidence: 95 },
    { pms: 'Presidential Suite (PRE)', ota: 'Executive Suite', confidence: 82 },
];

const AddChannelWizard: React.FC<AddChannelWizardProps> = ({ onClose, onComplete }) => {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [selectedProvider, setSelectedProvider] = useState<typeof PROVIDERS[0] | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [isKeyValidating, setIsKeyValidating] = useState(false);
    const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const handleProviderSelect = (provider: typeof PROVIDERS[0]) => {
        setSelectedProvider(provider);
        setStep(2);
    };

    const handleValidateKey = () => {
        setIsKeyValidating(true);
        // Simulate network request
        setTimeout(() => {
            setIsKeyValidating(false);
            setIsKeyValid(apiKey.length > 10);
            if (apiKey.length > 10) {
                setTimeout(() => setStep(3), 800);
            }
        }, 1200);
    };

    const handleSimulate = () => {
        setIsSimulating(true);
        setTimeout(() => {
            setIsSimulating(false);
            setStep(4);
        }, 2500);
    };

    const handleGoLive = async () => {
        if (selectedProvider) {
            setIsSimulating(true); // Re-use this loading state for the Go Live button
            try {
                // Call the true Backend Verification Node.js service
                const { httpsCallable } = await import('firebase/functions');
                const { functions } = await import('../../../services/kernel/firebase');

                const verifyOtaConnection = httpsCallable(functions, 'verifyOtaConnection');

                // Securely hand the credentials to the backend
                const result = await verifyOtaConnection({
                    otaId: selectedProvider.id,
                    otaName: selectedProvider.name,
                    apiKey: apiKey,
                    icon: selectedProvider.icon
                });

                if (result.data && (result.data as any).success) {
                    setIsSimulating(false);
                    onComplete(selectedProvider.id);
                } else {
                    throw new Error("Verification failed.");
                }

            } catch (error: any) {
                console.error("Failed to connect channel:", error);
                setIsSimulating(false);
                setStep(2); // Kick them back to the API Key step
                setIsKeyValid(false);
                alert(`Connection Rejected by Backend: ${error.message || "Invalid API Key"}`);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-violet-900/10">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-900">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Ecosystem Integration</h2>
                            <div className="flex gap-2 mt-1">
                                {[1, 2, 3, 4].map(s => (
                                    <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-violet-500' : s < step ? 'w-4 bg-emerald-500' : 'w-4 bg-zinc-800'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Elements */}
                <div className="flex-1 overflow-y-auto p-8 relative">

                    {/* STEP 1: Provider Selection */}
                    {step === 1 && (
                        <div className="animate-slideUp space-y-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search global channels, OTAs, or Channel Managers..."
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-zinc-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {PROVIDERS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleProviderSelect(p)}
                                        className="group flex flex-col items-center bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-800/50 hover:border-violet-500/30 transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                        <div className="w-16 h-16 bg-white rounded-2xl p-3 mb-4 shadow-lg flex items-center justify-center relative z-10">
                                            <img src={p.icon} alt={p.name} className="w-full h-full object-contain" />
                                        </div>
                                        <h3 className="font-bold text-white mb-2 relative z-10">{p.name}</h3>
                                        <div className="flex gap-2 relative z-10">
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">{p.type}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">{p.health}% Uptime</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Authentication */}
                    {step === 2 && selectedProvider && (
                        <div className="animate-slideUp max-w-xl mx-auto space-y-8 py-8">
                            <div className="text-center space-y-2">
                                <div className="w-20 h-20 bg-white rounded-3xl p-4 mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                    <img src={selectedProvider.icon} alt={selectedProvider.name} className="w-full h-full object-contain" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Connect {selectedProvider.name}</h3>
                                <p className="text-zinc-400 text-sm">Secure handshake initialization.</p>
                            </div>

                            {selectedProvider.type === 'OAuth' ? (
                                <button onClick={() => setStep(3)} className="w-full py-4 bg-[#FF5A5F] hover:bg-[#E31C5F] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-xl shadow-rose-900/20">
                                    <Lock size={20} /> Authorize via {selectedProvider.name}
                                </button>
                            ) : (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Provider API Key</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                            <input
                                                type="password"
                                                value={apiKey}
                                                onChange={e => {
                                                    setApiKey(e.target.value);
                                                    setIsKeyValid(null);
                                                }}
                                                placeholder="pk_live_..."
                                                className={`w-full bg-zinc-950 border rounded-xl py-3 pl-12 pr-4 text-white font-mono text-sm focus:outline-none transition-all ${isKeyValid === true ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] text-emerald-400' :
                                                    isKeyValid === false ? 'border-rose-500/50 text-rose-400' :
                                                        'border-zinc-800 focus:border-violet-500/50'
                                                    }`}
                                            />
                                            {isKeyValid === true && <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />}
                                            {isKeyValid === false && <X className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500" size={16} />}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleValidateKey}
                                        disabled={!apiKey || isKeyValidating}
                                        className="w-full py-3 bg-violet-600 disabled:bg-zinc-800 disabled:text-zinc-600 hover:bg-violet-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                                    >
                                        {isKeyValidating ? <RefreshCw className="animate-spin" size={18} /> : 'Validate & Connect'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: AI Mapping Interface */}
                    {step === 3 && selectedProvider && (
                        <div className="animate-slideUp max-w-3xl mx-auto space-y-8">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <Zap className="text-violet-400" /> AI Autonomous Mapping
                                    </h3>
                                    <p className="text-zinc-400 text-sm mt-1">Singularity AI has analyzed the room inventory and detected high-probability matches.</p>
                                </div>
                                <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded flex gap-2 items-center text-xs font-bold uppercase tracking-widest">
                                    <Activity size={12} /> Auto-Merge
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-8 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <div>Internal (PMS)</div>
                                    <div>External ({selectedProvider.name})</div>
                                </div>

                                {MOCK_MAPPINGS.map((map, i) => (
                                    <div key={i} className="flex items-center gap-4 relative">
                                        {/* Connector Line overlay */}
                                        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-0.5 bg-violet-500/30 z-0"></div>

                                        <div className="w-1/2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative z-10 flex justify-between items-center">
                                            <span className="text-sm font-bold text-zinc-200">{map.pms}</span>
                                        </div>
                                        <div className="w-1/2 bg-zinc-900 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] rounded-xl p-4 relative z-10 flex justify-between items-center group cursor-pointer hover:bg-zinc-800">
                                            <span className="text-sm font-bold text-white">{map.ota}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${map.confidence > 90 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                {map.confidence}% Match
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t border-zinc-900">
                                <button onClick={() => setStep(4)} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition">Manual Map</button>
                                <button onClick={() => handleSimulate()} className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-violet-900/20">
                                    {isSimulating ? <RefreshCw className="animate-spin" size={18} /> : <>Approve All & Simulate <ArrowRight size={18} /></>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Review & Go Live */}
                    {step === 4 && selectedProvider && (
                        <div className="animate-slideUp max-w-xl mx-auto text-center space-y-8 py-8">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                                <CheckCircle size={48} />
                            </div>

                            <div>
                                <h3 className="text-3xl font-light text-white mb-2">Simulation Successful</h3>
                                <p className="text-zinc-400">Successfully pushed rate boundaries and pulled 1 mock reservation via the {selectedProvider.name} sandbox endpoint. Latency: 112ms.</p>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between text-left">
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Status</div>
                                    <div className="text-sm font-bold text-zinc-300">Ready for Live Traffic</div>
                                </div>
                                <button onClick={handleGoLive} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl font-bold text-lg flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition transform hover:scale-105">
                                    <Network size={22} /> Go Live
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AddChannelWizard;
