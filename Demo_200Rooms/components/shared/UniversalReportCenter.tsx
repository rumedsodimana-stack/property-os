import React, { useState, useMemo } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { CURRENT_PROPERTY as CONFIG_PROPERTY } from '../../services/kernel/config';
import {
    FileText,
    Download,
    Printer,
    Search,
    Filter,
    ChevronRight,
    Clock,
    BarChart2,
    Calendar,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { REPORT_DEFINITIONS, ReportDefinition, ReportCategory } from '../../services/operations/reportDefinitions';

interface Props {
    defaultCategory?: ReportCategory;
}

const UniversalReportCenter: React.FC<Props> = ({ defaultCategory }) => {
    const pms = usePms();
    const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'All'>(defaultCategory || 'All');
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Default range: Today
    const todayStr = new Date().toISOString().split('T')[0];
    const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });

    // 1. Filtered Report List
    const availableReports = useMemo(() => {
        return REPORT_DEFINITIONS.filter(r => {
            const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
            const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchTerm]);

    const activeReport = useMemo(() =>
        REPORT_DEFINITIONS.find(r => r.id === selectedReportId),
        [selectedReportId]);

    // 2. Data Sourcing & Transformation
    const reportData = useMemo(() => {
        if (!activeReport) return [];

        const rawData = activeReport.dataSource === 'all'
            ? pms.rooms
            : (pms as any)[activeReport.dataSource] || [];

        return activeReport.transform(rawData, dateRange, pms);
    }, [activeReport, pms, dateRange]);

    // 3. Export Logic
    const handleExport = () => {
        if (!activeReport || reportData.length === 0) return;

        const headers = activeReport.columns.map(c => c.label);
        const rows = reportData.map(row =>
            activeReport.columns.map(c => `"${row[c.key] || ''}"`).join(',')
        );

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeReport.title.replace(/\s+/g, '_')}_${todayStr}.csv`;
        a.click();
    };

    const categories: { key: ReportCategory | 'All', label: string }[] = [
        { key: 'All', label: 'All Reports' },
        { key: 'FrontOffice', label: 'Front Office' },
        { key: 'Finance', label: 'Finance & Ledger' },
        { key: 'Housekeeping', label: 'Housekeeping' },
        { key: 'F&B', label: 'Food & Beverage' },
        { key: 'HumanResources', label: 'Human Resources' },
        { key: 'Executive', label: 'Executive & Strategy' },
        { key: 'Maintenance', label: 'Engineering' },
        { key: 'BrandStandards', label: 'Brand Standards' }
    ];

    const PrintHeader = () => (
        <div className="hidden report-print-header report-print-only flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center border border-zinc-200">
                    <BarChart2 className="w-8 h-8 text-zinc-900" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-black uppercase tracking-tighter">Hotel Singularity OS</h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{CONFIG_PROPERTY.name} • Internal Management Report</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Generated Metadata</p>
                <div className="space-y-0.5">
                    <p className="text-[10px] text-zinc-900 font-bold">DATE: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    <p className="text-[10px] text-zinc-900 font-bold">USER: SYSTEM_ADMIN_OS</p>
                    <p className="text-[10px] text-zinc-400">Ref: {activeReport?.id.toUpperCase()}_vM4</p>
                </div>
            </div>
        </div>
    );

    const AIInsightsPanel = () => {
        if (!activeReport || reportData.length === 0) return null;

        const isHighValue = ['Executive', 'Finance', 'FrontOffice'].includes(activeReport.category);
        if (!isHighValue) return null;

        return (
            <div className="mb-8 report-hide-on-print animate-fadeIn">
                <div className="bg-gradient-to-br from-violet-600/20 via-zinc-900 to-zinc-900 border border-violet-500/30 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Sparkles className="w-32 h-32 text-violet-400" />
                    </div>

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Oracle AI Insights</h3>
                                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded text-[9px] font-bold">ALPHA_M4</span>
                            </div>
                            <div className="text-xs text-zinc-300 leading-relaxed max-w-3xl space-y-2 font-medium">
                                <p>
                                    Based on the <span className="text-violet-400 font-bold">{activeReport.title}</span> data, the system detects
                                    {reportData.length > 5 ? ' stable operational volume' : ' low activity levels'} for this period.
                                </p>
                                {activeReport.id === 'flash_report' && (
                                    <p className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800 text-zinc-400 italic">
                                        💡 <span className="text-zinc-200 not-italic font-bold">STRATEGY:</span> Occupancy is trending {reportData[0]?.occupancy > 70 ? 'HIGH' : 'BELOW TARGET'}. Suggest {reportData[0]?.occupancy > 70 ? 'yield maximization by increasing public rate' : 'launching a geo-targeted flash sale to boost volume'}.
                                    </p>
                                )}
                                {activeReport.id === 'high_balance_report' && (
                                    <p className="text-rose-400 font-bold">
                                        ⚠️ ALERT: {reportData.length} folios are currently over-limit. Immediate credit verification required for Room {reportData[0]?.room}.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full bg-zinc-950 overflow-hidden report-print-container">
            {/* Sidebar: Categories & Search */}
            <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/20 report-hide-on-print">
                <div className="p-4 border-b border-zinc-800">
                    <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-400" /> Report Library
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Find a report..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-200 focus:border-violet-500/50 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <div className="px-3 py-2 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Categories</div>
                    {categories.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${selectedCategory === cat.key
                                ? 'bg-violet-600/10 text-violet-400 font-bold border border-violet-500/20'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}

                    <div className="mt-6 px-3 py-2 text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Available Reports</div>
                    {availableReports.map(report => (
                        <button
                            key={report.id}
                            onClick={() => setSelectedReportId(report.id)}
                            className={`group w-full text-left px-3 py-3 rounded-xl transition-all border ${selectedReportId === report.id
                                ? 'bg-zinc-800 border-zinc-700 shadow-lg'
                                : 'border-transparent hover:bg-zinc-800/50'
                                }`}
                        >
                            <div className={`text-xs font-medium mb-1 transition-colors ${selectedReportId === report.id ? 'text-white' : 'text-zinc-300'
                                }`}>
                                {report.title}
                            </div>
                            <div className="text-[10px] text-zinc-500 leading-relaxed group-hover:text-zinc-400">
                                {report.description}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-transparent">
                {!activeReport ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-12 text-center report-hide-on-print">
                        <div className="p-6 bg-zinc-900/40 rounded-full border border-zinc-800 mb-6 group opacity-50">
                            <FileText className="w-12 h-12 text-zinc-700 group-hover:text-violet-500/50 transition-colors" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-300 mb-2">Select a Report to Begin</h3>
                        <p className="max-w-xs text-xs leading-relaxed opacity-60">
                            Choose an operational or financial report from the library on the left to view detailed analytics and lists.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header & Controls */}
                        <div className="p-6 border-b border-zinc-800 flex flex-wrap items-end justify-between gap-6 bg-zinc-900/10 report-hide-on-print">
                            <div className="space-y-1">
                                <div className="text-[10px] uppercase font-bold text-violet-500 tracking-widest">{activeReport.category}</div>
                                <h1 className="text-xl font-bold text-white tracking-tight">{activeReport.title}</h1>
                                <p className="text-xs text-zinc-400">{activeReport.description}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                {activeReport.filterConfig.showDateRange && (
                                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                                        <div className="flex flex-col px-3">
                                            <label className="text-[9px] uppercase font-bold text-zinc-500">From</label>
                                            <input
                                                type="date"
                                                value={dateRange.start}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                                className="bg-transparent text-xs text-zinc-200 outline-none border-none [color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="w-[1px] h-6 bg-zinc-800" />
                                        <div className="flex flex-col px-3">
                                            <label className="text-[9px] uppercase font-bold text-zinc-500">To</label>
                                            <input
                                                type="date"
                                                value={dateRange.end}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                                className="bg-transparent text-xs text-zinc-200 outline-none border-none [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleExport}
                                        disabled={reportData.length === 0}
                                        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download className="w-3.5 h-3.5" /> CSV Export
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 transition-all"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Report Content */}
                        <div className="flex-1 overflow-auto p-4 md:p-10 bg-white/5 print:bg-white print:p-0">
                            <PrintHeader />
                            <AIInsightsPanel />

                            {/* Management Summary (Executive Reports) */}
                            {activeReport.category === 'Executive' && reportData.length > 0 && (
                                <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:mb-6">
                                    {activeReport.columns.filter(c => c.type === 'currency' || c.type === 'number').slice(0, 4).map(col => {
                                        const values = reportData.map(r => r[col.key] || 0);
                                        const sum = values.reduce((a, b) => a + b, 0);

                                        return (
                                            <div key={col.key} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 print:bg-white print:border-zinc-200">
                                                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">{col.label}</p>
                                                <p className="text-xl font-black text-white print:text-black">
                                                    {col.type === 'currency' ? `${CONFIG_PROPERTY.currency} ${sum.toLocaleString()}` : sum.toLocaleString()}
                                                </p>
                                                <p className="text-[9px] text-zinc-600 font-medium">System Total • {reportData.length} records</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="report-card-premium print:border-none print:shadow-none">
                                <table className="w-full text-left text-xs report-table-premium">
                                    <thead className="sticky top-0 z-20 print:static">
                                        <tr>
                                            {activeReport.columns.map(col => (
                                                <th
                                                    key={col.key}
                                                    className={`${col.align === 'right' ? 'text-right' : 'text-left'}`}
                                                >
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {reportData.length > 0 ? reportData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors group">
                                                {activeReport.columns.map(col => (
                                                    <td key={col.key} className={`${col.align === 'right' ? 'text-right' : ''}`}>
                                                        {col.type === 'currency' ? (
                                                            <span className="font-mono font-bold text-zinc-950">
                                                                {CONFIG_PROPERTY.currency} {row[col.key]?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        ) : col.type === 'status' ? (
                                                            <span className="badge badge-neutral bg-zinc-100 border-zinc-200 text-zinc-600">
                                                                {row[col.key]}
                                                            </span>
                                                        ) : (
                                                            <span className="text-zinc-600 font-medium">
                                                                {row[col.key]?.toString()}
                                                            </span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={activeReport.columns.length} className="px-4 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-40">
                                                        <div className="p-4 bg-zinc-100 rounded-full">
                                                            <Clock className="w-10 h-10 text-zinc-400" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-zinc-900 uppercase tracking-widest">No matching records</p>
                                                            <p className="text-[10px] text-zinc-500 max-w-[200px] mx-auto leading-relaxed">Adjust your date range or filters to see operational data.</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Print Footer */}
                            <div className="hidden report-print-only mt-8 text-[10px] text-zinc-400 font-medium flex items-center justify-between border-t border-zinc-100 pt-4">
                                <div>CONFIDENTIAL • HOTEL SINGULARITY OS v4.0</div>
                                <div>Page 1 of 1</div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UniversalReportCenter;
