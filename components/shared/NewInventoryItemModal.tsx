import React, { useState } from 'react';
import { X, Box, Tag, Layers, MapPin } from 'lucide-react';
import { MasterInventoryItem } from '../../types';
import { addItem } from '../../services/kernel/firestoreService';
import { botEngine } from '../../services/kernel/systemBridge';

interface NewInventoryItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newItem: MasterInventoryItem) => void;
}

const NewInventoryItemModal: React.FC<NewInventoryItemModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: 'Food',
        unit: 'kg',
        costPerUnit: 0,
        parLevel: 100,
        reorderPoint: 20
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const newItem: Omit<MasterInventoryItem, 'id'> = {
                sku: formData.sku,
                name: formData.name,
                category: formData.category as any,
                unit: formData.unit,
                costPerUnit: formData.costPerUnit,
                parLevel: formData.parLevel,
                reorderPoint: formData.reorderPoint,
                totalStock: 0,
                locations: [
                    { locationId: 'store_main', locationName: 'Main Store', stock: 0 }
                ]
            };

            const docRef = await addItem('master_inventory', newItem as any);
            const createdItem = { ...newItem, id: docRef.id } as MasterInventoryItem;
            botEngine.logActivity('FINANCE', 'Inventory_Item_Created', `New Item: ${newItem.name}`, 'Controller_Admin');

            if (onSuccess) onSuccess(createdItem);
            onClose();
            setFormData({
                name: '', sku: '', category: 'Food', unit: 'kg', costPerUnit: 0, parLevel: 100, reorderPoint: 20
            });
        } catch (error) {
            console.error("Failed to create inventory item:", error);
            alert("Error creating inventory item.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900/30">
                    <h3 className="text-lg font-light text-zinc-100 flex items-center gap-2">
                        <Box className="w-5 h-5 text-violet-500" /> New Inventory Item
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Item Name</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-violet-500"
                                    placeholder="E.g., Saffron Threads"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">SKU</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500 font-mono"
                                placeholder="SAF-001"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Category</label>
                            <select
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Food">Food</option>
                                <option value="Beverage">Beverage</option>
                                <option value="Supplies">Supplies</option>
                                <option value="Engineering">Engineering</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Unit of Measure</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500"
                                placeholder="kg, L, box, etc."
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Estimated Cost</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500"
                                placeholder="0.00"
                                value={formData.costPerUnit || ''}
                                onChange={e => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Par Level</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500"
                                value={formData.parLevel}
                                onChange={e => setFormData({ ...formData, parLevel: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Reorder Point</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-amber-400 outline-none focus:border-amber-500"
                                value={formData.reorderPoint}
                                onChange={e => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:bg-zinc-900 transition border border-zinc-800">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-900/20 disabled:opacity-50">
                            {isSubmitting ? 'Creating...' : 'Add to Master'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewInventoryItemModal;
