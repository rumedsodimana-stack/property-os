
import React, { useState, useMemo } from 'react';
import {
  Warehouse, Package, ClipboardList, ArrowDownToLine, ArrowUpFromLine,
  Search, Plus, X, CheckCircle, Clock, AlertTriangle, Filter,
  BarChart3, TrendingDown, TrendingUp, FileText, RefreshCw,
  Thermometer, ShieldCheck, ChevronRight, Eye, Printer, Download
} from 'lucide-react';
import type {
  StoreItem, ReceivingRecord, Requisition, IssueRecord, StockTakeEntry,
  StoreCategory, RequisitionStatus, ReceivingStatus, StockTakeStatus
} from '../../../types/stores';

// ────────────────────────────────────────────────────────────
// MOCK DATA SEEDS
// ────────────────────────────────────────────────────────────

const MOCK_STORE_ITEMS: StoreItem[] = [
  {
    id: 'si_1', sku: 'FD-001', name: 'Basmati Rice (Premium)', category: 'Food', unit: 'kg',
    storageCondition: 'Dry', location: 'Bin A-12', currentStock: 120, minimumStock: 50, maximumStock: 300,
    reorderPoint: 75, costPerUnit: 3.50, lastReceived: Date.now() - 5 * 86400000, lastIssued: Date.now() - 86400000,
    avgMonthlyUsage: 180, supplierId: 'sup_1', supplierName: 'Al-Salam Foods', isPerishable: false, isHalal: true
  },
  {
    id: 'si_2', sku: 'BV-010', name: 'Fresh Orange Juice (1L)', category: 'Beverage', unit: 'bottle',
    storageCondition: 'Chilled', location: 'Cold Store B-3', currentStock: 45, minimumStock: 30, maximumStock: 150,
    reorderPoint: 40, costPerUnit: 4.20, lastReceived: Date.now() - 2 * 86400000, lastIssued: Date.now() - 43200000,
    avgMonthlyUsage: 220, supplierName: 'Fresh Valley Co.', isPerishable: true, expiryDate: '2026-04-08'
  },
  {
    id: 'si_3', sku: 'HK-025', name: 'Bath Towels (White, 700gsm)', category: 'Linen', unit: 'pc',
    storageCondition: 'Dry', location: 'Linen Store C-1', currentStock: 450, minimumStock: 200, maximumStock: 800,
    reorderPoint: 250, costPerUnit: 12.00, lastReceived: Date.now() - 30 * 86400000,
    avgMonthlyUsage: 60, supplierName: 'Gulf Textiles', isPerishable: false
  },
  {
    id: 'si_4', sku: 'GS-005', name: 'Shampoo Bottles (Guest Size)', category: 'Guest Supplies', unit: 'pc',
    storageCondition: 'Ambient', location: 'Amenity Store D-2', currentStock: 800, minimumStock: 300, maximumStock: 2000,
    reorderPoint: 500, costPerUnit: 1.80, lastReceived: Date.now() - 15 * 86400000, lastIssued: Date.now() - 86400000,
    avgMonthlyUsage: 600, supplierName: 'Luxury Amenities Ltd.', isPerishable: false
  },
  {
    id: 'si_5', sku: 'CH-003', name: 'Floor Cleaning Solution (5L)', category: 'Chemical', unit: 'can',
    storageCondition: 'Hazardous', location: 'Chemical Store E-1', currentStock: 12, minimumStock: 8, maximumStock: 30,
    reorderPoint: 10, costPerUnit: 18.50, avgMonthlyUsage: 8, supplierName: 'CleanPro Industries', isPerishable: false
  },
  {
    id: 'si_6', sku: 'FD-045', name: 'Fresh Salmon Fillets', category: 'Food', unit: 'kg',
    storageCondition: 'Frozen', location: 'Freezer A-2', currentStock: 15, minimumStock: 20, maximumStock: 60,
    reorderPoint: 25, costPerUnit: 42.00, lastReceived: Date.now() - 3 * 86400000,
    avgMonthlyUsage: 35, supplierName: 'Ocean Fresh Seafood', isPerishable: true, expiryDate: '2026-04-15', isHalal: true
  },
  {
    id: 'si_7', sku: 'EN-012', name: 'LED Light Bulbs (12W)', category: 'Engineering', unit: 'pc',
    storageCondition: 'Dry', location: 'Engineering Store F-4', currentStock: 85, minimumStock: 30, maximumStock: 200,
    reorderPoint: 50, costPerUnit: 5.60, avgMonthlyUsage: 25, supplierName: 'ElectroParts Co.', isPerishable: false
  },
  {
    id: 'si_8', sku: 'ST-001', name: 'A4 Copy Paper (Ream)', category: 'Stationery', unit: 'ream',
    storageCondition: 'Dry', location: 'Stationery Store G-1', currentStock: 35, minimumStock: 20, maximumStock: 100,
    reorderPoint: 30, costPerUnit: 6.50, avgMonthlyUsage: 18, supplierName: 'Office Depot ME', isPerishable: false
  }
];

