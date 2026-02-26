
import React, { useState } from 'react';
import { Supplier, PurchaseOrder, Ingredient } from '../../types';
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import { X, Truck, Phone, Mail, Star, FileText, ShoppingCart, CheckCircle, Scale, DollarSign, Calendar } from 'lucide-react';

interface SupplierProfileModalProps {
    supplier: Supplier;
    onClose: () => void;
}

const SupplierProfileModal: React.FC<SupplierProfileModalProps> = ({ supplier, onClose }) => {
    const { purchaseOrders: PMS_POS, inventory: PMS_INVENTORY } = usePms();
    const [activeTab, setActiveTab] = useState<'Overview' | 'Orders' | 'Catalogue' | 'Financials'>('Overview');

    // Hydrate Data
    const orders = (PMS_POS || []).filter(po => po.supplierId === supplier.id).sort((a, b) => b.dateIssued - a.dateIssued);

    // Map Inventory to Catalogue Ingredients
    const catalogue = (PMS_INVENTORY || []).filter(i => true) // Assuming inventory isn't strictly linked to supplier ID in PMS yet, or filter if possible: i.supplierId === supplier.id
        .filter(i => i.supplierId === supplier.id) // Try filtering
        .map(i => ({
            id: i.id,
            itemCode: i.sku,
            name: i.name,
            unit: i.unit,
            costPerUnit: i.unitCost,
            supplierId: i.supplierId,
            isHalal: true, // Placeholder
            allergens: [],
            traceabilityLog: 'Derived from Master Inventory'
        }));

    const totalSpend = orders.reduce((acc, o) => acc + o.total, 0);

    const renderOverview = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                        <Star className="w-3 h-3 text-amber-500" /> Performance Rating
                    </div>
                    <div className="text-3xl font-light text-zinc-100">{supplier.rating.toFixed(1)} <span className="text-sm text-zinc-600">/ 5.0</span></div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${(supplier.rating / 5) * 100}%` }}></div>
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-emerald-500" /> Total Spend (YTD)
                    </div>
                    <div className="text-3xl font-light text-zinc-100">{CONFIG_PROPERTY.currency} {totalSpend.toLocaleString()}</div>
                    <div className="text-xs text-zinc-500 mt-1">{orders.length} Orders processed</div>
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h4 className="text-sm font-bold text-zinc-200 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-500" /> Contract Details
                </h4>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                        <span className="text-zinc-500 block text-xs">Payment Terms</span>
                        <span className="text-zinc-200">{supplier.paymentTerms}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-xs">Currency</span>
                        <span className="text-zinc-200">{supplier.currency}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-xs">Email</span>
                        <span className="text-zinc-200">{supplier.contactEmail}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-xs">Category</span>
                        <span className="text-zinc-200">{supplier.category}</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                {supplier.complianceFlags.halal && <span className="text-[10px] bg-teal-500/10 text-teal-500 px-3 py-1 rounded border border-teal-500/20 font-bold">HALAL CERTIFIED</span>}
                {supplier.complianceFlags.zatca && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-3 py-1 rounded border border-blue-500/20 font-bold">ZATCA COMPLIANT</span>}
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden animate-fadeIn">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold">
                    <tr>
                        <th className="px-6 py-4">PO Number</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Items</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {orders.map(po => (
                        <tr key={po.id} className="hover:bg-zinc-900/50">
                            <td className="px-6 py-4 font-mono text-violet-400">{po.id.toUpperCase()}</td>
                            <td className="px-6 py-4 text-xs">{new Date(po.dateIssued).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{po.items.length} Line Items</td>
                            <td className="px-6 py-4 font-mono text-zinc-200">{po.total.toLocaleString()}</td>
                            <td className="px-6 py-4">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${po.status === 'Received' ? 'bg-teal-500/10 text-teal-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {po.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {orders.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-zinc-600 italic">No purchase history.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderCatalogue = () => (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden animate-fadeIn">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold">
                    <tr>
                        <th className="px-6 py-4">Item Code</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Unit</th>
                        <th className="px-6 py-4">Cost</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {catalogue.map(item => (
                        <tr key={item.id} className="hover:bg-zinc-900/50">
                            <td className="px-6 py-4 font-mono text-xs">{item.itemCode}</td>
                            <td className="px-6 py-4 text-zinc-200 font-medium">{item.name}</td>
                            <td className="px-6 py-4">{item.unit}</td>
                            <td className="px-6 py-4 font-mono text-emerald-400">{item.costPerUnit.toFixed(2)}</td>
                        </tr>
                    ))}
                    {catalogue.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-zinc-600 italic">No items linked to this supplier.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div
                className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-zinc-800 to-zinc-950 opacity-30"></div>

                {/* Header */}
                <div className="relative z-10 px-8 pt-8 pb-4 flex justify-between items-start border-b border-zinc-800">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-500">
                            <Truck className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-light text-zinc-100">{supplier.name}</h2>
                            <span className="text-xs bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-zinc-400 uppercase tracking-wider mt-1 inline-block">
                                {supplier.category} Vendor
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition border border-zinc-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-zinc-800 bg-zinc-900/30">
                    {['Overview', 'Orders', 'Catalogue', 'Financials'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-4 text-sm font-medium transition relative ${activeTab === tab ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500"></div>}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 p-8 overflow-y-auto flex-1 bg-zinc-950">
                    {activeTab === 'Overview' && renderOverview()}
                    {activeTab === 'Orders' && renderOrders()}
                    {activeTab === 'Catalogue' && renderCatalogue()}
                    {activeTab === 'Financials' && (
                        <div className="text-center p-12 text-zinc-600 italic border-2 border-dashed border-zinc-800 rounded-2xl">
                            Ledger Integration Pending (Use Finance Module)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupplierProfileModal;
