
import React, { useState } from 'react';
import { MasterInventoryItem, Supplier } from '../../types';
import { usePms } from '../../services/kernel/persistence';
import { X, Package, TrendingUp, History, ShoppingCart, AlertCircle, BarChart3, MapPin } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface InventoryItemModalProps {
    item: MasterInventoryItem;
    onClose: () => void;
}

const InventoryItemModal: React.FC<InventoryItemModalProps> = ({ item, onClose }) => {
    const { purchaseOrders: PMS_POS } = usePms();
    const [activeTab, setActiveTab] = useState<'Overview' | 'History' | 'Procurement'>('Overview');

    // Hydrate Data
    // Mock history locally to remove dependency
    const priceHistory = [
        { itemId: item.id, price: item.costPerUnit * 0.9, date: '2023-10-01' },
        { itemId: item.id, price: item.costPerUnit, date: '2023-11-01' }
    ];

    const relatedPOs = (PMS_POS || []).filter(po => po.items.some(i => i.description.includes(item.name)));

    // Prepare Stock Chart Data
    const stockLocationData = item.locations.map(loc => ({
        name: loc.locationName,
        stock: loc.stock
    }));

    const renderOverview = () => (
        <div className="space-y-6 animate-fadeIn">
            {/* Main Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Total Stock</div>
                    <div className={`text-2xl font-mono ${item.totalStock <= item.reorderPoint ? 'text-rose-500' : 'text-zinc-100'}`}>
                        {item.totalStock} <span className="text-sm text-zinc-500">{item.unit}</span>
                    </div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Par Level</div>
                    <div className="text-2xl font-mono text-zinc-100">{item.parLevel}</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Last Cost</div>
                    <div className="text-2xl font-mono text-zinc-100">{item.costPerUnit.toFixed(2)}</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Reorder Pt</div>
                    <div className="text-2xl font-mono text-amber-500">{item.reorderPoint}</div>
                </div>
            </div>

            {/* Location Breakdown Chart */}
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 h-64">
                <h4 className="text-xs text-zinc-500 uppercase font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Stock by Location
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockLocationData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                        <XAxis type="number" stroke="#71717a" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" stroke="#a1a1aa" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip
                            cursor={{ fill: '#27272a' }}
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                        />
                        <Bar dataKey="stock" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 h-72">
                <h4 className="text-xs text-zinc-500 uppercase font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Price Evolution
                </h4>
                {priceHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={priceHistory}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 10 }} />
                            <YAxis domain={['auto', 'auto']} stroke="#71717a" tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }} itemStyle={{ color: '#fff' }} />
                            <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 italic">No price history available.</div>
                )}
            </div>
        </div>
    );

    const renderProcurement = () => (
        <div className="space-y-4 animate-fadeIn">
            {relatedPOs.map(po => {
                const poItem = po.items.find(i => i.description.includes(item.name));
                return (
                    <div key={po.id} className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-200">PO #{po.id.toUpperCase()}</div>
                                <div className="text-xs text-zinc-500">
                                    {new Date(po.dateIssued).toLocaleDateString()} • {poItem?.qty} {poItem?.unit} @ {poItem?.cost}
                                </div>
                            </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded font-bold uppercase border ${po.status === 'Received' ? 'bg-teal-500/10 text-teal-500 border-teal-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                            {po.status}
                        </div>
                    </div>
                );
            })}
            {relatedPOs.length === 0 && <div className="p-8 text-center text-zinc-600 italic">No recent purchase orders.</div>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div
                className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative z-10 px-8 pt-8 pb-4 flex justify-between items-start border-b border-zinc-800">
                    <div>
                        <h2 className="text-2xl font-light text-zinc-100 flex items-center gap-3">
                            {item.name}
                        </h2>
                        <div className="flex gap-4 mt-2 text-xs text-zinc-500 font-mono">
                            <span>SKU: {item.sku}</span>
                            <span className="text-violet-400">{item.category}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition border border-zinc-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-zinc-800 bg-zinc-900/30">
                    {['Overview', 'History', 'Procurement'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-4 text-sm font-medium transition relative ${activeTab === tab ? 'text-teal-400' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500"></div>}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 p-8 overflow-y-auto flex-1 bg-zinc-950">
                    {activeTab === 'Overview' && renderOverview()}
                    {activeTab === 'History' && renderHistory()}
                    {activeTab === 'Procurement' && renderProcurement()}
                </div>
            </div>
        </div>
    );
};

export default InventoryItemModal;