const MOCK_RECEIVING: ReceivingRecord[] = [
  {
    id: 'rcv_1', poNumber: 'PO-2026-0145', supplierName: 'Al-Salam Foods', supplierId: 'sup_1',
    receivedDate: Date.now() - 5 * 86400000, receivedBy: 'Hassan Ali', status: 'Accepted',
    items: [
      { itemId: 'si_1', itemName: 'Basmati Rice (Premium)', orderedQty: 100, receivedQty: 100, acceptedQty: 100, rejectedQty: 0, unitCost: 3.50 },
      { itemId: 'si_6', itemName: 'Fresh Salmon Fillets', orderedQty: 20, receivedQty: 18, acceptedQty: 18, rejectedQty: 0, batchNumber: 'SAL-0401', expiryDate: '2026-04-15', temperature: -18, unitCost: 42.00 }
    ],
    invoiceNumber: 'INV-AS-4521', invoiceAmount: 1106.00, qualityCheckPassed: true
  },
  {
    id: 'rcv_2', poNumber: 'PO-2026-0148', supplierName: 'Fresh Valley Co.', supplierId: 'sup_2',
    receivedDate: Date.now() - 2 * 86400000, receivedBy: 'Maria Santos', status: 'Partial Accept',
    items: [
      { itemId: 'si_2', itemName: 'Fresh Orange Juice (1L)', orderedQty: 60, receivedQty: 55, acceptedQty: 50, rejectedQty: 5, rejectionReason: '5 bottles with broken seals', batchNumber: 'OJ-0330', expiryDate: '2026-04-08', temperature: 4, unitCost: 4.20 }
    ],
    invoiceNumber: 'INV-FV-7890', invoiceAmount: 231.00, qualityCheckPassed: false,
    notes: 'Notified supplier regarding damaged items. Credit note requested.'
  },
  {
    id: 'rcv_3', poNumber: 'PO-2026-0150', supplierName: 'Luxury Amenities Ltd.', supplierId: 'sup_3',
    receivedDate: Date.now() - 86400000, receivedBy: 'Hassan Ali', status: 'Pending',
    items: [
      { itemId: 'si_4', itemName: 'Shampoo Bottles (Guest Size)', orderedQty: 500, receivedQty: 500, acceptedQty: 0, rejectedQty: 0, unitCost: 1.80 }
    ],
    invoiceNumber: 'INV-LA-3345', invoiceAmount: 900.00, qualityCheckPassed: true
  }
];

