import React, { useState } from 'react';
import { Plus, Trash2, Utensils, Wine, Coffee, ShoppingBag, Waves, Clock, Percent, ChefHat, Palette } from 'lucide-react';

export interface OnboardingOutlet {
    id: string;
    name: string;
    type: 'Restaurant' | 'Bar' | 'RoomService' | 'Retail' | 'PoolBar';
    description: string;
    operatingHours: { open: string; close: string };
    taxRate: number;
    gratuityRate: number;
    kdsEnabled: boolean;
    color: string;
    seatingCapacity: number;
}

interface CostCenterStepProps {
    outlets: OnboardingOutlet[];
    onUpdate: (outlets: OnboardingOutlet[]) => void;
}

const OUTLET_TYPES = [
    { id: 'Restaurant', label: 'Restaurant', icon: Utensils, color: '#f97316', defaults: { gratuityRate: 15, kdsEnabled: true, seatingCapacity: 60 } },
    { id: 'Bar', label: 'Bar', icon: Wine, color: '#ec4899', defaults: { gratuityRate: 18, kdsEnabled: false, seatingCapacity: 30 } },
    { id: 'RoomService', label: 'Room Service', icon: Coffee, color: '#8b5cf6', defaults: { gratuityRate: 0, kdsEnabled: true, seatingCapacity: 0 } },
    { id: 'Retail', label: 'Retail', icon: ShoppingBag, color: '#06b6d4', defaults: { gratuityRate: 0, kdsEnabled: false, seatingCapacity: 0 } },
    { id: 'PoolBar', label: 'Pool Bar', icon: Waves, color: '#10b981', defaults: { gratuityRate: 15, kdsEnabled: false, seatingCapacity: 20 } },
] as const;

const ACCENT_COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const defaultOutlet = (): Partial<OnboardingOutlet> => ({
    name: '',
    type: 'Restaurant',
    description: '',
    operatingHours: { open: '07:00', close: '23:00' },
    taxRate: 10,
    gratuityRate: 15,
    kdsEnabled: true,
    color: '#f97316',
    seatingCapacity: 60,
});

