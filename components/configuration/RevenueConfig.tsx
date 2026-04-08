import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, FileText, Percent, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { RatePlan } from '../../types';
import { ratePlanService } from '../../services/operations/ratePlanService';

const RevenueConfig: React.FC = () => {
    const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<RatePlan | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const unsubscribe = ratePlanService.subscribe(setRatePlans);
        return () => unsubscribe();
    }, []);

    const handleCreateNew = () => {
        setIsEditing(true);
        setSelectedPlan({
            id: `rp_${Date.now()}`,
            code: 'NEW_RATE',
            name: 'New Rate Plan',
            description: '',
            baseRateAmount: 0,
            currency: 'BHD',
            type: 'Base',
            inclusions: [],
            cancellationPolicy: 'Flexible 24h',
            guaranteeType: 'Credit Card',
            isActive: true
        });
    };

    const handleSave = async () => {
        if (selectedPlan) {
            await ratePlanService.saveRatePlan(selectedPlan);
            setIsEditing(false);
            setSelectedPlan(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this Rate Plan?')) {
            await ratePlanService.deleteRatePlan(id);
            if (selectedPlan?.id === id) {
                setSelectedPlan(null);
                setIsEditing(false);
            }
        }
    };

    return (
        <div className="flex h-full gap-6 animate-fadeIn">
            {/* List Panel */}
            <div className="w-1/3 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col hidden-scrollbar">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-bold text-zinc-100">Rate Plans & Packages</h2>
                        <div className="text-[10px] text-zinc-500">{ratePlans.length} active plans</div>
                    </div>
                    <button onClick={handleCreateNew} className="p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition">
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {ratePlans.map(plan => (
                        <div
                            key={plan.id}
                            onClick={() => { setSelectedPlan(plan); setIsEditing(false); }}
                            className={`p-4 rounded-xl border cursor-pointer transition ${selectedPlan?.id === plan.id ? 'bg-violet-500/10 border-violet-500/30' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${plan.type === 'Base' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {plan.code}
                                        </span>
                                        <h3 className={`text-sm font-semibold truncate w-40 ${selectedPlan?.id === plan.id ? 'text-violet-300' : 'text-zinc-200'}`}>{plan.name}</h3>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 mt-1">{plan.type} Rate</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-emerald-400">
                                        {plan.type === 'Base' ? `${plan.currency} ${plan.baseRateAmount}` : 'Dynamic'}
                                    </div>
                                    {plan.type === 'Derived' && (
                                        <div className="text-[10px] text-amber-500 flex items-center gap-1 justify-end">
                                            <Percent size={10} /> {plan.derivedAdjustmentValue}% off {ratePlans.find(r => r.id === plan.derivedFromId)?.code}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {(plan.inclusions || []).length > 0 && (
                                <div className="flex gap-1 mt-3 flex-wrap">
                                    {(plan.inclusions || []).map(inc => (
                                        <span key={inc.id} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] rounded uppercase font-bold tracking-wider">
                                            + {inc.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Panel */}
            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col relative overflow-hidden hidden-scrollbar">
                {selectedPlan ? (
                    <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{isEditing ? 'Edit Rate Plan' : selectedPlan.name}</h2>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{selectedPlan.code}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition font-medium text-sm">
                                        <Save size={16} /> Save Changes
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(true)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(selectedPlan.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            {/* General Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">General Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1.5">Rate Code</label>
                                        <input
                                            type="text"
                                            value={selectedPlan.code}
                                            onChange={e => setSelectedPlan({ ...selectedPlan, code: e.target.value.toUpperCase() })}
                                            disabled={!isEditing}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1.5">Rate Name</label>
                                        <input
                                            type="text"
                                            value={selectedPlan.name}
                                            onChange={e => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                                            disabled={!isEditing}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1.5">Description (Guest Facing)</label>
                                        <textarea
                                            value={selectedPlan.description}
                                            onChange={e => setSelectedPlan({ ...selectedPlan, description: e.target.value })}
                                            disabled={!isEditing}
                                            rows={2}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Strategy */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Pricing Strategy</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1.5">Rate Type</label>
                                        <select
                                            value={selectedPlan.type}
                                            onChange={e => setSelectedPlan({ ...selectedPlan, type: e.target.value as 'Base' | 'Derived' })}
                                            disabled={!isEditing}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50"
                                        >
                                            <option value="Base">Base Rate</option>
                                            <option value="Derived">Derived Rate</option>
                                        </select>
                                    </div>

                                    {selectedPlan.type === 'Base' ? (
                                        <div>
                                            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1.5">Flat Amount ({selectedPlan.currency})</label>
                                            <input
                                                type="number"
                                                value={selectedPlan.baseRateAmount}
                                                onChange={e => setSelectedPlan({ ...selectedPlan, baseRateAmount: Number(e.target.value) })}
                                                disabled={!isEditing}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1.5">Derive From</label>
                                                <select
                                                    value={selectedPlan.derivedFromId || ''}
                                                    onChange={e => setSelectedPlan({ ...selectedPlan, derivedFromId: e.target.value })}
                                                    disabled={!isEditing}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50"
                                                >
                                                    <option value="">Select Base Rate...</option>
                                                    {ratePlans.filter(rp => rp.type === 'Base' && rp.id !== selectedPlan.id).map(rp => (
                                                        <option key={rp.id} value={rp.id}>{rp.code} - {rp.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1.5">Adjustment (% or Flat)</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={selectedPlan.derivedAdjustmentValue || 0}
                                                        onChange={e => setSelectedPlan({ ...selectedPlan, derivedAdjustmentValue: Number(e.target.value) })}
                                                        disabled={!isEditing}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-16 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50"
                                                    />
                                                    <select
                                                        value={selectedPlan.derivedAdjustmentType || 'Percentage'}
                                                        onChange={e => setSelectedPlan({ ...selectedPlan, derivedAdjustmentType: e.target.value as 'Percentage' | 'Flat' })}
                                                        disabled={!isEditing}
                                                        className="absolute right-1 top-1 bottom-1 bg-zinc-900 border-none rounded-r-md px-2 text-xs text-zinc-400 focus:outline-none disabled:opacity-50"
                                                    >
                                                        <option value="Percentage">%</option>
                                                        <option value="Flat">{selectedPlan.currency}</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {selectedPlan.type === 'Derived' && (
                                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                        <div className="text-xs leading-relaxed">
                                            <strong>Dynamic Pricing:</strong> This rate will float automatically based on changes to the base rate ({selectedPlan.derivedFromId ? ratePlans.find(r => r.id === selectedPlan.derivedFromId)?.code : 'None selected'}).
                                            Currently calculated as Base + {selectedPlan.derivedAdjustmentValue}{selectedPlan.derivedAdjustmentType === 'Percentage' ? '%' : ' flat'}.
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Policies */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Policies & Guarantee</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1.5">Cancellation Policy</label>
                                        <select
                                            value={selectedPlan.cancellationPolicy}
                                            onChange={e => setSelectedPlan({ ...selectedPlan, cancellationPolicy: e.target.value as any })}
                                            disabled={!isEditing}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50"
                                        >
                                            <option value="Non-Refundable">Non-Refundable (100% Penalty)</option>
                                            <option value="Flexible 24h">Flexible (Cancel 24h before)</option>
                                            <option value="Flexible 48h">Flexible (Cancel 48h before)</option>
                                            <option value="Flexible 6pm">Flexible (Cancel by 6PM Day-of)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1.5">Required Guarantee</label>
                                        <select
                                            value={selectedPlan.guaranteeType}
                                            onChange={e => setSelectedPlan({ ...selectedPlan, guaranteeType: e.target.value as any })}
                                            disabled={!isEditing}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50"
                                        >
                                            <option value="None">None (4PM Hold)</option>
                                            <option value="Credit Card">Credit Card Guarantee</option>
                                            <option value="Deposit">Full Deposit Required</option>
                                            <option value="Company">Direct Bill / Company Approved</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck size={32} className="text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-300 mb-2">Select a Rate Plan</h3>
                        <p className="text-sm max-w-sm leading-relaxed">Choose a rate plan from the list to view its configuration, or create a new complex pricing strategy.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueConfig;
