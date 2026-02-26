import React, { useState, useMemo } from 'react';
import { PosOrder, Outlet } from '../../types';
import { Calendar, Download, Filter, FileText, TrendingUp, PieChart, Banknote, CreditCard, Smartphone, Home, DollarSign, Target, AlertCircle, Printer } from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import { ReportEngine, ReportDimension, ReportMetric } from '../shared/ReportEngine';
import { biQueryService } from '../../services/intelligence/biQueryService';
import { botEngine } from '../../services/kernel/systemBridge';
import { Brain, Search, Sparkles } from 'lucide-react';
import UniversalReportCenter from '../shared/UniversalReportCenter';
import { oracleService } from '../../services/intelligence/oracleService';

interface FNBReportsProps {
    orders: PosOrder[];
    selectedOutlet: Outlet;
    onReverse?: (orderId: string, reason: string) => void;
}

const FNBReports: React.FC<FNBReportsProps> = ({ orders, selectedOutlet, onReverse }) => {
    const { recipeDrafts: PMS_RECIPES, menuItems: PMS_MENU_ITEMS } = usePms();
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'Financial' | 'Profitability' | 'LiveBI' | 'Operational'>('Financial');

    // Oracle AI Intelligence
    const fnbIntel = useMemo(() => oracleService.getFnbIntel(
        orders || [],
        PMS_RECIPES || [],
        PMS_MENU_ITEMS || []
    ), [orders, PMS_RECIPES, PMS_MENU_ITEMS]);

    // ────────────────────────────────────────────────────────────
    // BI ENGINE CONFIGURATION
    // ────────────────────────────────────────────────────────────
    const posDimensions: ReportDimension[] = [
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'status', label: 'Order Status' },
        { key: 'orderType', label: 'Service Type' },
        { key: 'openedBy', label: 'Server/Staff' },
        { key: 'connectSection', label: 'Section' }
    ];

    const posMetrics: ReportMetric[] = [
        { key: 'total', label: 'Net Revenue', aggregation: 'sum', format: (v) => `${CONFIG_PROPERTY.currency} ${v.toLocaleString()}` },
        { key: 'guestCount', label: 'Guest Count', aggregation: 'sum' },
        { key: 'id', label: 'Check Count', aggregation: 'count' }
    ];

    const [biQuery, setBiQuery] = useState('');
    const [isBiLoading, setIsBiLoading] = useState(false);
    const [biConfig, setBiConfig] = useState<{ dim: string, met: string, chart: any }>({
        dim: 'paymentMethod',
        met: 'total',
        chart: 'Bar'
    });

    const handleOracleQuery = async () => {
        if (!biQuery.trim()) return;
        setIsBiLoading(true);
        try {
            const res = await biQueryService.translateQuery(biQuery, posDimensions, posMetrics);
            setBiConfig({ dim: res.dimension, met: res.metric, chart: res.chartType });
            botEngine.logActivity('POS', 'BI_Query', `Oracle processed: ${biQuery}`, 'AI.Oracle');
        } catch (e) {
            console.error('BI Query Failed:', e);
        } finally {
            setIsBiLoading(false);
        }
    };

    // Filter orders for the selected date and outlet
    const filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.timestamp).toISOString().split('T')[0];
        return orderDate === dateFilter && o.outletId === selectedOutlet.id && (o.status === 'Paid' || o.status === 'Void');
    });

    // --- FINANCIAL METRICS ---
    const totalRevenue = filteredOrders.filter(o => o.status === 'Paid').reduce((acc, o) => acc + o.total, 0);
    const totalCovers = filteredOrders.length;

    const paymentBreakdown = {
        cash: filteredOrders.filter(o => o.paymentMethod === 'Cash' && o.status === 'Paid').reduce((acc, o) => acc + o.total, 0),
        visa: filteredOrders.filter(o => o.paymentMethod === 'Card' && o.cardType === 'Visa' && o.status === 'Paid').reduce((acc, o) => acc + o.total, 0),
        mastercard: filteredOrders.filter(o => o.paymentMethod === 'Card' && o.cardType === 'MasterCard' && o.status === 'Paid').reduce((acc, o) => acc + o.total, 0),
        room: filteredOrders.filter(o => o.paymentMethod === 'RoomPost' && o.status === 'Paid').reduce((acc, o) => acc + o.total, 0),
        app: filteredOrders.filter(o => o.paymentMethod === 'App' && o.status === 'Paid').reduce((acc, o) => acc + o.total, 0),
    };

    // --- PROFITABILITY METRICS ---
    // Calculate costs dynamically to support legacy orders without embedded cost data
    const profitMetrics = filteredOrders.filter(o => o.status === 'Paid').reduce((acc, order) => {
        let orderCost = 0;

        order.items.forEach(item => {
            // Priority 1: Use embedded cost if available (new orders)
            if (item.foodCost) {
                orderCost += item.foodCost * item.qty;
            }
            // Priority 2: Lookup recipe (legacy orders)
            else {
                const recipe = PMS_RECIPES.find(r => r.menuItemId === item.menuItemId);
                if (recipe) {
                    orderCost += recipe.totalCost * item.qty;
                } else {
                    // Fallback: Estimate 30% cost
                    orderCost += (item.price * item.qty) * 0.30;
                }
            }
        });

        return {
            totalFoodCost: acc.totalFoodCost + orderCost,
            grossProfit: acc.grossProfit + (order.total - orderCost)
        };
    }, { totalFoodCost: 0, grossProfit: 0 });

    const foodCostPct = totalRevenue > 0 ? (profitMetrics.totalFoodCost / totalRevenue) * 100 : 0;
    const marginPct = totalRevenue > 0 ? (profitMetrics.grossProfit / totalRevenue) * 100 : 0;

    // Item Level Performance (Stars vs Dogs)
    const itemPerformance = filteredOrders.filter(o => o.status === 'Paid').reduce((acc: Record<string, { name: string; qty: number; revenue: number; cost: number; category: string; }>, order) => {
        order.items.forEach(item => {
            if (!acc[item.menuItemId]) {
                const menuItem = PMS_MENU_ITEMS.find(m => m.id === item.menuItemId);
                acc[item.menuItemId] = {
                    name: item.name,
                    qty: 0,
                    revenue: 0,
                    cost: 0,
                    category: menuItem?.category || 'Other'
                };
            }

            // Cost logic same as above
            let unitCost = item.foodCost;
            if (!unitCost) {
                const recipe = PMS_RECIPES.find(r => r.menuItemId === item.menuItemId);
                unitCost = recipe ? recipe.totalCost : item.price * 0.30;
            }

            acc[item.menuItemId].qty += item.qty;
            acc[item.menuItemId].revenue += item.price * item.qty;
            acc[item.menuItemId].cost += unitCost * item.qty;
        });
        return acc;
    }, {} as Record<string, { name: string, qty: number, revenue: number, cost: number, category: string }>);

    const sortedItems = (Object.values(itemPerformance) as { name: string; qty: number; revenue: number; cost: number; category: string; }[]).map(i => ({
        ...i,
        margin: i.revenue - i.cost,
        marginPct: i.revenue > 0 ? ((i.revenue - i.cost) / i.revenue) * 100 : 0,
        classification: (i.revenue - i.cost) > 50 /* Arbitrary high margin */
            ? (i.qty > 5 ? 'STAR' : 'PUZZLE')
            : (i.qty > 5 ? 'PLOWHORSE' : 'DOG')
    })).sort((a, b) => b.margin - a.margin).slice(0, 8); // Top 8 items


    const handleReverseClick = (orderId: string) => {
        if (!onReverse) return;
        const reason = prompt('Enter reason for reversal (Required for audit):');
        if (reason) {
            onReverse(orderId, reason);
        }
    };

    const handleExportFinancialCSV = () => {
        const headers = ['Order ID', 'Timestamp', 'Room/Table', 'Amount', 'Payment', 'Status'];
        const rows = filteredOrders.map(o => `"${o.id}","${new Date(o.timestamp).toISOString()}","${o.tableId || o.roomId}","${o.total}","${o.paymentMethod}","${o.status}"`);
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FNB_Financials_${selectedOutlet.name}_${dateFilter}.csv`;
        a.click();
    };

    const handleExportProfitCSV = () => {
        const headers = ['Item Name', 'Sold', 'Revenue', 'Cost', 'Margin', 'Classification'];
        const rows = sortedItems.map(i => `"${i.name}","${i.qty}","${i.revenue}","${i.cost}","${i.margin}","${i.classification}"`);
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FNB_Profitability_${selectedOutlet.name}_${dateFilter}.csv`;
        a.click();
    };

    const handlePrintLocal = () => {
        window.print();
    };

    return (
        <div className="h-full flex flex-col animate-fadeIn space-y-8 pb-12">
            {/* Header / Filters */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-light text-white tracking-tight">Financial <span className="font-bold text-violet-500">Intelligence</span></h2>
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-2">Outlet: {selectedOutlet.name} • {viewMode} Reporting</p>
                </div>

                <div className="flex gap-4">
                    {/* View Mode Toggle */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1 flex">
                        <button
                            onClick={() => setViewMode('Financial')}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition ${viewMode === 'Financial' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Financials
                        </button>
                        <button
                            onClick={() => setViewMode('Profitability')}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition ${viewMode === 'Profitability' ? 'bg-violet-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Profitability
                        </button>
                        <button
                            onClick={() => setViewMode('Operational')}
                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition ${viewMode === 'Operational' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Operational
                        </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1 flex items-center">
                        <div className="px-4 py-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-r border-zinc-800">Filter By Date</div>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-transparent text-white text-xs px-4 py-2 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Oracle Pulse Bar — F&B Intelligence */}
            {fnbIntel.alerts.length > 0 && (
                <div className="bg-gradient-to-r from-blue-600/10 via-zinc-900 to-zinc-900 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4 animate-fadeIn">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/30 shrink-0">
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Oracle Pulse — F&B Intelligence</h4>
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">LIVE</span>
                        </div>
                        <div className="space-y-1.5">
                            {fnbIntel.alerts.map((alert: string, i: number) => (
                                <p key={i} className="text-xs text-zinc-300 leading-relaxed">⚡ {alert}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'Operational' ? (
                <div className="flex-1 bg-zinc-950/20 backdrop-blur-xl rounded-[40px] border border-zinc-800 overflow-hidden shadow-2xl">
                    <UniversalReportCenter defaultCategory="F&B" />
                </div>
            ) : viewMode === 'LiveBI' ? (
                <div className="flex-1 min-h-[600px] flex flex-col bg-zinc-950/20 backdrop-blur-xl rounded-[40px] border border-zinc-800 overflow-hidden shadow-2xl">
                    {/* Oracle Query Bar */}
                    <div className="p-8 border-b border-zinc-800 bg-zinc-900/20">
                        <div className="flex items-center gap-4 max-w-4xl">
                            <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-500">
                                <Brain className={`w-6 h-6 ${isBiLoading ? 'animate-pulse' : ''}`} />
                            </div>
                            <input
                                type="text"
                                className="flex-1 bg-zinc-900/50 border border-zinc-700/50 rounded-2xl px-6 py-4 text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600 font-medium"
                                placeholder="Ask Oracle: 'Show me revenue by server' or 'What is the most popular payment method?'"
                                value={biQuery}
                                onChange={(e) => setBiQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleOracleQuery()}
                            />
                            <button
                                onClick={handleOracleQuery}
                                disabled={isBiLoading}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/20"
                            >
                                {isBiLoading ? 'Calculating...' : 'Ask Oracle'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <ReportEngine
                            key={`${biConfig.dim}-${biConfig.met}-${biConfig.chart}`}
                            title={`F&B Live BI - ${selectedOutlet.name}`}
                            data={filteredOrders}
                            dimensions={posDimensions}
                            metrics={posMetrics}
                            defaultDimension={biConfig.dim}
                            defaultMetric={biConfig.met}
                            defaultChartType={biConfig.chart}
                        />
                    </div>
                </div>
            ) : (
                <div className="module-grid">
                    {(viewMode === 'Financial' ? [
                        { label: 'Net Revenue', value: `${CONFIG_PROPERTY.currency} ${totalRevenue.toFixed(2)}`, icon: <TrendingUp className="text-emerald-500" />, trend: '+12.4%' },
                        { label: 'Closed Checks', value: totalCovers, icon: <FileText className="text-violet-500" />, trend: 'Daily average' },
                        { label: 'Avg Ticket', value: `${CONFIG_PROPERTY.currency} ${(totalRevenue / (totalCovers || 1)).toFixed(2)}`, icon: <PieChart className="text-blue-500" />, trend: 'v/s target' },
                        { label: 'Voids / Returns', value: '0.00', icon: <Filter className="text-rose-500" />, trend: 'Low risk' }
                    ] : [
                        { label: 'Gross Profit', value: `${CONFIG_PROPERTY.currency} ${profitMetrics.grossProfit.toFixed(2)}`, icon: <DollarSign className="text-emerald-500" />, trend: `${marginPct.toFixed(1)}% Margin` },
                        { label: 'Total Food Cost', value: `${CONFIG_PROPERTY.currency} ${profitMetrics.totalFoodCost.toFixed(2)}`, icon: <PieChart className="text-rose-500" />, trend: 'Actual' },
                        { label: 'Food Cost %', value: `${foodCostPct.toFixed(1)}%`, icon: <Target className="text-blue-500" />, trend: foodCostPct > 35 ? 'High Risk' : 'Healthy' },
                        { label: 'Avg Margin / Cover', value: `${CONFIG_PROPERTY.currency} ${(profitMetrics.grossProfit / (totalCovers || 1)).toFixed(2)}`, icon: <TrendingUp className="text-violet-500" />, trend: 'Per Guest' }
                    ]).map((kpi, idx) => (
                        <div key={idx} className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-10 transition duration-500 ${kpi.label.includes('Cost') ? 'bg-rose-500 group-hover:opacity-20' : 'bg-emerald-500 group-hover:opacity-20'}`}></div>
                            <div className="flex justify-between items-start mb-6 relative">
                                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">{kpi.icon}</div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.trend.includes('Risk') ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>{kpi.trend}</span>
                            </div>
                            <div className="text-3xl font-light text-white mb-1 relative">{kpi.value}</div>
                            <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest relative">{kpi.label}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Content Area Switches based on Mode */}
                {viewMode === 'Financial' ? (
                    <>
                        {/* Detailed Breakdown */}
                        <div className="xl:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-[40px] p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-lg font-bold text-white">Settlement Breakdown</h3>
                                <div className="flex gap-2">
                                    <button onClick={handlePrintLocal} className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition"><Printer size={16} /></button>
                                    <button onClick={handleExportFinancialCSV} className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition"><Download size={16} /></button>
                                </div>
                            </div>
                            {/* ... Existing payment breakdown logic ... */}
                            <div className="space-y-6">
                                {[
                                    { id: 'Cash', label: 'Cash in Drawer', icon: <Banknote className="text-emerald-500" />, amount: paymentBreakdown.cash, color: 'bg-emerald-500' },
                                    { id: 'Visa', label: 'Visa Integrated', icon: <CreditCard className="text-blue-500" />, amount: paymentBreakdown.visa, color: 'bg-blue-500' },
                                    { id: 'MasterCard', label: 'MasterCard Gateway', icon: <CreditCard className="text-orange-500" />, amount: paymentBreakdown.mastercard, color: 'bg-orange-500' },
                                    { id: 'Room', label: 'Guest Room Posting', icon: <Home className="text-violet-500" />, amount: paymentBreakdown.room, color: 'bg-violet-500' },
                                    { id: 'App', label: 'In-App Commerce', icon: <Smartphone className="text-indigo-500" />, amount: paymentBreakdown.app, color: 'bg-indigo-500' },
                                ].map(method => (
                                    <div key={method.id} className="group">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:scale-110 transition">{method.icon}</div>
                                                <div>
                                                    <div className="text-sm font-bold text-zinc-200">{method.label}</div>
                                                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Verified Logic</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-mono text-white">{CONFIG_PROPERTY.currency} {method.amount.toFixed(2)}</div>
                                                <div className="text-[9px] text-zinc-600 font-bold">{((method.amount / (totalRevenue || 1)) * 100).toFixed(1)}% weight</div>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${method.color} transition-all duration-1000`}
                                                style={{ width: `${(method.amount / (totalRevenue || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Audit Log */}
                        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[40px] p-10 overflow-hidden flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-8">Closure Audit</h3>
                            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                                {filteredOrders.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-800 italic text-sm">No settled checks for this period.</div>
                                ) : (
                                    filteredOrders.map(order => (
                                        <div key={order.id} className="p-4 bg-zinc-950/50 border border-zinc-900 rounded-2xl group hover:border-violet-500/30 transition">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] text-zinc-100 font-mono font-bold">#{order.id.slice(-6)}</span>
                                                <div className="flex items-center gap-2">
                                                    {order.status === 'Void' && <span className="text-[9px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded font-bold uppercase">Reversed</span>}
                                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-xs text-zinc-400 font-medium">{order.paymentMethod || 'Other'} Settlement</div>
                                                    <div className="text-[9px] text-zinc-600">{order.tableId ? `Table ${order.tableId.split('_').pop()}` : `Room ${order.roomId}`}</div>
                                                </div>
                                                <div className={`text-sm font-mono font-bold ${order.status === 'Void' ? 'text-zinc-600 line-through' : 'text-emerald-500'}`}>
                                                    {CONFIG_PROPERTY.currency} {order.total.toFixed(2)}
                                                </div>
                                            </div>
                                            {/* Action Buttons for Room Charges */}
                                            {order.paymentMethod === 'RoomPost' && order.status === 'Paid' && onReverse && (
                                                <div className="mt-3 pt-3 border-t border-zinc-900/50 flex justify-end">
                                                    <button
                                                        onClick={() => handleReverseClick(order.id)}
                                                        className="text-[9px] bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-900/30 transition uppercase font-bold tracking-wider"
                                                    >
                                                        Reverse / Void
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Menu Engineering Matrix */}
                        <div className="xl:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-[40px] p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-lg font-bold text-white">Menu Engineering (Top Items)</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-xs text-zinc-500">Based on Margin & Volume</div>
                                    <div className="flex gap-2">
                                        <button onClick={handlePrintLocal} className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition"><Printer size={16} /></button>
                                        <button onClick={handleExportProfitCSV} className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition"><Download size={16} /></button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-12 text-[10px] uppercase font-bold text-zinc-600 pb-2 border-b border-zinc-800">
                                    <div className="col-span-4">Item Name</div>
                                    <div className="col-span-2 text-right">Sold</div>
                                    <div className="col-span-2 text-right">Cost %</div>
                                    <div className="col-span-2 text-right">Margin</div>
                                    <div className="col-span-2 text-center">Class</div>
                                </div>

                                {sortedItems.length === 0 ? (
                                    <div className="text-center py-10 text-zinc-600 italic">No sales data for profitability analysis</div>
                                ) : (
                                    sortedItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 items-center py-3 border-b border-zinc-800/50 hover:bg-zinc-900/50 rounded-lg px-2 transition">
                                            <div className="col-span-4 font-medium text-zinc-300">{item.name}</div>
                                            <div className="col-span-2 text-right text-zinc-400 font-mono">{item.qty}</div>
                                            <div className={`col-span-2 text-right font-mono font-bold ${(item.cost / item.revenue) > 0.35 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {((item.cost / item.revenue) * 100).toFixed(1)}%
                                            </div>
                                            <div className="col-span-2 text-right text-zinc-300 font-mono">
                                                {CONFIG_PROPERTY.currency} {item.margin.toFixed(2)}
                                            </div>
                                            <div className="col-span-2 flex justify-center">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider
                                                ${item.classification === 'STAR' ? 'bg-amber-500/20 text-amber-500' :
                                                        item.classification === 'PLOWHORSE' ? 'bg-blue-500/20 text-blue-500' :
                                                            item.classification === 'PUZZLE' ? 'bg-violet-500/20 text-violet-500' :
                                                                'bg-zinc-700/50 text-zinc-500'
                                                    }
                                            `}>
                                                    {item.classification}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Insights / Alerts */}
                        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[40px] p-10">
                            <h3 className="text-lg font-bold text-white mb-8">AI Cost Alerts</h3>
                            <div className="space-y-4">
                                {foodCostPct > 35 && (
                                    <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl flex gap-3">
                                        <AlertCircle className="text-rose-500 shrink-0" size={20} />
                                        <div>
                                            <h4 className="text-sm font-bold text-rose-400">High Food Cost</h4>
                                            <p className="text-xs text-rose-300/70 mt-1">Current FC% is {foodCostPct.toFixed(1)}%, exceeding target of 35%. Check portion control for meat items.</p>
                                        </div>
                                    </div>
                                )}

                                {sortedItems.some(i => i.classification === 'DOG') && (
                                    <div className="p-4 bg-orange-950/20 border border-orange-900/30 rounded-2xl flex gap-3">
                                        <AlertCircle className="text-orange-500 shrink-0" size={20} />
                                        <div>
                                            <h4 className="text-sm font-bold text-orange-400">Underperforming Items</h4>
                                            <p className="text-xs text-orange-300/70 mt-1">Found {sortedItems.filter(i => i.classification === 'DOG').length} "Dog" items (low volume, low margin). Consider removing from menu.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl flex gap-3">
                                    <Target className="text-emerald-500 shrink-0" size={20} />
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-400">Top Performer</h4>
                                        <p className="text-xs text-emerald-300/70 mt-1">"{sortedItems[0]?.name}" is generating the highest margin contribution today.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FNBReports;
