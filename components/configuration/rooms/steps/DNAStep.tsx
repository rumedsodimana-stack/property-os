import React, { useState } from 'react';
import { Plus, Trash2, Users, BedDouble, Info } from 'lucide-react';

interface DNAStepProps {
    isOpen?: boolean;
    data: any[];
    onUpdate: (data: any[]) => void;
}

const DNAStep: React.FC<DNAStepProps> = ({ isOpen = true, data, onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        baseRate: 150,
        maxOccupancy: 2,
        description: '',
        bedConfig: 'King'
    });

    const handleAdd = () => {
        if (!newItem.name) return;
        const updated = [...data, { ...newItem, id: `cat_${Date.now()}` }];
        onUpdate(updated);
        setIsAdding(false);
        setNewItem({ name: '', baseRate: 150, maxOccupancy: 2, description: '', bedConfig: 'King' });
    };

    const removeCategory = (id: string) => {
        onUpdate(data.filter(c => c.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Step 1: Class Blueprint</h2>
                    <p className="text-zinc-500 mt-2 font-medium">Define the core DNA of your room types. What classes of spaces do you offer?</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 font-bold text-sm"
                    >
                        <Plus size={18} /> Add Category
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.map((cat) => (
                    <div key={cat.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] relative group hover:border-zinc-600 transition-all shadow-xl">
                        <button
                            onClick={() => removeCategory(cat.id)}
                            className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-indigo-400 font-black text-xl">
                                {cat.name[0]}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">{cat.name}</h3>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{cat.bedConfig} Configuration</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                                <span className="text-[10px] font-black uppercase text-zinc-600 mb-1 block">Base Nightly Rate</span>
                                <span className="text-xl font-black text-white">${cat.baseRate}</span>
                            </div>
                            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                                <span className="text-[10px] font-black uppercase text-zinc-600 mb-1 block">Max Capacity</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-white">{cat.maxOccupancy}</span>
                                    <Users size={14} className="text-zinc-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isAdding && (
                    <div className="bg-zinc-800/20 border-2 border-dashed border-indigo-500/30 p-8 rounded-[2rem] space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black uppercase text-indigo-400 mb-2">Category Name</label>
                                <input
                                    className="input-field w-full bg-zinc-950 border-zinc-800 focus:border-indigo-500 text-white font-bold"
                                    placeholder="e.g. Deluxe Suite"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-600 mb-2">Base Rate ($)</label>
                                <input
                                    type="number"
                                    className="input-field w-full bg-zinc-950 border-zinc-800 text-white font-bold"
                                    value={newItem.baseRate}
                                    onChange={e => setNewItem({ ...newItem, baseRate: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-zinc-600 mb-2">Capacity</label>
                                <input
                                    type="number"
                                    className="input-field w-full bg-zinc-950 border-zinc-800 text-white font-bold"
                                    value={newItem.maxOccupancy}
                                    onChange={e => setNewItem({ ...newItem, maxOccupancy: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-4">
                            <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-zinc-500 font-bold text-sm">Cancel</button>
                            <button onClick={handleAdd} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm">Save Category</button>
                        </div>
                    </div>
                )}

                {data.length === 0 && !isAdding && (
                    <div className="col-span-2 p-20 border border-dashed border-zinc-800 rounded-[3rem] text-center flex flex-col items-center gap-4 group hover:border-indigo-500/20 transition-all cursor-pointer" onClick={() => setIsAdding(true)}>
                        <div className="p-6 bg-zinc-900 rounded-[2rem] border border-zinc-800 text-zinc-700 group-hover:text-indigo-400 transition-all">
                            <BedDouble size={48} />
                        </div>
                        <p className="text-zinc-600 font-bold">No categories defined yet. Create your first room class.</p>
                    </div>
                )}
            </div>

            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[1.5rem] flex items-center gap-4 text-xs font-medium text-indigo-400/80 leading-relaxed shadow-sm">
                <Info size={18} className="text-indigo-400 flex-shrink-0" />
                These categories act as templates. Every physical room created later will inherit these pricing and capacity rules.
            </div>
        </div>
    );
};

export default DNAStep;
