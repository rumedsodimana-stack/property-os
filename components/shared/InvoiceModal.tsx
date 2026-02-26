import React from 'react';
import { Supplier, Invoice } from '../../types';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    newInvoice: Partial<Invoice>;
    setNewInvoice: (invoice: Partial<Invoice>) => void;
    suppliers: Supplier[];
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, onSubmit, newInvoice, setNewInvoice, suppliers = [] }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scaleIn">
                <h3 className="text-lg font-bold text-zinc-100 mb-6">Record New Invoice</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Supplier</label>
                        <select
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 outline-none focus:border-violet-500"
                            value={newInvoice.supplierId || ''}
                            onChange={(e) => setNewInvoice({ ...newInvoice, supplierId: e.target.value })}
                        >
                            <option value="">Select Supplier...</option>
                            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Amount ({CONFIG_PROPERTY?.currency || 'USD'})</label>
                        <input
                            type="number"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 outline-none focus:border-violet-500 font-mono"
                            placeholder="0.00"
                            value={newInvoice.amount || ''}
                            onChange={(e) => setNewInvoice({ ...newInvoice, amount: isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value) })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Description / Notes</label>
                        <textarea
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 outline-none focus:border-violet-500 h-24"
                            placeholder="e.g. Monthly maintenance fee"
                            value={newInvoice.notes || ''}
                            onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold transition">Cancel</button>
                    <button onClick={onSubmit} className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition">Save Invoice</button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