const MOCK_REQUISITIONS: Requisition[] = [
  {
    id: 'req_1', requestNumber: 'REQ-2026-0201', department: 'F&B Kitchen', requestedBy: 'Chef Karim',
    requestDate: Date.now() - 3600000, requiredDate: Date.now() + 86400000, status: 'Submitted', priority: 'Urgent',
    items: [
      { itemId: 'si_1', itemName: 'Basmati Rice (Premium)', requestedQty: 25, unit: 'kg', costPerUnit: 3.50 },
      { itemId: 'si_6', itemName: 'Fresh Salmon Fillets', requestedQty: 5, unit: 'kg', costPerUnit: 42.00 }
    ],
    totalCost: 297.50, costCenter: 'CC-FB-001'
  },
  {
    id: 'req_2', requestNumber: 'REQ-2026-0202', department: 'Housekeeping', requestedBy: 'Supervisor Aisha',
    requestDate: Date.now() - 7200000, requiredDate: Date.now() + 172800000, status: 'Approved', priority: 'Normal',
    items: [
      { itemId: 'si_3', itemName: 'Bath Towels (White, 700gsm)', requestedQty: 50, unit: 'pc', costPerUnit: 12.00 },
      { itemId: 'si_4', itemName: 'Shampoo Bottles (Guest Size)', requestedQty: 100, unit: 'pc', costPerUnit: 1.80 }
    ],
    totalCost: 780.00, approvedBy: 'Stores Manager', approvedDate: Date.now() - 3600000, costCenter: 'CC-HK-001'
  },
  {
    id: 'req_3', requestNumber: 'REQ-2026-0203', department: 'F&B Bar', requestedBy: 'Bar Lead Ravi',
    requestDate: Date.now() - 14400000, requiredDate: Date.now() + 86400000, status: 'Issued', priority: 'Normal',
    items: [
      { itemId: 'si_2', itemName: 'Fresh Orange Juice (1L)', requestedQty: 20, issuedQty: 20, unit: 'bottle', costPerUnit: 4.20 }
    ],
    totalCost: 84.00, approvedBy: 'Stores Manager', issuedBy: 'Hassan Ali', issuedDate: Date.now() - 7200000, costCenter: 'CC-FB-002'
  },
  {
    id: 'req_4', requestNumber: 'REQ-2026-0204', department: 'Engineering', requestedBy: 'Eng. Supervisor John',
    requestDate: Date.now() - 28800000, requiredDate: Date.now() + 259200000, status: 'Draft', priority: 'Low',
    items: [
      { itemId: 'si_7', itemName: 'LED Light Bulbs (12W)', requestedQty: 20, unit: 'pc', costPerUnit: 5.60 }
    ],
    totalCost: 112.00, costCenter: 'CC-ENG-001'
  }
];

const MOCK_ISSUES: IssueRecord[] = [
  {
    id: 'iss_1', requisitionId: 'req_3', department: 'F&B Bar', issuedTo: 'Bar Lead Ravi',
    issuedBy: 'Hassan Ali', issueDate: Date.now() - 7200000,
    items: [
      { itemId: 'si_2', itemName: 'Fresh Orange Juice (1L)', issuedQty: 20, unit: 'bottle', costPerUnit: 4.20 }
    ],
    totalCost: 84.00
  },
  {
    id: 'iss_2', requisitionId: 'req_prev_1', department: 'Housekeeping', issuedTo: 'Floor Supervisor Leila',
    issuedBy: 'Maria Santos', issueDate: Date.now() - 86400000,
    items: [
      { itemId: 'si_4', itemName: 'Shampoo Bottles (Guest Size)', issuedQty: 80, unit: 'pc', costPerUnit: 1.80 },
      { itemId: 'si_3', itemName: 'Bath Towels (White, 700gsm)', issuedQty: 20, unit: 'pc', costPerUnit: 12.00 }
    ],
    totalCost: 384.00
  }
];

