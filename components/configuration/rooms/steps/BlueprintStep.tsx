import React, { useState } from 'react';
import { Plus, Trash2, Map, Layers, Hash, Info } from 'lucide-react';
import { OnboardingData } from '../PropertyOnboardingEngine';

interface BlueprintStepProps {
    isOpen?: boolean;
    data: OnboardingData;
    onUpdate: (key: string, data: any) => void;
}

const BlueprintStep: React.FC<BlueprintStepProps> = ({ isOpen = true, data, onUpdate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newFloor, setNewFloor] = useState({
        name: '',
        roomCount: 10,
        startNumber: 101,
        categoryId: data.categories[0]?.id || ''
    });

    React.useEffect(() => {
        if (!newFloor.categoryId && data.categories.length > 0) {
            setNewFloor(prev => ({ ...prev, categoryId: data.categories[0].id }));
        }
    }, [data.categories, newFloor.categoryId]);

    const handleAdd = () => {
        if (!newFloor.name || !newFloor.categoryId) return;

        // Generate rooms for this floor
        const floorRooms = Array.from({ length: newFloor.roomCount }).map((_, i) => ({
            id: `room_${Date.now()}_${i}`,
            number: (newFloor.startNumber + i).toString(),
            categoryId: newFloor.categoryId,
            floorName: newFloor.name,
            attributes: []
        }));

        const updatedFloors = [...data.floors, { ...newFloor, id: `floor_${Date.now()}` }];
        const updatedRooms = [...data.rooms, ...floorRooms];

        onUpdate('floors', updatedFloors);
        onUpdate('rooms', updatedRooms);
        setIsAdding(false);
        setNewFloor({ ...newFloor, name: '', startNumber: newFloor.startNumber + 100 });
    };

    const removeFloor = (floorId: string, floorName: string) => {
        onUpdate('floors', data.floors.filter(f => f.id !== floorId));
        onUpdate('rooms', data.rooms.filter(r => r.floorName !== floorName));
    };

    if (!isOpen) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Step 3: Physical Blueprint</h2>
                    <p className="text-zinc-500 mt-2 font-medium">Map your hotel layout. How many floors and rooms do you have?</p>
                </div>
                {!isAdding && data.categories.length > 0 && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 font-bold text-sm"
                    >
                        <Plus size={18} /> Add Floor Block
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {data.floors.map((floor) => (
                    <div key={floor.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center group hover:border-zinc-700 transition-all shadow-xl">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-indigo-400">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">{floor.name}</h3>
                                <div className="flex gap-4 mt-1">
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1">
                                        <Hash size={10} /> {floor.roomCount} Rooms
                                    </span>
                                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center gap-1">
                                        Pattern: {floor.startNumber} - {floor.startNumber + floor.roomCount - 1}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4 md:mt-0">
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase text-zinc-600 block mb-1">Assigned Category</span>
                                <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white">
                                    {data.categories.find(c => c.id === floor.categoryId)?.name || 'Unknown'}
                                </span>
                            </div>
                            <button
                                onClick={() => removeFloor(floor.id, floor.name)}
                                className="p-3 bg-red-500/5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {isAdding && (
                    <div className="bg-zinc-800/20 border-2 border-dashed border-indigo-500/30 p-10 rounded-[3rem] space-y-8 animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black uppercase text-indigo-400 mb-3 ml-1">Floor Name</label>
                                <input
                                    className="input-field w-full bg-zinc-950 border-zinc-800 focus:border-indigo-500 text-white font-bold h-14"
                                    placeholder="e.g. 1st Floor"
                                    value={newFloor.name}
                                    onChange={e => setNewFloor({ ...newFloor, name: e.target.value })}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black uppercase text-zinc-600 mb-3 ml-1">Rooms Count</label>
                                <input
                                    type="number"
                                    className="input-field w-full bg-zinc-950 border-zinc-800 text-white font-bold h-14"
                                    value={newFloor.roomCount}
                                    onChange={e => setNewFloor({ ...newFloor, roomCount: Number(e.target.value) })}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black uppercase text-zinc-600 mb-3 ml-1">Start Number</label>
                                <input
                                    type="number"
                                    className="input-field w-full bg-zinc-950 border-zinc-800 text-white font-bold h-14"
                                    value={newFloor.startNumber}
                                    onChange={e => setNewFloor({ ...newFloor, startNumber: Number(e.target.value) })}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black uppercase text-zinc-600 mb-3 ml-1">Default Category</label>
                                <select
                                    className="input-field w-full bg-zinc-950 border-zinc-800 text-white font-bold h-14"
                                    value={newFloor.categoryId}
                                    onChange={e => setNewFloor({ ...newFloor, categoryId: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {data.categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-end">
                            <button onClick={() => setIsAdding(false)} className="px-8 py-3 text-zinc-500 font-bold text-sm">Cancel</button>
                            <button onClick={handleAdd} className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20">Generate Units</button>
                        </div>
                    </div>
                )}

                {data.floors.length === 0 && !isAdding && (
                    <div className="p-20 border border-dashed border-zinc-800 rounded-[3rem] text-center flex flex-col items-center gap-4 group hover:border-indigo-500/20 transition-all cursor-pointer" onClick={() => setIsAdding(true)}>
                        <div className="p-6 bg-zinc-900 rounded-[2rem] border border-zinc-800 text-zinc-700 group-hover:text-indigo-400 transition-all">
                            <Map size={48} />
                        </div>
                        <p className="text-zinc-600 font-bold">Your property is currently empty. Add your first floor block.</p>
                        {data.categories.length === 0 && (
                            <p className="text-red-400/60 text-xs font-bold uppercase tracking-widest">Warning: Define categories in Step 1 first.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[1.5rem] flex items-center gap-4 text-xs font-medium text-indigo-400/80 leading-relaxed shadow-sm">
                <Info size={18} className="text-indigo-400 flex-shrink-0" />
                This generator creates physical "Room" entries. Each room will automatically point to its category for pricing and amenities. Unit-specific traits can be added in the summary.
            </div>
        </div>
    );
};

export default BlueprintStep;
