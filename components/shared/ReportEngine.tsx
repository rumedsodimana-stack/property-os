import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
    AreaChart, Area
} from 'recharts';
import {
    Filter, Download, FileText, LayoutGrid, List,
    BarChart2, PieChart as PieChartIcon, Activity,
    Calendar, ChevronDown, Search, ArrowUpDown, Brain, Printer, AlertTriangle
} from 'lucide-react';

/**
 * Hotel Singularity OS — Universal BI & Reporting Engine
 * A highly dynamic component that can take any data array and 
 * perform on-the-fly aggregation, dimension slicing, and visualization.
 */

export interface ReportDimension {
    key: string;
    label: string;
}

export interface ReportMetric {
    key: string;
    label: string;
    format?: (val: number) => string;
    aggregation: 'sum' | 'count' | 'avg';
}

interface ReportEngineProps {
    title: string;
    data: any[];
    dimensions: ReportDimension[];
    metrics: ReportMetric[];
    defaultDimension?: string;
    defaultMetric?: string;
    defaultChartType?: 'Bar' | 'Line' | 'Pie' | 'Area';
    projectedData?: any[]; // Secondary data series for forecasting
    insights?: string[];  // Optional AI insights
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'];

export const ReportEngine: React.FC<ReportEngineProps> = ({
    title,
    data,
    dimensions,
    metrics,
    defaultDimension,
    defaultMetric,
    defaultChartType = 'Bar',
    projectedData,
    insights
}) => {
    const [selectedDimension, setSelectedDimension] = useState(defaultDimension || dimensions[0]?.key);
    const [selectedMetric, setSelectedMetric] = useState(defaultMetric || metrics[0]?.key);
    const [chartType, setChartType] = useState(defaultChartType);
    const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');
    const [filterText, setFilterText] = useState('');

    // ─── Data Transformation & Aggregation ─────────────────────────────

    const processedData = useMemo(() => {
        if (!data || !selectedDimension || !selectedMetric) return [];

        const metricConfig = metrics.find(m => m.key === selectedMetric);
        if (!metricConfig) return [];

        // 1. Group by Dimension
        const groups: Record<string, { label: string, values: number[] }> = {};

        data.forEach(item => {
            const dimValue = item[selectedDimension] || 'Unknown';
            if (!groups[dimValue]) {
                groups[dimValue] = { label: dimValue, values: [] };
            }
            const val = typeof item[selectedMetric] === 'number' ? item[selectedMetric] : 0;
            groups[dimValue].values.push(val);
        });

        // 2. Aggregate
        return Object.values(groups).map(g => {
            let aggregatedValue = 0;
            if (metricConfig.aggregation === 'sum') {
                aggregatedValue = g.values.reduce((a, b) => a + b, 0);
            } else if (metricConfig.aggregation === 'count') {
                aggregatedValue = g.values.length;
            } else if (metricConfig.aggregation === 'avg') {
                aggregatedValue = g.values.length > 0 ? g.values.reduce((a, b) => a + b, 0) / g.values.length : 0;
            }

            return {
                name: g.label,
                value: aggregatedValue,
                formattedValue: metricConfig.format ? metricConfig.format(aggregatedValue) : aggregatedValue.toFixed(2),
                isProjected: false
            };
        }).sort((a, b) => b.value - a.value);
    }, [data, selectedDimension, selectedMetric, metrics]);

    const finalChartData = useMemo(() => {
        if (!projectedData) return processedData;

        // Merge projected data into the visualization
        // Assume projectedData has keys matching dimensions and metrics
        const projectionGroups: Record<string, number> = {};
        projectedData.forEach(item => {
            const dimValue = item[selectedDimension] || 'Unknown';
            const val = typeof item[selectedMetric] === 'number' ? item[selectedMetric] : 0;
            projectionGroups[dimValue] = (projectionGroups[dimValue] || 0) + val;
        });

        const merged = [...processedData];
        Object.entries(projectionGroups).forEach(([name, projValue]) => {
            const existing = merged.find(d => d.name === name);
            if (existing) {
                (existing as any).projectedValue = projValue;
            } else {
                merged.push({
                    name,
                    value: 0,
                    projectedValue: projValue,
                    formattedValue: '0.00',
                    isProjected: true
                } as any);
            }
        });

        return merged;
    }, [processedData, projectedData, selectedDimension, selectedMetric]);

    // ─── Export Logic ──────────────────────────────────────────────────

    const handleExportCSV = () => {
        const dimLabel = dimensions.find(d => d.key === selectedDimension)?.label || selectedDimension;
        const metLabel = metrics.find(m => m.key === selectedMetric)?.label || selectedMetric;
        const headers = [dimLabel, metLabel];
        const rows = processedData.map(d => `"${d.name}","${d.value}"`);
        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handlePrint = () => {
        window.print();
    };

    // ─── Renderers ─────────────────────────────────────────────────────

    const renderChart = () => {
        const renderTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl">
                        <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">{label}</p>
                        <p className="text-sm font-mono text-zinc-100">
                            {metrics.find(m => m.key === selectedMetric)?.label}: {payload[0].payload.formattedValue}
                        </p>
                    </div>
                );
            }
            return null;
        };

