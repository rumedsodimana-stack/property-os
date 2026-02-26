
import React, { useState, useEffect, useMemo } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import { Supplier, PurchaseOrder, RFQ, ProcurementRequest, Ingredient, LedgerEntry, MasterInventoryItem } from '../../types';
import { Truck, FileText, CheckCircle, Search, Plus, Brain, Gavel, Scale, X, Mail, Calendar, BookOpen, Receipt, Info, Activity, Sparkles } from 'lucide-react';
import { botEngine } from '../../services/kernel/systemBridge';
import { useInspector } from '../../context/InspectorContext';
import Inspectable from '../shared/Inspectable';
import { ReportEngine, ReportDimension, ReportMetric } from '../shared/ReportEngine';
import { oracleService } from '../../services/intelligence/oracleService';
import { addItem } from '../../services/kernel/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface ProcurementDashboardProps {
    onSyncLedger?: (entry: LedgerEntry) => void;
}

const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({ onSyncLedger }) => {
    const { currentUser } = useAuth();
    const {
        suppliers: PMS_SUPPLIERS,
        purchaseOrders: PMS_POS,
        procurementRequests: PMS_REQUESTS,
        rfqs: PMS_RFQS,
        inventory: PMS_INVENTORY
    } = usePms();

    const [activeTab, setActiveTab] = useState<'Overview' | 'Requests' | 'RFQs' | 'POs' | 'Receiving' | 'Suppliers' | 'Catalogue' | 'Reports'>('Overview');
    const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
    const { inspect } = useInspector();

    // Oracle AI Intelligence
    const procIntel = useMemo(() => oracleService.getProcurementIntel(
        PMS_INVENTORY || [],
        PMS_SUPPLIERS || [],
        PMS_POS || []
    ), [PMS_INVENTORY, PMS_SUPPLIERS, PMS_POS]);

    // Data State
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [requests, setRequests] = useState<ProcurementRequest[]>([]);
    const [rfqs, setRfqs] = useState<RFQ[]>([]);
    const [catalogue, setCatalogue] = useState<any[]>([]); // Using any for flexbility between Ingredient and MasterInventoryItem

    useEffect(() => { if (PMS_SUPPLIERS) setSuppliers(PMS_SUPPLIERS); }, [PMS_SUPPLIERS]);
    useEffect(() => { if (PMS_POS) setPurchaseOrders(PMS_POS); }, [PMS_POS]);
    useEffect(() => { if (PMS_REQUESTS) setRequests(PMS_REQUESTS); }, [PMS_REQUESTS]);
    useEffect(() => { if (PMS_RFQS) setRfqs(PMS_RFQS); }, [PMS_RFQS]);
    useEffect(() => {
        if (PMS_INVENTORY) {
            setCatalogue(PMS_INVENTORY.map(item => ({
                id: item.id,
                itemCode: item.sku,
                name: item.name,
                unit: item.unit,
                costPerUnit: item.costPerUnit,
                supplierId: (item as any).supplierId || '',
                isHalal: Boolean((item as any).isHalal)
            })));
        }
    }, [PMS_INVENTORY]);

    // Modals
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [showReceiveModal, setShowReceiveModal] = useState(false);

    // Form State for Adding Supplier
    const [newSupplierForm, setNewSupplierForm] = useState<Partial<Supplier> & {
        contactPhone?: string;
        taxId?: string;
        address?: string;
        contactName?: string;
    }>({
        name: '',
        category: 'Food',
        contactEmail: '',
        contactPhone: '',
        contactName: '',
        taxId: '',
        address: '',
        paymentTerms: 'Net 30',
        currency: 'BHD',
        complianceFlags: { halal: false, zatca: false, sustainable: false, isoCertified: false }
    });
    const [supplierErrors, setSupplierErrors] = useState<string[]>([]);
    const [savingSupplier, setSavingSupplier] = useState(false);
    const [requestError, setRequestError] = useState<string>('');
    const [rfqError, setRfqError] = useState<string>('');
    const [savingRequest, setSavingRequest] = useState(false);
    const [savingRfq, setSavingRfq] = useState(false);
    const [requestForm, setRequestForm] = useState({
        department: 'F&B',
        description: '',
        qty: 1,
        unit: 'kg',
        estimatedCost: 0,
        priority: 'Medium' as ProcurementRequest['priority'],
        notes: ''
    });
    const [rfqForm, setRfqForm] = useState({
        description: '',
        qty: 1,
        unit: 'kg',
        deadline: '',
        invitedSuppliers: [] as string[]
    });

    const handleSaveSupplier = async () => {
        const errors: string[] = [];
        if (!newSupplierForm.name?.trim()) errors.push('Supplier legal name is required.');
        if (!newSupplierForm.contactEmail?.trim()) errors.push('Supplier contact email is required.');
        if (!newSupplierForm.contactPhone?.trim()) errors.push('Supplier contact phone is required.');
        if (!newSupplierForm.taxId?.trim()) errors.push('Tax registration / VAT ID is required.');
        if (!newSupplierForm.category) errors.push('Supplier category is required.');
        if (!newSupplierForm.paymentTerms?.trim()) errors.push('Payment terms are required.');
        if (!newSupplierForm.currency?.trim()) errors.push('Settlement currency is required.');

        if (errors.length > 0) {
            setSupplierErrors(errors);
            return;
        }

        setSavingSupplier(true);
        setSupplierErrors([]);
        try {
            const payload: Omit<Supplier, 'id'> = {
                name: newSupplierForm.name!.trim(),
                category: newSupplierForm.category as Supplier['category'],
                rating: 5,
                paymentTerms: newSupplierForm.paymentTerms!.trim(),
                currency: newSupplierForm.currency!.trim().toUpperCase(),
                complianceFlags: newSupplierForm.complianceFlags || { halal: false, zatca: false, sustainable: false, isoCertified: false },
                contactEmail: newSupplierForm.contactEmail!.trim().toLowerCase(),
                historicalPerformance: [],
            };

            const ref = await addItem('suppliers', payload as any);
            const created: Supplier = { id: ref.id, ...payload };
            setSuppliers(prev => [...prev, created]);

            botEngine.logActivity('PROCUREMENT', 'Supplier_Added', `Vendor: ${created.name}`, currentUser?.fullName || 'Procurement');
            setIsSupplierModalOpen(false);
            setNewSupplierForm({
                name: '',
                category: 'Food',
                contactEmail: '',
                contactPhone: '',
                contactName: '',
                taxId: '',
                address: '',
                paymentTerms: 'Net 30',
                currency: 'BHD',
                complianceFlags: { halal: false, zatca: false, sustainable: false, isoCertified: false }
            });
        } catch (error) {
            setSupplierErrors(['Failed to save supplier. Please retry.']);
        } finally {
            setSavingSupplier(false);
        }
    };

    const handleApproveRequest = (id: string) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
        botEngine.logActivity('PROCUREMENT', 'Request_Approved', `Req ID: ${id}`, 'Manager.Procure');
    };

    const handleCreateRequest = async () => {
        setRequestError('');
        if (!requestForm.description.trim()) {
            setRequestError('Item description is required.');
            return;
        }
        if (requestForm.qty <= 0 || requestForm.estimatedCost < 0) {
            setRequestError('Quantity and estimated cost must be valid values.');
            return;
        }
        setSavingRequest(true);
        try {
            const payload: ProcurementRequest = {
                id: `req_${Date.now()}`,
                requesterId: currentUser?.userId || 'proc_user',
                department: requestForm.department,
                items: [{
                    description: requestForm.description.trim(),
                    qty: requestForm.qty,
                    unit: requestForm.unit.trim() || 'ea',
                    estimatedCost: requestForm.estimatedCost
                }],
                status: 'Pending Approval',
                dateRequested: Date.now(),
                priority: requestForm.priority,
                notes: requestForm.notes.trim() || undefined
            };
            await addItem('procurementRequests', payload as any);
            setRequests(prev => [payload, ...prev]);
            setIsRequestModalOpen(false);
            setRequestForm({ department: 'F&B', description: '', qty: 1, unit: 'kg', estimatedCost: 0, priority: 'Medium', notes: '' });
            botEngine.logActivity('PROCUREMENT', 'Request_Created', payload.items[0].description, currentUser?.fullName || 'Procurement');
        } catch {
            setRequestError('Failed to create request. Please retry.');
        } finally {
            setSavingRequest(false);
        }
    };

    const handleCreateRFQ = async () => {
        setRfqError('');
        if (!rfqForm.description.trim()) {
            setRfqError('Item description is required.');
            return;
        }
        if (rfqForm.invitedSuppliers.length === 0) {
            setRfqError('Invite at least one supplier.');
            return;
        }
        if (!rfqForm.deadline) {
            setRfqError('Deadline is required.');
            return;
        }
        setSavingRfq(true);
        try {
            const payload: RFQ = {
                id: `rfq_${Date.now()}`,
                requestId: `manual_${Date.now()}`,
                items: [{
                    description: rfqForm.description.trim(),
                    qty: rfqForm.qty,
                    unit: rfqForm.unit.trim() || 'ea'
                }],
                invitedSuppliers: rfqForm.invitedSuppliers,
                bids: [],
                status: 'Open',
                deadline: new Date(rfqForm.deadline).getTime(),
                dateIssued: Date.now()
            };
            await addItem('rfqs', payload as any);
            setRfqs(prev => [payload, ...prev]);
            setIsRfqModalOpen(false);
            setRfqForm({ description: '', qty: 1, unit: 'kg', deadline: '', invitedSuppliers: [] });
            botEngine.logActivity('PROCUREMENT', 'RFQ_Created', payload.id, currentUser?.fullName || 'Procurement');
        } catch {
            setRfqError('Failed to create RFQ. Please retry.');
        } finally {
            setSavingRfq(false);
        }
    };

    const handleConfirmReceipt = () => {
        if (!selectedPO) return;
        setPurchaseOrders(prev => prev.map(p => p.id === selectedPO.id ? { ...p, status: 'Received' } : p));
        if (onSyncLedger) {
            onSyncLedger({
                id: `le_${Date.now()}`,
                transactionId: `tx_po_${selectedPO.id}`,
                date: Date.now(),
                businessDate: new Date().toISOString().split('T')[0],
                accountId: 'gl_04',
                accountCode: '2000',
                debit: 0,
                credit: selectedPO.total,
                description: `PO #${selectedPO.id} Invoice Receipt`,
                moduleSource: 'Procurement',
                departmentId: 'Procurement'
            });
        }
        botEngine.logActivity('PROCUREMENT', 'PO_Received', `PO #${selectedPO.id}`, 'Clerk.Receiving');
        setShowReceiveModal(false);
        setSelectedPO(null);
    };

    const handleCatalogueItemClick = (ingredient: Ingredient) => {
        // PMS_INVENTORY is available from usePms hook scope
        const masterItem = PMS_INVENTORY?.find(m => m.sku === ingredient.itemCode || m.name === ingredient.name);
        if (masterItem) {
            inspect('inventory', masterItem.id);
        } else {
            inspect('inventory', ingredient.id);
        }
    };

    const renderOverview = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="module-grid">
                <KPICard title="Total Spend" value={`${CONFIG_PROPERTY.currency} ${(procIntel.spendKpis.totalSpend / 1000).toFixed(1)}k`} trend={`${procIntel.spendKpis.activePOs} active POs`} icon={<Truck className="w-5 h-5" />} />
                <KPICard title="Avg PO Value" value={`${CONFIG_PROPERTY.currency} ${procIntel.spendKpis.avgPOValue.toFixed(0)}`} trend="Per Order" positive icon={<Brain className="w-5 h-5 text-violet-500" />} />
                <KPICard title="Vendor Score" value={`${procIntel.supplierScores.filter(s => s.grade === 'A').length}/${procIntel.spendKpis.supplierCount}`} trend="A-Rated" positive icon={<CheckCircle className="w-5 h-5" />} />
                <KPICard title="Below PAR" value={procIntel.spendKpis.belowParCount.toString()} trend="Action Needed" positive={false} inverse icon={<Scale className="w-5 h-5" />} />
            </div>

            {/* Oracle Pulse Bar */}
            {procIntel.alerts.length > 0 && (
                <div className="bg-gradient-to-r from-amber-600/10 via-zinc-900 to-zinc-900 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4 animate-fadeIn">
                    <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/30 shrink-0">
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Oracle Pulse — Supply Chain</h4>
                            <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">LIVE</span>
                        </div>
                        <div className="space-y-1.5">
                            {procIntel.alerts.map((alert: string, i: number) => (
                                <p key={i} className="text-xs text-zinc-300 leading-relaxed">⚡ {alert}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-base font-medium text-zinc-100 mb-6">Live Procurement Activity</h3>
                    <div className="space-y-4">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><FileText className="w-5 h-5" /></div>
                                    <div>
                                        <div className="text-sm font-medium text-zinc-200">{req.items[0].description}</div>
                                        <div className="text-xs text-zinc-500">{req.department} • {req.status}</div>
                                    </div>
                                </div>
                                {req.status === 'Pending Approval' && (
                                    <button onClick={() => handleApproveRequest(req.id)} className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition">Review</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Supplier Health Panel */}
                <div className="bg-gradient-to-b from-zinc-900 to-violet-950/20 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                        <Brain className="w-5 h-5 text-violet-500" />
                        <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider">Supplier Health</h3>
                    </div>
                    <div className="space-y-3">
                        {procIntel.supplierScores.slice(0, 5).map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                <div className="text-sm text-zinc-300">{s.name}</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-500">{s.fillRate}%</span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${s.grade === 'A' ? 'bg-emerald-500/10 text-emerald-400' : s.grade === 'B' ? 'bg-blue-500/10 text-blue-400' : s.grade === 'C' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>{s.grade}</span>
                                </div>
                            </div>
                        ))}
                        {procIntel.supplierScores.length === 0 && (
                            <p className="text-xs text-zinc-600 text-center py-4">No supplier data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSuppliers = () => (
        <div className="h-full flex flex-col animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-light text-zinc-100 flex items-center gap-2"><Truck className="w-5 h-5 text-amber-500" /> Supplier Directory</h3>
                <button onClick={() => setIsSupplierModalOpen(true)} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium"><Plus className="w-4 h-4 mr-2 inline" /> Add Vendor</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                {suppliers.map(sup => (
                    <div key={sup.id} onClick={() => inspect('supplier', sup.id)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-violet-500/50 transition cursor-pointer group">
                        <h4 className="text-lg font-bold text-zinc-200 group-hover:text-violet-400">{sup.name}</h4>
                        <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">{sup.category}</div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400"><Mail className="w-4 h-4" /> {sup.contactEmail}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCatalogue = () => (
        <div className="space-y-6 animate-fadeIn h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-light text-zinc-100 flex items-center gap-2"><BookOpen className="w-5 h-5 text-amber-500" /> Master Catalogue</h3>
                <span className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg text-xs font-semibold uppercase tracking-wider">Managed via Inventory</span>
            </div>
            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-950/50 text-zinc-500 uppercase text-[10px] font-bold">
                        <tr><th className="px-6 py-4">Item Code</th><th className="px-6 py-4">Ingredient</th><th className="px-6 py-4">Supplier</th><th className="px-6 py-4 text-right">Details</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {catalogue.map((item, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/30 cursor-pointer" onClick={() => handleCatalogueItemClick(item)}>
                                <td className="px-6 py-4 font-mono text-violet-400">{item.itemCode}</td>
                                <td className="px-6 py-4 text-zinc-200">{item.name}</td>
                                <td className="px-6 py-4">{suppliers.find(s => s.id === item.supplierId)?.name}</td>
                                <td className="px-6 py-4 text-right"><Info className="w-4 h-4 ml-auto" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderRequests = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-light text-zinc-100 flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" /> Procurement Requests</h3>
                <button onClick={() => setIsRequestModalOpen(true)} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium">New Request</button>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {requests.map(req => (
                    <div key={req.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-violet-500/30 transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${req.priority === 'High' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-200">{req.items[0].description}</div>
                                    <div className="text-xs text-zinc-500">{req.department} • Requested by {req.requesterId}</div>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {req.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50">
                            <div className="text-xs text-zinc-500">Qty: {req.items[0].qty} {req.items[0].unit}</div>
                            <div className="text-xs font-bold text-zinc-300">Est. {req.items[0].estimatedCost} {CONFIG_PROPERTY.currency}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderRFQs = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-light text-zinc-100 flex items-center gap-2"><Gavel className="w-5 h-5 text-amber-500" /> Active RFQs</h3>
                <button onClick={() => setIsRfqModalOpen(true)} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium">Create RFQ</button>
            </div>
            <div className="module-grid">
                {rfqs.map(rfq => (
                    <div key={rfq.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-xs text-zinc-500 font-mono mb-1">{rfq.id.toUpperCase()}</div>
                                <div className="text-sm font-bold text-zinc-200">{rfq.items[0].description}</div>
                            </div>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold bg-zinc-800 px-2 py-1 rounded">{rfq.status}</span>
                        </div>
                        <div className="space-y-2 mb-6">
                            <div className="text-xs text-zinc-500">Invited Suppliers:</div>
                            <div className="flex flex-wrap gap-2">
                                {rfq.invitedSuppliers.map(sid => (
                                    <Inspectable key={sid} type="supplier" id={sid}>
                                        <div className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-400">
                                            {suppliers.find(s => s.id === sid)?.name}
                                        </div>
                                    </Inspectable>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-zinc-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                            </div>
                            <button className="text-xs text-violet-400 font-bold hover:underline">View Bids</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderReceiving = () => (
        <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-light text-zinc-100 flex items-center gap-2"><Receipt className="w-5 h-5 text-amber-500" /> Goods Receiving</h3>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-950/50 uppercase text-[10px] font-bold">
                        <tr><th className="px-6 py-4">PO #</th><th className="px-6 py-4">Supplier</th><th className="px-6 py-4">Expected</th><th className="px-6 py-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {purchaseOrders.filter(po => po.status === 'Sent').map(po => (
                            <tr key={po.id} className="hover:bg-zinc-900/30">
                                <td className="px-6 py-4 font-mono text-violet-400">{po.id.toUpperCase()}</td>
                                <td className="px-6 py-4">
                                    <Inspectable type="supplier" id={po.supplierId}>
                                        {suppliers.find(s => s.id === po.supplierId)?.name}
                                    </Inspectable>
                                </td>
                                <td className="px-6 py-4">{new Date(po.expectedDelivery).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => { setSelectedPO(po); setShowReceiveModal(true); }} className="px-3 py-1 bg-emerald-600/10 text-emerald-500 text-xs font-bold rounded hover:bg-emerald-600/20 transition">Receive</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'Suppliers': return renderSuppliers();
            case 'Catalogue': return renderCatalogue();
            case 'POs': return (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden animate-fadeIn">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950/50 uppercase text-[10px] font-bold">
                            <tr><th className="px-6 py-4">PO #</th><th className="px-6 py-4">Supplier</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {purchaseOrders.map(po => (
                                <tr key={po.id} className="hover:bg-zinc-900/30">
                                    <td className="px-6 py-4 font-mono text-violet-400">{po.id.toUpperCase()}</td>
                                    <td className="px-6 py-4">
                                        <Inspectable type="supplier" id={po.supplierId}>
                                            {suppliers.find(s => s.id === po.supplierId)?.name}
                                        </Inspectable>
                                    </td>
                                    <td className="px-6 py-4 font-mono">{po.total} {po.currency}</td>
                                    <td className="px-6 py-4 text-[10px] font-bold uppercase">
                                        <span className={`px-2 py-0.5 rounded ${po.status === 'Received' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {po.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            case 'Requests': return renderRequests();
            case 'RFQs': return renderRFQs();
            case 'Receiving': return renderReceiving();
            case 'Reports': return (
                <ReportEngine
                    title="Procurement Spend & Vendor Analytics"
                    data={purchaseOrders}
                    dimensions={[
                        { key: 'status', label: 'Order Status' },
                        { key: 'supplierId', label: 'Supplier ID' },
                        { key: 'currency', label: 'Currency' }
                    ]}
                    metrics={[
                        { key: 'id', label: 'Order Count', unit: 'POs' },
                        { key: 'total', label: 'Total Spend', unit: CONFIG_PROPERTY.currency }
                    ]}
                    defaultDimension="status"
                    defaultMetric="total"
                    defaultChartType="Pie"
                />
            );
            default: return renderOverview();
        }
    };

    return (
        <div className="module-container bg-transparent flex flex-col h-full overflow-hidden">
            {/* Standardized Singularity Header Layout */}
            <header className="module-header glass-panel flex items-start justify-between gap-3 flex-wrap">
                {/* Left: Module Title */}
                <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20">
                        <Truck className="w-6 h-6 text-violet-500" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-2xl font-light text-white tracking-tight leading-none">Procurement Hub</h2>
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Supply & Compliance</div>
                    </div>
                </div>

                {/* Right: Sub-Menu (Tabs + Reports) + Search */}
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-wrap ml-auto min-w-0">
                    {/* Sub-menu (Align to right hand side) */}
                    <div className="flex items-center bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 flex-wrap">
                        {['Overview', 'Requests', 'RFQs', 'POs', 'Receiving', 'Suppliers', 'Catalogue', 'Reports'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`min-w-[90px] px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeTab === tab ? 'bg-zinc-800 text-white shadow-xl shadow-black/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar (At the last) */}
                    <div className="relative flex-shrink-0 w-full sm:w-auto">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Find Purchase..."
                            className="w-full sm:w-48 bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-[10px] text-zinc-300 focus:border-violet-500/50 outline-none transition-all sm:focus:w-64"
                        />
                    </div>
                </div>
            </header>

            <main className="module-body">
                {renderContent()}
            </main>

            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4" onClick={() => setIsRequestModalOpen(false)}>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-light text-zinc-100 mb-6">Create Procurement Request</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Department</label>
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                        value={requestForm.department}
                                        onChange={e => setRequestForm(prev => ({ ...prev, department: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Priority</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                        value={requestForm.priority}
                                        onChange={e => setRequestForm(prev => ({ ...prev, priority: e.target.value as ProcurementRequest['priority'] }))}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Emergency">Emergency</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Item Description *</label>
                                <input
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                    placeholder="e.g. Fresh salmon fillet"
                                    value={requestForm.description}
                                    onChange={e => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Qty *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                        value={requestForm.qty}
                                        onChange={e => setRequestForm(prev => ({ ...prev, qty: Number(e.target.value) }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Unit *</label>
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                        value={requestForm.unit}
                                        onChange={e => setRequestForm(prev => ({ ...prev, unit: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Est. Cost *</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                        value={requestForm.estimatedCost}
                                        onChange={e => setRequestForm(prev => ({ ...prev, estimatedCost: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Notes</label>
                                <textarea
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm min-h-[80px]"
                                    value={requestForm.notes}
                                    onChange={e => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                            {requestError && <p className="text-xs text-rose-400">{requestError}</p>}
                            <button
                                onClick={handleCreateRequest}
                                disabled={savingRequest}
                                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 rounded-xl text-white text-xs font-bold uppercase tracking-widest"
                            >
                                {savingRequest ? 'Creating...' : 'Create Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isRfqModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4" onClick={() => setIsRfqModalOpen(false)}>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-light text-zinc-100 mb-6">Create RFQ</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Item Description *</label>
                                <input
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                    value={rfqForm.description}
                                    onChange={e => setRfqForm(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Qty *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                        value={rfqForm.qty}
                                        onChange={e => setRfqForm(prev => ({ ...prev, qty: Number(e.target.value) }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Unit *</label>
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                        value={rfqForm.unit}
                                        onChange={e => setRfqForm(prev => ({ ...prev, unit: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Deadline *</label>
                                    <input
                                        type="date"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm"
                                        value={rfqForm.deadline}
                                        onChange={e => setRfqForm(prev => ({ ...prev, deadline: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-2 block">Invite Suppliers *</label>
                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                                    {suppliers.map(supplier => (
                                        <label key={supplier.id} className="flex items-center gap-2 text-xs text-zinc-300">
                                            <input
                                                type="checkbox"
                                                checked={rfqForm.invitedSuppliers.includes(supplier.id)}
                                                onChange={e => setRfqForm(prev => ({
                                                    ...prev,
                                                    invitedSuppliers: e.target.checked
                                                        ? [...prev.invitedSuppliers, supplier.id]
                                                        : prev.invitedSuppliers.filter(id => id !== supplier.id)
                                                }))}
                                            />
                                            {supplier.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {rfqError && <p className="text-xs text-rose-400">{rfqError}</p>}
                            <button
                                onClick={handleCreateRFQ}
                                disabled={savingRfq}
                                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 rounded-xl text-white text-xs font-bold uppercase tracking-widest"
                            >
                                {savingRfq ? 'Creating...' : 'Create RFQ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSupplierModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4" onClick={() => setIsSupplierModalOpen(false)}>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-light text-zinc-100 mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-violet-500" /> New Strategic Supplier
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Legal Entity Name *</label>
                                <input
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm outline-none focus:border-violet-500/50 transition-colors"
                                    placeholder="Legal Entity Name"
                                    value={newSupplierForm.name || ''}
                                    onChange={e => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Category *</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm outline-none focus:border-violet-500/50"
                                        value={newSupplierForm.category || 'Food'}
                                        onChange={e => setNewSupplierForm({ ...newSupplierForm, category: e.target.value as Supplier['category'] })}
                                    >
                                        <option value="Food">Food</option>
                                        <option value="Beverage">Beverage</option>
                                        <option value="Operating Supplies">Operating Supplies</option>
                                        <option value="Services">Services</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Currency *</label>
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm outline-none focus:border-violet-500/50 transition-colors"
                                        placeholder="BHD / USD / EUR"
                                        value={newSupplierForm.currency || ''}
                                        onChange={e => setNewSupplierForm({ ...newSupplierForm, currency: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Commercial Email *</label>
                                <input
                                    type="email"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm outline-none focus:border-violet-500/50 transition-colors"
                                    placeholder="vendor@company.com"
                                    value={newSupplierForm.contactEmail || ''}
                                    onChange={e => setNewSupplierForm({ ...newSupplierForm, contactEmail: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Contact Person</label>
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm outline-none focus:border-violet-500/50 transition-colors"
                                        placeholder="Primary buyer contact"
                                        value={newSupplierForm.contactName || ''}
                                        onChange={e => setNewSupplierForm({ ...newSupplierForm, contactName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Phone *</label>
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm outline-none focus:border-violet-500/50 transition-colors"
                                        placeholder="+973..."
                                        value={newSupplierForm.contactPhone || ''}
                                        onChange={e => setNewSupplierForm({ ...newSupplierForm, contactPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Tax/VAT ID *</label>
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm outline-none focus:border-violet-500/50 transition-colors"
                                        placeholder="VAT/TIN registration"
                                        value={newSupplierForm.taxId || ''}
                                        onChange={e => setNewSupplierForm({ ...newSupplierForm, taxId: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Address</label>
                                    <input
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm outline-none focus:border-violet-500/50 transition-colors"
                                        placeholder="Billing address"
                                        value={newSupplierForm.address || ''}
                                        onChange={e => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1 block">Payment Terms *</label>
                                <input
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-200 text-sm outline-none focus:border-violet-500/50 transition-colors"
                                    placeholder="Net 30 / Net 45 / COD"
                                    value={newSupplierForm.paymentTerms || ''}
                                    onChange={e => setNewSupplierForm({ ...newSupplierForm, paymentTerms: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(newSupplierForm.complianceFlags?.halal)}
                                        onChange={e => setNewSupplierForm({
                                            ...newSupplierForm,
                                            complianceFlags: { ...newSupplierForm.complianceFlags, halal: e.target.checked } as Supplier['complianceFlags']
                                        })}
                                    />
                                    Halal Certified
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(newSupplierForm.complianceFlags?.zatca)}
                                        onChange={e => setNewSupplierForm({
                                            ...newSupplierForm,
                                            complianceFlags: { ...newSupplierForm.complianceFlags, zatca: e.target.checked } as Supplier['complianceFlags']
                                        })}
                                    />
                                    ZATCA Compliant
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(newSupplierForm.complianceFlags?.sustainable)}
                                        onChange={e => setNewSupplierForm({
                                            ...newSupplierForm,
                                            complianceFlags: { ...newSupplierForm.complianceFlags, sustainable: e.target.checked } as Supplier['complianceFlags']
                                        })}
                                    />
                                    Sustainable
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(newSupplierForm.complianceFlags?.isoCertified)}
                                        onChange={e => setNewSupplierForm({
                                            ...newSupplierForm,
                                            complianceFlags: { ...newSupplierForm.complianceFlags, isoCertified: e.target.checked } as Supplier['complianceFlags']
                                        })}
                                    />
                                    ISO Certified
                                </label>
                            </div>
                            {supplierErrors.length > 0 && (
                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 space-y-1">
                                    {supplierErrors.map((error, idx) => (
                                        <p key={idx} className="text-xs text-rose-400">{error}</p>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={handleSaveSupplier}
                                disabled={savingSupplier}
                                className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-violet-900/20 transition-all"
                            >
                                {savingSupplier ? 'Saving Supplier...' : 'Onboard Supplier'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Standard Footer */}
            <footer className="module-footer">
                <div className="flex items-center gap-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    <Activity className="w-3 h-3 text-emerald-500" /> Supply Chain Active
                    <div className="h-4 w-[1px] bg-zinc-800" />
                    <span>User: {currentUser?.fullName || 'Procurement'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-[9px] text-zinc-500 uppercase font-medium">Singularity Grand • Supply Core</div>
                </div>
            </footer>
        </div>
    );
};

const KPICard = ({ title, value, trend, icon, positive = true, inverse = false }: any) => (
    <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-5 group hover:border-zinc-700 transition">
        <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">{title}</div>
        <div className="text-2xl font-light text-zinc-100 mb-1">{value}</div>
        <div className={`text-xs font-bold inline-block px-2 py-0.5 rounded ${(positive && !inverse) || (!positive && inverse) ? 'bg-teal-500/10 text-teal-500' : 'bg-rose-500/10 text-rose-500'}`}>{trend}</div>
    </div>
);

export default ProcurementDashboard;
