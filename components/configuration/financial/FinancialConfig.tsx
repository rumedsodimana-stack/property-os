import React, { useState } from 'react';
import { CreditCard, DollarSign, Shield, Receipt, Activity, Settings, CheckCircle, RefreshCw, AlertTriangle, Key } from 'lucide-react';

interface FinancialConfigProps {
    onClose?: () => void;
}

const FinancialConfig: React.FC<FinancialConfigProps> = ({ onClose }) => {
    const [stripeKey, setStripeKey] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTED'>('DISCONNECTED');
    const [errorMessage, setErrorMessage] = useState('');
    const [taxRates, setTaxRates] = useState({
        vat: 10,
        cityTax: 5,
        serviceCharge: 0
    });

    const handleConnectStripe = async () => {
        if (!stripeKey) return;

        setIsConnecting(true);
        setErrorMessage('');

        try {
            // Import Firebase Functions dynamically to keep the bundle small
            const { httpsCallable } = await import('firebase/functions');
            const { functions } = await import('../../../services/kernel/firebase');

            const verifyStripeConnection = httpsCallable(functions, 'verifyStripeConnection');

            const result = await verifyStripeConnection({ secretKey: stripeKey });

            if (result.data && (result.data as any).success) {
                setConnectionStatus('CONNECTED');
                setStripeKey(''); // Clear out the raw key from React state immediately
            } else {
                throw new Error("Invalid API Key");
            }
        } catch (error: any) {
            console.error("Stripe Connection Failed:", error);
            setConnectionStatus('DISCONNECTED');
            setErrorMessage(error.message || "Failed to verify Stripe credentials.");
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-8 space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Financial Settings</h1>
                <p className="text-zinc-400 mt-2">Manage payment gateways, tax engines, and financial compliance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Payment Gateway */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Stripe Integration Block */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Payment Processor</h2>
                                    <p className="text-sm text-zinc-400">Powered by Stripe</p>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${connectionStatus === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                {connectionStatus === 'CONNECTED' ? <><CheckCircle size={14} /> LIVE MODE</> : <><AlertTriangle size={14} /> DISCONNECTED</>}
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {connectionStatus === 'DISCONNECTED' ? (
                                <>
                                    <p className="text-zinc-300">
                                        Connect your Stripe account to automatically process guest credit cards, capture pre-authorizations at check-in, and manage refunds directly within Singularity OS.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Stripe Secret Key (sk_live_...)</label>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                                <input
                                                    type="password"
                                                    value={stripeKey}
                                                    onChange={e => setStripeKey(e.target.value)}
                                                    placeholder="Enter your restricted secret key"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white font-mono focus:outline-none focus:border-indigo-500/50 transition"
                                                />
                                            </div>
                                            {errorMessage && (
                                                <p className="text-rose-400 text-sm mt-2 flex items-center gap-1">
                                                    <AlertTriangle size={14} /> {errorMessage}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleConnectStripe}
                                            disabled={!stripeKey || isConnecting}
                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                                        >
                                            {isConnecting ? <RefreshCw className="animate-spin" size={20} /> : 'Verify & Connect Stripe'}
                                        </button>

                                        <p className="text-xs text-zinc-500 flex items-center justify-center gap-1 mt-4">
                                            <Shield size={12} /> Your key is securely verified by the backend Node.js server.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
                                        <Shield className="text-emerald-500 flex-shrink-0 mt-1" size={24} />
                                        <div>
                                            <h3 className="text-lg font-bold text-emerald-400 mb-1">Stripe is Active</h3>
                                            <p className="text-zinc-300 text-sm leading-relaxed">
                                                Your property is successfully connected to Stripe. Singularity OS will now automatically capture funds, hold pre-authorizations, and release incidentals.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                                                <Activity size={16} /> API Health
                                            </div>
                                            <div className="text-xl font-bold text-emerald-400">99.9% Uptime</div>
                                        </div>
                                        <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                                                <Settings size={16} /> Mode
                                            </div>
                                            <div className="text-xl font-bold text-white">Live Production</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setConnectionStatus('DISCONNECTED')}
                                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-rose-400 rounded-xl font-bold transition"
                                    >
                                        Disconnect Gateway
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Tax Engine */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                                <Receipt size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-white">Global Tax Engine</h2>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>Value Added Tax (VAT)</span>
                                    <span className="text-zinc-400">{taxRates.vat}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0" max="25" step="0.5"
                                    value={taxRates.vat}
                                    onChange={(e) => setTaxRates({ ...taxRates, vat: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>City/Tourist Tax (Flat per night)</span>
                                    <span className="text-zinc-400">${taxRates.cityTax}</span>
                                </label>
                                <input
                                    type="range"
                                    min="0" max="20" step="1"
                                    value={taxRates.cityTax}
                                    onChange={(e) => setTaxRates({ ...taxRates, cityTax: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>Service Charge</span>
                                    <span className="text-zinc-400">{taxRates.serviceCharge}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0" max="20" step="1"
                                    value={taxRates.serviceCharge}
                                    onChange={(e) => setTaxRates({ ...taxRates, serviceCharge: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                            </div>
                        </div>

                        <button className="w-full mt-8 py-3 bg-zinc-800 hover:bg-amber-600 text-white rounded-xl font-bold transition">
                            Save Tax Rules
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-20">
                            <DollarSign size={100} />
                        </div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Chart of Accounts</h3>
                        <p className="text-violet-200 text-sm mb-4 relative z-10">Map your transaction codes directly to your ERP general ledger.</p>
                        <button className="bg-white/20 hover:bg-white/30 text-white border border-white/20 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-md transition relative z-10">
                            Open GL Mapper
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialConfig;