const MOCK_STOCK_TAKES: StockTakeEntry[] = [
  {
    id: 'st_1', scheduledDate: '2026-03-31', conductedDate: '2026-03-31', status: 'Completed',
    category: 'Food', conductedBy: ['Hassan Ali', 'Maria Santos'], approvedBy: 'Stores Manager',
    items: [
      { itemId: 'si_1', itemName: 'Basmati Rice (Premium)', systemQty: 125, physicalQty: 120, variance: -5, varianceValue: -17.50, varianceReason: 'Spillage during portioning', unit: 'kg', costPerUnit: 3.50 },
      { itemId: 'si_6', itemName: 'Fresh Salmon Fillets', systemQty: 16, physicalQty: 15, variance: -1, varianceValue: -42.00, varianceReason: 'Shrinkage/defrost loss', unit: 'kg', costPerUnit: 42.00 }
    ],
    totalVarianceValue: -59.50, totalItems: 2, accuracyPercentage: 96.5
  },
  {
    id: 'st_2', scheduledDate: '2026-04-01', status: 'Planned',
    category: 'Beverage', conductedBy: ['Hassan Ali'],
    items: [],
    totalVarianceValue: 0, totalItems: 0, accuracyPercentage: 0,
    notes: 'Monthly beverage stock take scheduled'
  }
];

