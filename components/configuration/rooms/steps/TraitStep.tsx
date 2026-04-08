import React, { useState } from 'react';
import { Plus, Trash2, Tag, DollarSign, Info } from 'lucide-react';

interface TraitStepProps {
    isOpen?: boolean;
    data: any[];
    onUpdate: (data: any[]) => void;
}

const TraitStep: React.FC<TraitStepProps> = ({ isOpen = true, data, onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        priceModifier: 25,
        type: 'View', // View, Bed, Location, Feature
    });

    const handleAdd = () => {
        if (!newItem.name) return;
        const updated = [...data, { ...newItem, id: `trait_${Date.now()}` }];
        onUpdate(updated);
        setIsAdding(false);
        setNewItem({ name: '', priceModifier: 25, type: 'View' });
    };

    const removeTrait = (id: string) => {
        onUpdate(data.filter(t => t.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Step 2: Trait Library</h2>
                    <p className="text-zinc-500 mt-2 font-medium">Define premium modifiers. What makes some rooms worth more than the base rate?</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 font-bold text-sm"
                    >
                        <Plus size={18} /> Add Trait
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((trait) => (
                    <div key={trait.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] relative group hover:border-zinc-600 transition-all shadow-xl">
                        <button
                            onClick={() => removeTrait(trait.id)}
                            className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-indigo-400">
                                <Tag size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-tight">{trait.name}</h3>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{trait.type}</p>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-zinc-600">Price Modifier</span>
                            <span className="text-lg font-black text-emerald-400">+${trait.priceModifier}</span>
                        </div>
                    </div>
                ))}

                {isAdding && (
                    <div className="bg-zinc-800/20 border-2 border-dashed border-indigo-500/30 p-8 rounded-[2rem] space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-indigo-400 mb-2">Trait Name</label>
                                <input
                                    className="input-field w-full bg-zinc-950 border-zinc-800 focus:border-indigo-500 text-white font-bold"
                                    placeholder="e.g. Ocean View"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-600 mb-2">Price Delta ($)</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-3 top-3 text-zinc-500" />
                                        <input
                                            type="number"
                                            className="input-field w-full pl-8 bg-zinc-950 border-zinc-800 text-white font-bold"
                                            value={newItem.priceModifier}
                                            onChange={e => setNewItem({ ...newItem, priceModifier: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-zinc-600 mb-2">Type</label>
                                    <select
                                        className="input-field w-full bg-zinc-950 border-zinc-800 text-white font-bold"
                                        value={newItem.type}
                                        onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                    >
                                        <option value="View">View</option>
                                        <option value="Bed">Bed</option>
                                        <option value="Location">Location</option>
                                        <option value="Feature">Feature</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-4">
                            <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-zinc-500 font-bold text-sm">Cancel</button>
                            <button onClick={handleAdd} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm">Save Trait</button>
                        </div>
                    </div>
                )}

                {data.length === 0 && !isAdding && (
                    <div className="col-span-3 p-20 border border-dashed border-zinc-800 rounded-[3rem] text-center flex flex-col items-center gap-4 group hover:border-indigo-500/20 transition-all cursor-pointer" onClick={() => setIsAdding(true)}>
                        <div className="p-6 bg-zinc-900 rounded-[2rem] border border-zinc-800 text-zinc-700 group-hover:text-amber-400 transition-all">
                            <Tag size={48} />
                        </div>
                        <p className="text-zinc-600 font-bold">No traits defined. Attributes allow you to upsell specific rooms.</p>
                    </div>
                )}
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[1.5rem] flex items-center gap-4 text-xs font-medium text-amber-400/80 leading-relaxed shadow-sm">
                <Info size={18} className="text-amber-400 flex-shrink-0" />
                Price Modifiers are added on top of the Category Base Rate. For example, a Deluxe Category ($200) + Ocean View ($50) = $250.
            </div>
        </div>
    );
};

export default TraitStep;