const CostCenterStep: React.FC<CostCenterStepProps> = ({ outlets, onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newOutlet, setNewOutlet] = useState<Partial<OnboardingOutlet>>(defaultOutlet());

    const handleTypeSelect = (type: OnboardingOutlet['type']) => {
        const typeConfig = OUTLET_TYPES.find(t => t.id === type);
        if (!typeConfig) return;
        setNewOutlet(prev => ({
            ...prev,
            type,
            color: typeConfig.color,
            ...typeConfig.defaults,
        }));
    };

    const handleAdd = () => {
        if (!newOutlet.name?.trim()) return;
        const outlet: OnboardingOutlet = {
            id: `outlet_${Date.now()}`,
            name: newOutlet.name!,
            type: newOutlet.type || 'Restaurant',
            description: newOutlet.description || '',
            operatingHours: newOutlet.operatingHours || { open: '07:00', close: '23:00' },
            taxRate: newOutlet.taxRate ?? 10,
            gratuityRate: newOutlet.gratuityRate ?? 15,
            kdsEnabled: newOutlet.kdsEnabled ?? true,
            color: newOutlet.color || '#f97316',
            seatingCapacity: newOutlet.seatingCapacity ?? 0,
        };
        onUpdate([...outlets, outlet]);
        setNewOutlet(defaultOutlet());
        setIsAdding(false);
    };

    const handleRemove = (id: string) => {
        onUpdate(outlets.filter(o => o.id !== id));
    };

    const getTypeConfig = (type: string) => OUTLET_TYPES.find(t => t.id === type);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-light text-white mb-1">Cost Center Registry</h3>
                <p className="text-sm text-zinc-500">Define each revenue-generating outlet at your property. These become the operational cost centers for your POS.</p>
            </div>

            {/* Existing Outlets */}
            {outlets.length > 0 && (
                <div className="space-y-3">
                    {outlets.map(outlet => {
                        const typeConfig = getTypeConfig(outlet.type);
                        const Icon = typeConfig?.icon || Utensils;
                        return (
                            <div key={outlet.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${outlet.color}20`, border: `1px solid ${outlet.color}40` }}>
                                    <Icon size={20} style={{ color: outlet.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-semibold text-white">{outlet.name}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: `${outlet.color}20`, color: outlet.color }}>
                                            {outlet.type}
                                        </span>
                                        {outlet.kdsEnabled && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase">KDS</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1"><Clock size={10} /> {outlet.operatingHours.open} – {outlet.operatingHours.close}</span>
                                        <span className="flex items-center gap-1"><Percent size={10} /> Tax {outlet.taxRate}%</span>
                                        {outlet.gratuityRate > 0 && <span>Gratuity {outlet.gratuityRate}%</span>}
                                        {outlet.seatingCapacity > 0 && <span>{outlet.seatingCapacity} covers</span>}
                                    </div>
                                </div>
                                <button onClick={() => handleRemove(outlet.id)} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Form */}
            {isAdding ? (
                <div className="bg-zinc-900/40 border border-violet-500/30 rounded-2xl p-6 space-y-5">
                    <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">New Cost Center</h4>

                    {/* Type Selector */}
                    <div>
                        <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-3 block">Outlet Type</label>
                        <div className="grid grid-cols-5 gap-2">
                            {OUTLET_TYPES.map(t => {
                                const Icon = t.icon;
                                const isSelected = newOutlet.type === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => handleTypeSelect(t.id as OnboardingOutlet['type'])}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isSelected ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
                                    >
                                        <Icon size={18} style={{ color: isSelected ? t.color : '#71717a' }} />
                                        <span className="text-[10px] font-bold uppercase" style={{ color: isSelected ? t.color : '#71717a' }}>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Name & Description */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Outlet Name *</label>
                            <input
                                type="text"
                                value={newOutlet.name || ''}
                                onChange={e => setNewOutlet(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. The Grand Dining"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 focus:ring-0 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Description</label>
                            <input
                                type="text"
                                value={newOutlet.description || ''}
                                onChange={e => setNewOutlet(p => ({ ...p, description: e.target.value }))}
                                placeholder="Short tagline..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 focus:ring-0 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Opens</label>
                            <input
                                type="time"
                                value={newOutlet.operatingHours?.open || '07:00'}
                                onChange={e => setNewOutlet(p => ({ ...p, operatingHours: { ...p.operatingHours!, open: e.target.value } }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 focus:ring-0 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Closes</label>
                            <input
                                type="time"
                                value={newOutlet.operatingHours?.close || '23:00'}
                                onChange={e => setNewOutlet(p => ({ ...p, operatingHours: { ...p.operatingHours!, close: e.target.value } }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 focus:ring-0 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Tax Rate %</label>
                            <input
                                type="number"
                                min={0} max={30} step={0.5}
                                value={newOutlet.taxRate ?? 10}
                                onChange={e => setNewOutlet(p => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 focus:ring-0 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Gratuity %</label>
                            <input
                                type="number"
                                min={0} max={30} step={0.5}
                                value={newOutlet.gratuityRate ?? 0}
                                onChange={e => setNewOutlet(p => ({ ...p, gratuityRate: parseFloat(e.target.value) || 0 }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 focus:ring-0 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* KDS + Color + Capacity */}
                    <div className="grid grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block">Seating Capacity</label>
                            <input
                                type="number"
                                min={0}
                                value={newOutlet.seatingCapacity ?? 0}
                                onChange={e => setNewOutlet(p => ({ ...p, seatingCapacity: parseInt(e.target.value) || 0 }))}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 focus:ring-0 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block flex items-center gap-2">
                                <Palette size={12} /> Accent Color
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {ACCENT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewOutlet(p => ({ ...p, color: c }))}
                                        className={`w-7 h-7 rounded-full transition-all ${newOutlet.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110' : 'opacity-70 hover:opacity-100'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2 block flex items-center gap-2">
                                <ChefHat size={12} /> Kitchen Display
                            </label>
                            <button
                                onClick={() => setNewOutlet(p => ({ ...p, kdsEnabled: !p.kdsEnabled }))}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all w-full ${newOutlet.kdsEnabled ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newOutlet.kdsEnabled ? 'border-emerald-400 bg-emerald-400' : 'border-zinc-600'}`}>
                                    {newOutlet.kdsEnabled && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <span className="text-sm font-bold">{newOutlet.kdsEnabled ? 'Enabled' : 'Disabled'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => { setIsAdding(false); setNewOutlet(defaultOutlet()); }}
                            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!newOutlet.name?.trim()}
                            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition"
                        >
                            Add Cost Center
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/5 rounded-2xl text-zinc-500 hover:text-violet-400 transition-all group"
                >
                    <Plus size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-wider">Add Outlet / Cost Center</span>
                </button>
            )}

            {outlets.length === 0 && !isAdding && (
                <div className="text-center py-8 text-zinc-600 text-sm">
                    No cost centers defined yet. Add at least one outlet to continue.
                </div>
            )}
        </div>
    );
};

export default CostCenterStep;