// ────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ────────────────────────────────────────────────────────────

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${color}`}>
    {label}
  </span>
);

const stockLevelColor = (current: number, min: number, reorder: number): string => {
  if (current <= min) return 'text-red-400';
  if (current <= reorder) return 'text-amber-400';
  return 'text-emerald-400';
};

const stockLevelBadge = (current: number, min: number, reorder: number): { label: string; color: string } => {
  if (current <= min) return { label: 'Critical', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (current <= reorder) return { label: 'Low', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  return { label: 'OK', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
};

const reqStatusColor = (s: RequisitionStatus): string => {
  switch (s) {
    case 'Draft': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    case 'Submitted': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Partially Issued': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'Issued': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'Cancelled': return 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20';
  }
};

const rcvStatusColor = (s: ReceivingStatus): string => {
  switch (s) {
    case 'Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'Inspected': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Accepted': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'Partial Accept': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  }
};

const formatTimeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const storageConditionIcon = (c: string) => {
  switch (c) {
    case 'Chilled': case 'Frozen': return <Thermometer size={12} className="text-blue-400" />;
    case 'Hazardous': return <AlertTriangle size={12} className="text-red-400" />;
    default: return <Package size={12} className="text-zinc-500" />;
  }
};

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

type StoresTab = 'Central Inventory' | 'Receiving' | 'Requisitions' | 'Issuing' | 'Stock Take' | 'Reports';

const StoresDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StoresTab>('Central Inventory');
  const [searchTerm, setSearchTerm] = useState('');

  // Data state
  const [storeItems] = useState<StoreItem[]>(MOCK_STORE_ITEMS);
  const [receivingRecords] = useState<ReceivingRecord[]>(MOCK_RECEIVING);
  const [requisitions, setRequisitions] = useState<Requisition[]>(MOCK_REQUISITIONS);
  const [issueRecords] = useState<IssueRecord[]>(MOCK_ISSUES);
  const [stockTakes] = useState<StockTakeEntry[]>(MOCK_STOCK_TAKES);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<StoreCategory | 'All'>('All');

  // ── Computed KPIs ────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalItems = storeItems.length;
    const criticalStock = storeItems.filter(i => i.currentStock <= i.minimumStock).length;
    const lowStock = storeItems.filter(i => i.currentStock > i.minimumStock && i.currentStock <= i.reorderPoint).length;
    const totalInventoryValue = storeItems.reduce((s, i) => s + (i.currentStock * i.costPerUnit), 0);
    const pendingReceiving = receivingRecords.filter(r => r.status === 'Pending').length;
    const pendingRequisitions = requisitions.filter(r => r.status === 'Submitted').length;
    const todayIssues = issueRecords.filter(i => Date.now() - i.issueDate < 86400000).length;
    const perishableAlerts = storeItems.filter(i => i.isPerishable && i.expiryDate && new Date(i.expiryDate) < new Date(Date.now() + 7 * 86400000)).length;
    return { totalItems, criticalStock, lowStock, totalInventoryValue, pendingReceiving, pendingRequisitions, todayIssues, perishableAlerts };
  }, [storeItems, receivingRecords, requisitions, issueRecords]);

  // ── Tab Content Renderers ───────────────────────────────

  const renderCentralInventory = () => {
    const filtered = storeItems
      .filter(i => categoryFilter === 'All' || i.category === categoryFilter)
      .filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.location.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const categories: StoreCategory[] = ['Food', 'Beverage', 'Housekeeping', 'Engineering', 'Guest Supplies', 'Stationery', 'Linen', 'Chemical'];

    return (
      <div className="space-y-6">
        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-zinc-500" />
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${categoryFilter === 'All' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${categoryFilter === cat ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Inventory Table */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Item</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest hidden md:table-cell">SKU</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Stock</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Location</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Storage</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest hidden xl:table-cell">Avg Usage/Mo</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Value</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const level = stockLevelBadge(item.currentStock, item.minimumStock, item.reorderPoint);
                return (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-zinc-100 font-medium text-xs">{item.name}</div>
                      <div className="text-[10px] text-zinc-500">{item.category} &middot; {item.supplierName || 'No supplier'}</div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-[10px] font-mono text-zinc-400">{item.sku}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${stockLevelColor(item.currentStock, item.minimumStock, item.reorderPoint)}`}>
                        {item.currentStock}
                      </span>
                      <span className="text-zinc-600 text-[10px]"> / {item.maximumStock} {item.unit}</span>
                      {/* Stock bar */}
                      <div className="w-full bg-zinc-800 rounded-full h-1 mt-1">
                        <div
                          className={`h-1 rounded-full transition-all ${item.currentStock <= item.minimumStock ? 'bg-red-500' : item.currentStock <= item.reorderPoint ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min((item.currentStock / item.maximumStock) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-[10px] text-zinc-400">{item.location}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        {storageConditionIcon(item.storageCondition)}
                        <span className="text-[10px] text-zinc-400">{item.storageCondition}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden xl:table-cell text-[10px] text-zinc-400">{item.avgMonthlyUsage} {item.unit}</td>
                    <td className="px-5 py-3 text-[10px] text-zinc-300">${(item.currentStock * item.costPerUnit).toFixed(2)}</td>
                    <td className="px-5 py-3"><Badge label={level.label} color={level.color} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No items match your search.</div>
          )}
        </div>
      </div>
    );
  };

  const renderReceiving = () => {
    const filtered = receivingRecords.filter(r =>
      r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Receiving Cards */}
        <div className="space-y-3">
          {filtered.map(rcv => (
            <div key={rcv.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <ArrowDownToLine size={16} className="text-blue-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100">{rcv.poNumber}</span>
                      <Badge label={rcv.status} color={rcvStatusColor(rcv.status)} />
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {rcv.supplierName} &middot; Received by {rcv.receivedBy} &middot; {formatTimeAgo(rcv.receivedDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  {rcv.invoiceNumber && <span className="text-zinc-500">Inv: {rcv.invoiceNumber}</span>}
                  {rcv.invoiceAmount && <span className="text-emerald-400">${rcv.invoiceAmount.toFixed(2)}</span>}
                  {rcv.qualityCheckPassed ? (
                    <div className="flex items-center gap-1 text-emerald-400"><ShieldCheck size={12} /> QC Pass</div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-400"><AlertTriangle size={12} /> QC Issue</div>
                  )}
                </div>
              </div>
              {/* Items */}
              <div className="bg-zinc-950/50 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[10px] text-zinc-400">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest">Item</th>
                      <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest">Ordered</th>
                      <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest">Received</th>
                      <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest">Accepted</th>
                      <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest hidden md:table-cell">Rejected</th>
                      <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rcv.items.map((item, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-2 text-zinc-300">{item.itemName}</td>
                        <td className="px-4 py-2">{item.orderedQty}</td>
                        <td className="px-4 py-2">{item.receivedQty}</td>
                        <td className="px-4 py-2 text-emerald-400">{item.acceptedQty}</td>
                        <td className="px-4 py-2 hidden md:table-cell">
                          {item.rejectedQty > 0 ? <span className="text-red-400">{item.rejectedQty}</span> : '-'}
                        </td>
                        <td className="px-4 py-2 hidden lg:table-cell text-zinc-500">{item.batchNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rcv.notes && (
                <p className="text-[10px] text-zinc-500 mt-3 italic">{rcv.notes}</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No receiving records match your search.</div>
          )}
        </div>
      </div>
    );
  };

  const renderRequisitions = () => {
    const filtered = requisitions.filter(r =>
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Requisition Cards */}
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <ClipboardList size={16} className="text-violet-400" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-zinc-100">{req.requestNumber}</span>
                      <Badge label={req.status} color={reqStatusColor(req.status)} />
                      {req.priority === 'Urgent' && <Badge label="Urgent" color="bg-red-500/10 text-red-400 border-red-500/20" />}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {req.department} &middot; By {req.requestedBy} &middot; {formatTimeAgo(req.requestDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-zinc-500">Cost Center: {req.costCenter || 'N/A'}</span>
                  <span className="text-emerald-400 font-semibold">${req.totalCost.toFixed(2)}</span>
                </div>
              </div>
              {/* Items */}
              <div className="space-y-1.5 mb-3">
                {req.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-950/50 rounded-lg px-3 py-1.5">
                    <span className="text-[10px] text-zinc-300">{item.itemName}</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-zinc-400">{item.requestedQty} {item.unit}</span>
                      {item.issuedQty !== undefined && (
                        <span className="text-emerald-400">Issued: {item.issuedQty}</span>
                      )}
                      <span className="text-zinc-500">${(item.requestedQty * item.costPerUnit).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Actions */}
              {req.status === 'Submitted' && (
                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setRequisitions(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Approved', approvedBy: 'Stores Manager', approvedDate: Date.now() } : r))}
                    className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold hover:bg-emerald-500/20 transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRequisitions(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Rejected' } : r))}
                    className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold hover:bg-red-500/20 transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}
              {req.status === 'Approved' && (
                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setRequisitions(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Issued', issuedBy: 'Stores Clerk', issuedDate: Date.now(), items: r.items.map(it => ({ ...it, issuedQty: it.requestedQty })) } : r))}
                    className="px-4 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-[10px] font-bold hover:bg-violet-500/20 transition-all"
                  >
                    Issue Items
                  </button>
                </div>
              )}
              {/* Approval info */}
              {req.approvedBy && (
                <div className="text-[10px] text-zinc-500 mt-2">
                  Approved by {req.approvedBy} {req.approvedDate ? `&middot; ${formatTimeAgo(req.approvedDate)}` : ''}
                  {req.issuedBy && <> &middot; Issued by {req.issuedBy}</>}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No requisitions match your search.</div>
          )}
        </div>
      </div>
    );
  };

  const renderIssuing = () => {
    const filtered = issueRecords.filter(i =>
      i.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.issuedTo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          {filtered.map(issue => (
            <div key={issue.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <ArrowUpFromLine size={16} className="text-emerald-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100">Issue #{issue.id.replace('iss_', '')}</span>
                      <Badge label={issue.department} color="bg-zinc-800 text-zinc-400 border-zinc-700" />
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      To: {issue.issuedTo} &middot; By: {issue.issuedBy} &middot; {formatTimeAgo(issue.issueDate)}
                    </div>
                  </div>
                </div>
                <span className="text-emerald-400 text-sm font-semibold">${issue.totalCost.toFixed(2)}</span>
              </div>
              <div className="space-y-1.5">
                {issue.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-950/50 rounded-lg px-3 py-1.5">
                    <span className="text-[10px] text-zinc-300">{item.itemName}</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-zinc-400">{item.issuedQty} {item.unit}</span>
                      <span className="text-zinc-500">${(item.issuedQty * item.costPerUnit).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {issue.returnItems && issue.returnItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Returns</span>
                  {issue.returnItems.map((ret, i) => (
                    <div key={i} className="text-[10px] text-amber-400 mt-1">{ret.returnedQty} returned - {ret.reason}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">No issue records match your search.</div>
          )}
        </div>
      </div>
    );
  };

  const renderStockTake = () => (
    <div className="space-y-6">
      {stockTakes.map(st => (
        <div key={st.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw size={16} className="text-amber-400" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-100">Stock Take - {st.category || 'All Categories'}</span>
                  <Badge
                    label={st.status}
                    color={st.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                           st.status === 'Planned' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                           'bg-amber-500/10 text-amber-400 border-amber-500/20'}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Scheduled: {st.scheduledDate} &middot; Team: {st.conductedBy.join(', ')}
                  {st.approvedBy && <> &middot; Approved by: {st.approvedBy}</>}
                </div>
              </div>
            </div>
            {st.status === 'Completed' && (
              <div className="flex items-center gap-4 text-[10px]">
                <div className="text-center">
                  <div className={`text-lg font-light ${st.accuracyPercentage >= 98 ? 'text-emerald-400' : st.accuracyPercentage >= 95 ? 'text-amber-400' : 'text-red-400'}`}>
                    {st.accuracyPercentage}%
                  </div>
                  <div className="text-zinc-500 uppercase font-black tracking-widest">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-light ${st.totalVarianceValue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${Math.abs(st.totalVarianceValue).toFixed(2)}
                  </div>
                  <div className="text-zinc-500 uppercase font-black tracking-widest">Variance</div>
                </div>
              </div>
            )}
          </div>

          {st.items.length > 0 ? (
            <div className="bg-zinc-950/50 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[10px] text-zinc-400">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest">Item</th>
                    <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest">System</th>
                    <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest">Physical</th>
                    <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest">Variance</th>
                    <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest hidden md:table-cell">Value</th>
                    <th className="px-4 py-2 font-black text-zinc-500 uppercase tracking-widest hidden lg:table-cell">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {st.items.map((item, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2 text-zinc-300">{item.itemName}</td>
                      <td className="px-4 py-2">{item.systemQty} {item.unit}</td>
                      <td className="px-4 py-2">{item.physicalQty} {item.unit}</td>
                      <td className={`px-4 py-2 font-semibold ${item.variance < 0 ? 'text-red-400' : item.variance > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {item.variance > 0 ? '+' : ''}{item.variance}
                      </td>
                      <td className={`px-4 py-2 hidden md:table-cell ${item.varianceValue < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                        ${Math.abs(item.varianceValue).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 hidden lg:table-cell text-zinc-500">{item.varianceReason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-600 text-sm">
              {st.status === 'Planned' ? 'Stock take not yet started. Counts will appear here.' : 'No items recorded.'}
            </div>
          )}
          {st.notes && <p className="text-[10px] text-zinc-500 mt-3 italic">{st.notes}</p>}
        </div>
      ))}
    </div>
  );

  const renderReports = () => {
    const totalValue = storeItems.reduce((s, i) => s + i.currentStock * i.costPerUnit, 0);
    const categoryBreakdown = storeItems.reduce((acc, i) => {
      const cat = i.category;
      if (!acc[cat]) acc[cat] = { items: 0, value: 0 };
      acc[cat].items += 1;
      acc[cat].value += i.currentStock * i.costPerUnit;
      return acc;
    }, {} as Record<string, { items: number; value: number }>);

    const todayIssuedValue = issueRecords
      .filter(i => Date.now() - i.issueDate < 86400000)
      .reduce((s, i) => s + i.totalCost, 0);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
            <div className="text-2xl font-light text-white">${totalValue.toFixed(0)}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Total Inventory Value</div>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
            <div className="text-2xl font-light text-emerald-400">${todayIssuedValue.toFixed(0)}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Issued Today</div>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
            <div className="text-2xl font-light text-amber-400">{kpis.lowStock + kpis.criticalStock}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Reorder Alerts</div>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
            <div className="text-2xl font-light text-red-400">{kpis.perishableAlerts}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Expiry Alerts</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Inventory by Category</h3>
          <div className="space-y-3">
            {(Object.entries(categoryBreakdown) as [string, { items: number; value: number }][]).sort((a, b) => b[1].value - a[1].value).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-[10px] text-zinc-300 w-28">{cat}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-violet-500 h-2 rounded-full transition-all"
                      style={{ width: `${(data.value / totalValue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4 text-[10px]">
                  <span className="text-zinc-400">{data.items} items</span>
                  <span className="text-zinc-200 font-semibold w-20 text-right">${data.value.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items Below Reorder Point */}
        {(kpis.criticalStock + kpis.lowStock) > 0 && (
          <div className="bg-zinc-900/40 border border-red-500/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-red-300 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} /> Items Requiring Reorder
            </h3>
            <div className="space-y-2">
              {storeItems.filter(i => i.currentStock <= i.reorderPoint).map(item => {
                const level = stockLevelBadge(item.currentStock, item.minimumStock, item.reorderPoint);
                return (
                  <div key={item.id} className="flex items-center justify-between bg-zinc-950/50 rounded-lg px-4 py-2">
                    <div>
                      <span className="text-xs text-zinc-200">{item.name}</span>
                      <span className="text-[10px] text-zinc-500 ml-2">({item.sku})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold ${stockLevelColor(item.currentStock, item.minimumStock, item.reorderPoint)}`}>
                        {item.currentStock} / {item.reorderPoint} {item.unit}
                      </span>
                      <Badge label={level.label} color={level.color} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Tab Router ───────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'Central Inventory': return renderCentralInventory();
      case 'Receiving': return renderReceiving();
      case 'Requisitions': return renderRequisitions();
      case 'Issuing': return renderIssuing();
      case 'Stock Take': return renderStockTake();
      case 'Reports': return renderReports();
      default: return renderCentralInventory();
    }
  };

  const TABS: StoresTab[] = ['Central Inventory', 'Receiving', 'Requisitions', 'Issuing', 'Stock Take', 'Reports'];

  return (
    <div className="module-container bg-transparent flex flex-col h-full">
      {/* Header */}
      <header className="module-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
            <Warehouse className="w-6 h-6 text-orange-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-light text-white tracking-tight leading-none">Stores &amp; Inventory</h2>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Central Warehouse Management</div>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-wrap ml-auto min-w-0">
          {/* Tab bar */}
          <div className="flex items-center bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`min-w-[90px] px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeTab === tab ? 'bg-zinc-800 text-white shadow-xl shadow-black/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-shrink-0 w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-[10px] text-zinc-300 focus:border-violet-500/50 outline-none transition-all sm:focus:w-64"
            />
          </div>
        </div>
      </header>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-6">
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-white">{kpis.totalItems}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">SKUs</div>
        </div>
        <div className="bg-zinc-900/40 border border-red-500/10 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-red-400">{kpis.criticalStock}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Critical</div>
        </div>
        <div className="bg-zinc-900/40 border border-amber-500/10 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-amber-400">{kpis.lowStock}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Low Stock</div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-emerald-400">${(kpis.totalInventoryValue / 1000).toFixed(1)}k</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Value</div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-blue-400">{kpis.pendingReceiving}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Pending RCV</div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-violet-400">{kpis.pendingRequisitions}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Pending REQ</div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-emerald-400">{kpis.todayIssues}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Issues Today</div>
        </div>
        <div className="bg-zinc-900/40 border border-red-500/10 rounded-xl p-3 text-center">
          <div className="text-lg font-light text-red-400">{kpis.perishableAlerts}</div>
          <div className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Expiry Alert</div>
        </div>
      </div>

      {/* Main Content */}
      <main className="module-body">
        {renderContent()}
      </main>
    </div>
  );
};

export default StoresDashboard;
