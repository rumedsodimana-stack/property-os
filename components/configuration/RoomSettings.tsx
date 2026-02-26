import React, { useState, useEffect } from 'react';
import { Bed, Plus, Trash2, Edit2, Check, X, Layers } from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { addItem, deleteItem, subscribeToItems } from '../../services/kernel/firestoreService';

interface RoomCategory {
    id: string;
    name: string;
    baseRate: number;
    maxOccupancy: number;
}

interface Room {
    id: string;
    number: string;
    categoryId: string;
    status: 'Clean' | 'Dirty' | 'Occupied' | 'Maintenance';
    floor: number;
}

const RoomSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'rooms' | 'categories'>('rooms');

    const { rooms } = usePms();
    const [categories, setCategories] = useState<RoomCategory[]>([]);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', baseRate: 0, maxOccupancy: 2 });

    useEffect(() => {
        const unsubscribe = subscribeToItems<RoomCategory>('roomCategories', (cats) => {
            setCategories(cats);
        });
        return () => unsubscribe();
    }, []);

    // Simplified Add/Edit Logic connected to Firestore
    const handleAddRoom = async () => {
        if (!categories.length) {
            alert('Please create a room category first');
            return;
        }

        const newRoom: Room = {
            id: `rm_${Date.now()}`,
            number: `10${rooms.length + 1}`,
            categoryId: categories[0].id,
            status: 'Clean',
            floor: 1
        };
        await addItem('rooms', newRoom);
    };

    const handleDeleteRoom = async (id: string) => {
        await deleteItem('rooms', id);
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name || newCategory.baseRate <= 0) return;
        const cat: Omit<RoomCategory, 'id'> = {
            name: newCategory.name,
            baseRate: newCategory.baseRate,
            maxOccupancy: newCategory.maxOccupancy
        };
        await addItem('roomCategories', cat as any);
        setIsCreatingCategory(false);
        setNewCategory({ name: '', baseRate: 0, maxOccupancy: 2 });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`text-sm font-medium transition ${activeTab === 'rooms' ? 'text-violet-400' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Rooms
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`text-sm font-medium transition ${activeTab === 'categories' ? 'text-violet-400' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Categories
                    </button>
                </div>
            </div>

            {activeTab === 'rooms' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Bed size={18} className="text-violet-400" />
                            Room Management
                        </h3>
                        <button onClick={handleAddRoom} className="p-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {rooms.map(room => {
                            const category = categories.find(c => c.id === room.categoryId);
                            return (
                                <div key={room.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-bold text-white font-mono">
                                            {room.number}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{category?.name || 'Unknown Category'}</div>
                                            <div className="text-xs text-zinc-500">Floor {room.floor} • {room.status}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDeleteRoom(room.id)} className="p-2 text-zinc-500 hover:text-red-400 transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Layers size={18} className="text-violet-400" />
                            Category Management
                        </h3>
                        <button onClick={() => setIsCreatingCategory(true)} className="p-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {categories.map(cat => (
                            <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition">
                                <div>
                                    <div className="text-sm font-medium text-white">{cat.name}</div>
                                    <div className="text-xs text-zinc-500">Max Occupancy: {cat.maxOccupancy} • Base Rate: ${cat.baseRate}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-zinc-500 hover:text-white transition">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isCreatingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-sm p-6 relative">
                        <button onClick={() => setIsCreatingCategory(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition">
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-semibold text-white mb-4">New Room Category</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Category Name</label>
                                <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none" placeholder="e.g. Deluxe Ocean View" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Base Rate ($)</label>
                                    <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none" value={newCategory.baseRate || ''} onChange={e => setNewCategory({ ...newCategory, baseRate: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Max Occupancy</label>
                                    <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none" value={newCategory.maxOccupancy || ''} onChange={e => setNewCategory({ ...newCategory, maxOccupancy: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <button onClick={handleCreateCategory} disabled={!newCategory.name || newCategory.baseRate <= 0} className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-white font-bold mt-4 transition shadow-lg shadow-violet-900/20">
                                Save Category
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomSettings;
