import React, { useState } from 'react';
import { X, Truck, Building, FileText, DollarSign } from 'lucide-react';
import { Supplier } from '../../types';
import { addItem } from '../../services/kernel/firestoreService';
import { botEngine } from '../../services/kernel/systemBridge';

interface NewSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newSupplier: Supplier) => void;
}

const NewSupplierModal: React.FC<NewSupplierModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'Food & Beverage',
        paymentTerms: 'Net 30',
        contactEmail: '',
        currency: 'BHD',
        isHalal: false,
        isZatca: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const newSupplier = {
                id: `sup_${Date.now()}`,
                name: formData.name,
                category: formData.category,
                contactEmail: formData.contactEmail,
                paymentTerms: formData.paymentTerms,
                currency: formData.currency,
                rating: 5.0, // Initial rating
                complianceFlags: {
                    halal: formData.isHalal,
                    zatca: formData.isZatca
                }
            };

            // Assuming addItem handles creating the document in Firestore
            await addItem('suppliers', newSupplier);
            botEngine.logActivity('FINANCE', 'Supplier_Created', `New Vendor: ${newSupplier.name}`, 'Controller_Admin');

            if (onSuccess) onSuccess(newSupplier as Supplier);
            onClose();
            setFormData({
                name: '', category: 'Food & Beverage', paymentTerms: 'Net 30', contactEmail: '', currency: 'BHD', isHalal: false, isZatca: true
            });
        } catch (error) {
            console.error("Failed to create supplier:", error);
            alert("Error creating supplier.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900/30">
                    <h3 className="text-lg font-light text-zinc-100 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-violet-500" /> New Supplier
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Supplier Name</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <input
                                required
                                type="text"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-violet-500"
                                placeholder="E.g., Almarai Foods"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Category</label>
                            <select
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Food & Beverage">Food & Beverage</option>
                                <option value="Engineering Supplies">Engineering Supplies</option>
                                <option value="Housekeeping">Housekeeping</option>
                                <option value="IT Services">IT Services</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Payment Terms</label>
                            <select
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500"
                                value={formData.paymentTerms}
                                onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                            >
                                <option value="Net 15">Net 15</option>
                                <option value="Net 30">Net 30</option>
                                <option value="Net 60">Net 60</option>
                                <option value="Cash on Delivery">Cash on Delivery</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Contact Email</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <input
                                required
                                type="email"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-violet-500"
                                placeholder="billing@supplier.com"
                                value={formData.contactEmail}
                                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500"
                                checked={formData.isHalal}
                                onChange={e => setFormData({ ...formData, isHalal: e.target.checked })}
                            />
                            <span className="text-sm text-zinc-400">Halal Certified</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500"
                                checked={formData.isZatca}
                                onChange={e => setFormData({ ...formData, isZatca: e.target.checked })}
                            />
                            <span className="text-sm text-zinc-400">ZATCA Compliant</span>
                        </label>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:bg-zinc-900 transition border border-zinc-800">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-900/20 disabled:opacity-50">
                            {isSubmitting ? 'Creating...' : 'Create Supplier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewSupplierModal;