        return (
            <ResponsiveContainer width="100%" height="100%">
                {chartType === 'Bar' ? (
                    <BarChart data={finalChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip content={renderTooltip} cursor={{ fill: '#ffffff05' }} />
                        <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                            {finalChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                        {projectedData && (
                            <Bar dataKey="projectedValue" stackId="a" fill="#3f3f46" stroke="#52525b" strokeDasharray="4 4" radius={[4, 4, 0, 0]} opacity={0.5} />
                        )}
                    </BarChart>
                ) : chartType === 'Area' ? (
                    <AreaChart data={finalChartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#52525b" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#52525b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
                        <YAxis stroke="#52525b" fontSize={10} />
                        <Tooltip content={renderTooltip} />
                        <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                        {projectedData && (
                            <Area type="monotone" dataKey="projectedValue" stroke="#52525b" strokeDasharray="5 5" fill="url(#colorProjected)" strokeWidth={1} />
                        )}
                    </AreaChart>
                ) : chartType === 'Pie' ? (
                    <PieChart>
                        <Pie
                            data={finalChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {finalChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={renderTooltip} />
                    </PieChart>
                ) : (
                    <LineChart data={finalChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
                        <YAxis stroke="#52525b" fontSize={10} />
                        <Tooltip content={renderTooltip} />
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} />
                        {projectedData && (
                            <Line type="monotone" dataKey="projectedValue" stroke="#52525b" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3, fill: '#3f3f46' }} />
                        )}
                    </LineChart>
                )}
            </ResponsiveContainer>
        );
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-zinc-800 bg-zinc-950/20 backdrop-blur">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <label className="text-[9px] uppercase font-bold text-zinc-500 mb-1 tracking-widest">Dimension</label>
                        <div className="relative">
                            <select
                                value={selectedDimension}
                                onChange={(e) => setSelectedDimension(e.target.value)}
                                className="appearance-none bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 pr-8 text-xs text-zinc-200 outline-none focus:border-violet-500/50 transition-all font-medium"
                            >
                                {dimensions.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-2 w-3 h-3 text-zinc-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[9px] uppercase font-bold text-zinc-500 mb-1 tracking-widest">Metric</label>
                        <div className="relative">
                            <select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                className="appearance-none bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 pr-8 text-xs text-zinc-200 outline-none focus:border-violet-500/50 transition-all font-medium"
                            >
                                {metrics.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-2 w-3 h-3 text-zinc-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    <button
                        onClick={() => setChartType('Bar')}
                        className={`p-1.5 rounded-lg transition ${chartType === 'Bar' ? 'bg-zinc-800 text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <BarChart2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setChartType('Line')}
                        className={`p-1.5 rounded-lg transition ${chartType === 'Line' ? 'bg-zinc-800 text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Activity className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setChartType('Pie')}
                        className={`p-1.5 rounded-lg transition ${chartType === 'Pie' ? 'bg-zinc-800 text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <PieChartIcon className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
                    <button
                        onClick={() => setViewMode('visual')}
                        className={`p-1.5 rounded-lg transition ${viewMode === 'visual' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-400 font-bold transition">
                        <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-400 font-bold transition">
                        <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden p-6 relative flex flex-col gap-6">
                {(projectedData || insights) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl">
                            <h3 className="text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">Forecast Confidence</h3>
                            <div className="flex items-center gap-3">
                                <div className="text-2xl font-light text-zinc-100 italic">88.4%</div>
                                <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-500 font-bold uppercase">High</div>
                            </div>
                        </div>
                        <div className="md:col-span-2 bg-violet-600/5 border border-violet-500/10 p-4 rounded-2xl flex flex-col justify-center">
                            <h3 className="text-[10px] uppercase font-bold text-violet-400/60 mb-2 tracking-widest flex items-center gap-2">
                                <Brain className="w-3 h-3" /> Oracle Insights
                            </h3>
                            <div className="text-xs text-zinc-300 font-medium">
                                {insights?.[0] || "Based on historical pickup patterns, we expect a 12% increase in RevPAR for the upcoming month."}
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex-1 relative">
                    {viewMode === 'visual' ? (
                        <div className="h-full w-full">
                            {processedData.length > 0 ? renderChart() : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-zinc-600 gap-3 border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20">
                                    <AlertTriangle className="w-8 h-8 opacity-20" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">No analytics data available</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full border border-zinc-800 rounded-2xl bg-zinc-950/30 overflow-hidden flex flex-col">
                            <div className="overflow-y-auto flex-1">
                                <table className="w-full text-left text-sm text-zinc-400">
                                    <thead className="bg-zinc-900/80 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest text-zinc-500">{dimensions.find(d => d.key === selectedDimension)?.label}</th>
                                            <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest text-zinc-500 text-right">{metrics.find(m => m.key === selectedMetric)?.label}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {processedData.length > 0 ? processedData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-900/30 transition">
                                                <td className="px-6 py-3 text-zinc-200 font-medium">{row.name}</td>
                                                <td className="px-6 py-3 text-right font-mono text-zinc-400">{row.formattedValue}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-12 text-center text-zinc-600 italic text-xs">
                                                    No tabular data matching these parameters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Interactive Oracle Chat Integration Placeholder */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex items-center gap-4">
                    <div className="p-2 bg-violet-600/10 rounded-lg">
                        <Brain className="w-4 h-4 text-violet-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Ask Oracle: 'Show me F&B revenue for rooftop by server'..."
                        className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-400 placeholder:text-zinc-600 font-medium"
                    />
                    <button className="text-[10px] uppercase font-black text-violet-500 tracking-widest hover:text-violet-400 transition">Query</button>
                </div>
            </div>
        </div>
    );
};
