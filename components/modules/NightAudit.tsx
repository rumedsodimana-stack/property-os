/**
 * Night Audit Dashboard Component
 * Real-time monitoring and manual trigger for night audit process
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, CheckCircle, XCircle, Clock, TrendingUp, DollarSign, Users, Sparkles, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { NightAuditService, getAuditHistory, getLatestStatistics, type AuditRun, type DailyStatistics } from '../../services/operations/nightAuditService';
import { ReportEngine, ReportDimension, ReportMetric } from '../shared/ReportEngine';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/kernel/firebase';
import { usePms } from '../../services/kernel/persistence';
import { oracleService } from '../../services/intelligence/oracleService';


export const NightAudit: React.FC = () => {
    const [currentAudit, setCurrentAudit] = useState<AuditRun | null>(null);
    const [auditHistory, setAuditHistory] = useState<AuditRun[]>([]);
    const [statistics, setStatistics] = useState<DailyStatistics | null>(null);
    const [allStats, setAllStats] = useState<any[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState<'Monitor' | 'Analytics'>('Monitor');
    const pms = usePms();

    // Oracle Pre-Flight & Post-Audit
    const preFlight = useMemo(() => oracleService.getNightAuditPreFlight(pms), [pms]);
    const postAudit = useMemo(() => {
        if (currentAudit?.status === 'completed') {
            return oracleService.getPostAuditAnalysis(currentAudit, pms);
        }
        return null;
    }, [currentAudit, pms]);

    const performanceDimensions: ReportDimension[] = [
        { key: 'businessDate', label: 'Date' }
    ];

    const performanceMetrics: ReportMetric[] = [
        { key: 'occupancy', label: 'Occupancy %', aggregation: 'avg', format: (v) => `${v.toFixed(1)}%` },
        { key: 'adr', label: 'ADR', aggregation: 'avg', format: (v) => `$${v.toFixed(2)}` },
        { key: 'revpar', label: 'RevPAR', aggregation: 'avg', format: (v) => `$${v.toFixed(2)}` },
        { key: 'revenue', label: 'Total Revenue', aggregation: 'sum', format: (v) => `$${v.toLocaleString()}` }
    ];


    useEffect(() => {
        initializeData();
    }, []);

    const initializeData = async () => {
        await loadAuditHistory();
        await loadLatestStatistics();
        await loadHistoricalStats();
    };

    const loadHistoricalStats = async () => {
        try {
            const q = query(collection(db, 'dailyStatistics'), orderBy('businessDate', 'desc'), limit(30));
            const snapshot = await getDocs(q);
            const stats = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    // Flatten for ReportEngine
                    businessDate: data.businessDate.toDate ? data.businessDate.toDate().toISOString().split('T')[0] : data.businessDate,
                    occupancy: data.occupancy?.occupancyPercentage || 0,
                    adr: data.metrics?.adr || 0,
                    revpar: data.metrics?.revpar || 0,
                    revenue: data.revenue?.total || 0
                };
            });
            setAllStats(stats.reverse()); // Chronological for charts
        } catch (error) {
            console.error('Failed to load historical stats:', error);
        }
    };


    const loadAuditHistory = async () => {
        const runs = await getAuditHistory();
        // The service returns auditRuns where dates might be strings, so we parse them if necessary.
        // But for UI rendering, let's map string dates back to Date objects temporarily
        const parsedRuns = runs.map((run: any) => ({
            ...run,
            businessDate: new Date(run.businessDate),
            startTime: new Date(run.startTime),
            endTime: run.endTime ? new Date(run.endTime) : undefined,
            steps: run.steps.map((s: any) => ({
                ...s,
                startTime: new Date(s.startTime),
                endTime: s.endTime ? new Date(s.endTime) : undefined
            }))
        }));
        setAuditHistory(parsedRuns);
    };

    const loadLatestStatistics = async () => {
        const stats = await getLatestStatistics();
        if (stats) {
            setStatistics({
                ...stats,
                businessDate: new Date(stats.businessDate).toISOString().split('T')[0]
            });
        }
    };

    const handleRunAudit = async () => {
        setIsRunning(true);

        try {
            // Initialize audit engine with local database
            const config = {
                autoRunTime: '03:00',
                autoRolloverEnabled: true,
                businessDate: new Date(),
                propertyId: 'HOTEL001',
                notifications: {
                    email: ['manager@hotel.com']
                }
            };

            const engine = new NightAuditService(config);
            const result = await engine.executeNightAudit();

            setCurrentAudit(result);
            setIsRunning(false);

            // Reload history and statistics
            await loadAuditHistory();
            await loadLatestStatistics();

        } catch (error) {
            console.error('Night audit failed:', error);
            setIsRunning(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Night Audit</h1>
                    <p className="text-zinc-400 mt-1">Automated end-of-day processing</p>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                    <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('Monitor')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'Monitor' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Monitor
                        </button>
                        <button
                            onClick={() => setActiveTab('Analytics')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'Analytics' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Performance Trends
                        </button>
                    </div>

                    <button
                        onClick={handleRunAudit}
                        disabled={isRunning}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                            ${isRunning
                                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                                : 'bg-violet-600 hover:bg-violet-700 text-white'
                            }
                        `}
                    >
                        {isRunning ? (
                            <>
                                <Clock className="w-5 h-5 animate-spin" />
                                Running Audit...
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                Run Night Audit
                            </>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'Monitor' ? (
                <div className="space-y-6 animate-fadeIn">
                    {/* ══════ PRE-FLIGHT CHECKLIST ══════ */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${preFlight.canProceed ? 'bg-emerald-600 shadow-emerald-900/30' : 'bg-amber-600 shadow-amber-900/30'}`}>
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pre-Flight Checklist</h3>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">
                                        {preFlight.canProceed ? '✅ All clear — ready for audit.' : '⚠️ Resolve blockers before running audit.'}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${preFlight.canProceed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                {preFlight.canProceed ? 'GO' : 'HOLD'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {preFlight.items.map((item: any) => (
                                <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border ${item.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/10' : item.status === 'fail' ? 'bg-red-500/5 border-red-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                                    <div className="mt-0.5">
                                        {item.status === 'pass' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                        {item.status === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                                        {item.status === 'fail' && <XCircle className="w-4 h-4 text-red-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-zinc-200">{item.label}</p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{item.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monitor Content */}
                    {/* Statistics Cards */}
                    {statistics && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-400">Occupancy</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {statistics.occupancy.occupancyPercentage.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {statistics.occupancy.roomsOccupied} / {statistics.occupancy.roomsAvailable} rooms
                                        </p>
                                    </div>
                                    <Users className="w-10 h-10 text-violet-500" />
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-400">ADR</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            ${statistics.metrics.adr.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">Average Daily Rate</p>
                                    </div>
                                    <DollarSign className="w-10 h-10 text-emerald-500" />
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-400">RevPAR</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            ${statistics.metrics.revpar.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">Revenue Per Available Room</p>
                                    </div>
                                    <TrendingUp className="w-10 h-10 text-blue-500" />
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-zinc-400">Total Revenue</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            ${statistics.revenue.total.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">Today's total</p>
                                    </div>
                                    <DollarSign className="w-10 h-10 text-amber-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Current Audit Progress */}
                    {currentAudit && (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                {currentAudit.status === 'running' && <Clock className="w-5 h-5 animate-spin text-violet-500" />}
                                {currentAudit.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                {currentAudit.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                                Current Audit - {currentAudit.status}
                            </h2>

                            {/* Steps Progress */}
                            <div className="space-y-3">
                                {currentAudit.steps.map((step, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                    ${step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : ''}
                                    ${step.status === 'running' ? 'bg-violet-500/20 text-violet-500' : ''}
                                    ${step.status === 'failed' ? 'bg-red-500/20 text-red-500' : ''}
                                    ${step.status === 'pending' ? 'bg-zinc-700 text-zinc-400' : ''}
                                `}>
                                            {index + 1}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white font-medium">{step.stepName}</span>
                                                {step.duration && (
                                                    <span className="text-xs text-zinc-500">
                                                        {(step.duration / 1000).toFixed(1)}s
                                                    </span>
                                                )}
                                            </div>
                                            {step.error && (
                                                <p className="text-sm text-red-400 mt-1">{step.error}</p>
                                            )}
                                            {step.data && typeof step.data === 'object' && (
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    {JSON.stringify(step.data)}
                                                </p>
                                            )}
                                        </div>

                                        {step.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                        {step.status === 'running' && <Clock className="w-5 h-5 animate-spin text-violet-500" />}
                                        {step.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══════ POST-AUDIT ORACLE ANALYSIS ══════ */}
                    {postAudit && (
                        <div className="bg-gradient-to-r from-indigo-600/10 via-zinc-900 to-zinc-900 border border-indigo-500/20 rounded-2xl p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/30">
                                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Oracle Post-Audit Analysis</h3>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">AI-verified end-of-day summary</p>
                                    </div>
                                </div>
                                <div className={`text-2xl font-black px-4 py-2 rounded-xl border ${postAudit.grade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : postAudit.grade === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : postAudit.grade === 'C' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    {postAudit.grade}
                                </div>
                            </div>
                            <div className="space-y-2">
                                {postAudit.insights.map((insight: string, i: number) => (
                                    <p key={i} className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Audit History */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Audit History</h2>

                        {auditHistory.length === 0 ? (
                            <p className="text-zinc-400 text-center py-8">No audit runs yet</p>
                        ) : (
                            <div className="space-y-2">
                                {auditHistory.map((audit) => (
                                    <div key={audit.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                                        <div>
                                            <p className="text-white font-medium">
                                                {audit.businessDate.toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {audit.startTime.toLocaleTimeString()} - {audit.endTime?.toLocaleTimeString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className={`
                                        px-3 py-1 rounded-full text-xs font-medium
                                        ${audit.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : ''}
                                        ${audit.status === 'failed' ? 'bg-red-500/20 text-red-500' : ''}
                                        ${audit.status === 'running' ? 'bg-violet-500/20 text-violet-500' : ''}
                                    `}>
                                                {audit.status}
                                            </span>

                                            <span className="text-sm text-zinc-400">
                                                {audit.steps.length} steps
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden h-[600px] flex flex-col animate-fadeIn">
                    <ReportEngine
                        title="Audit Performance Analytics"
                        data={allStats}
                        dimensions={performanceDimensions}
                        metrics={performanceMetrics}
                        defaultDimension="businessDate"
                        defaultMetric="occupancy"
                        defaultChartType="Area"
                    />
                </div>
            )}
        </div>
    );
};

export default NightAudit;
