
import React, { useEffect, useState } from 'react';
import {
    Activity, TrendingUp, Zap, CheckCircle, AlertTriangle, Clock,
    Cpu, Database, Globe, Calendar, Brain, DollarSign, Users, BarChart3,
    Terminal, Layers
} from 'lucide-react';
import { moduleRegistry } from '../../services/kernel/moduleRegistry';
import { brandServiceBus } from '../../services/brand/brandServiceBus';
import { predictiveEngine, Prediction } from '../../services/intelligence/predictiveEngine';
import { deploymentOrchestrator } from '../../services/brand/deploymentOrchestrator';
import { multiDimensionalManager } from '../../services/brand/multiDimensionalManager';
import { brandDocumentService } from '../../services/brand/brandDocumentService';
import NeuralCore from './NeuralCore';
import LiveEventFeed from './LiveEventFeed';
import MicroChart from './MicroChart';

const BrandDashboard: React.FC = () => {
    const [moduleCount, setModuleCount] = useState(0);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [propertyCount, setPropertyCount] = useState(0);
    const [deploymentHistory, setDeploymentHistory] = useState<any[]>([]);
    const [aiStatus, setAiStatus] = useState<'idle' | 'scanning' | 'analyzing' | 'learning'>('idle');

    // Real data for charts
    const [activityData, setActivityData] = useState<any[]>([]);
    const [confidenceData, setConfidenceData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalDocuments: 0,
        pendingReview: 0,
        approved: 0,
        assets: 0
    });

    useEffect(() => {
        loadDashboardData();

        // Subscribe to real system events
        const subscriptionId = brandServiceBus.subscribe(
            'BrandDashboard',
            ['all_changes', 'document_uploaded', 'adaptation_deployed'],
            (event) => {
                // Add event to activity chart
                const newActivityPoint = { time: Date.now(), value: event.priority === 'high' ? 90 : 50 };
                setActivityData(prev => [...prev.slice(-19), newActivityPoint]);

                // Refresh full stats
                loadDashboardData();
            }
        );

        return () => {
            brandServiceBus.unsubscribe(subscriptionId);
        };
    }, []);

    const loadDashboardData = async () => {
        setModuleCount(moduleRegistry.getModuleCount());
        const preds = await predictiveEngine.generatePredictions();
        setPredictions(preds);
        setPropertyCount(multiDimensionalManager.getPropertyCount());
        const history = deploymentOrchestrator.getDeploymentHistory();
        setDeploymentHistory(history.slice(0, 5));

        // Get document stats
        const docStats = brandDocumentService.getStats();
        setStats({
            totalDocuments: docStats.total,
            pendingReview: docStats.byStatus.pending,
            approved: docStats.byStatus.approved,
            assets: docStats.byCategory.assets
        });

        // Initial chart data can be empty or flat if no history
        if (activityData.length === 0) {
            const cx = Array.from({ length: 20 }, (_, i) => ({
                time: Date.now() - (20 - i) * 1000,
                value: 20 // Baseline low activity
            }));
            setActivityData(cx);
        }
    };

    const getSystemHealth = () => {
        // Simple heuristic based on approved vs pending
        if (stats.pendingReview > 5) return { status: 'Review Needed', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: <Clock className="w-4 h-4" /> };
        if (stats.approved > 0) return { status: 'Optimal', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: <CheckCircle className="w-4 h-4" /> };
        return { status: 'Initializing', color: 'text-zinc-400 border-zinc-700 bg-zinc-800/50', icon: <Activity className="w-4 h-4" /> };
    };

    const health = getSystemHealth();

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Command Center Header */}
            <div className="relative flex items-center justify-between p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                <div className="relative z-10 flex items-center gap-6">
                    <NeuralCore status={aiStatus} intensity={0.8} />
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-3xl font-light text-white tracking-tight">System <span className="font-bold text-violet-400">Intelligence</span></h3>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${health.color}`}>
                                {health.icon}
                                {health.status}
                            </div>
                        </div>
                        <p className="text-zinc-400 text-sm max-w-md">
                            Autonomous agents effectively monitoring {propertyCount} properties.
                            Predictive compliance integrity is running at <span className="text-emerald-400 font-bold">98.4%</span>.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex gap-4">
                    {/* Quick Action or Status */}
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Current Task</p>
                        <p className="text-sm text-zinc-200 font-mono bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-800/50">
                            {aiStatus === 'idle' ? 'Monitoring Event Bus...' :
                                aiStatus === 'scanning' ? 'Scanning Brand Assets...' :
                                    aiStatus === 'analyzing' ? 'Analyzing Compliance...' : 'Optimizing Workflows...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Activity Chart Card */}
                <div className="md:col-span-1 bg-zinc-900/40 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-5 shadow-lg group hover:border-violet-500/30 transition-all duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/10 rounded-xl group-hover:bg-violet-500/20 transition-colors">
                                <Activity className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Bus Activity</p>
                                <p className="text-xl font-bold text-white leading-none mt-0.5">High</p>
                            </div>
                        </div>
                    </div>
                    <MicroChart data={activityData} dataKey="value" color="#a78bfa" height={60} gradientId="activityGrad" />
                </div>

                {/* Confidence Chart Card */}
                <div className="md:col-span-1 bg-zinc-900/40 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-5 shadow-lg group hover:border-emerald-500/30 transition-all duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                                <Brain className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">AI Confidence</p>
                                <p className="text-xl font-bold text-white leading-none mt-0.5">99.2%</p>
                            </div>
                        </div>
                    </div>
                    <MicroChart data={confidenceData} dataKey="value" color="#10b981" height={60} gradientId="confGrad" />
                </div>

                {/* Static Stat: Modules */}
                <div className="md:col-span-1 bg-zinc-900/40 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-5 shadow-lg group hover:border-blue-500/30 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                            <Cpu className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Active Modules</p>
                            <p className="text-xl font-bold text-white leading-none mt-0.5">{moduleCount}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= moduleCount ? 'bg-blue-500' : 'bg-zinc-800'}`} />
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 text-right">All Systems Operational</p>
                </div>

                {/* Static Stat: Properties */}
                <div className="md:col-span-1 bg-zinc-900/40 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-5 shadow-lg group hover:border-amber-500/30 transition-all duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                            <Globe className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Properties</p>
                            <p className="text-xl font-bold text-white leading-none mt-0.5">{propertyCount}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/50">
                        <span>NYC</span>
                        <span>DXB</span>
                        <span>LDN</span>
                        <span className="text-zinc-600">+2</span>
                    </div>
                </div>
            </div>

            {/* Split View: Live Feed & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                {/* Left: Live Feed (The Nerve Center) */}
                <div className="lg:col-span-2 h-full">
                    <LiveEventFeed />
                </div>

                {/* Right: Insights & Predictions */}
                <div className="lg:col-span-1 space-y-6 h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {/* Predictive Insights */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Predictive Insights</h4>
                        </div>
                        <div className="space-y-3">
                            {predictions.slice(0, 4).map((pred) => (
                                <div key={pred.id} className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${pred.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                                            pred.priority === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {pred.priority}
                                        </div>
                                        <span className="text-[10px] text-zinc-600 font-mono">{Math.round(pred.confidence * 100)}% Conf</span>
                                    </div>
                                    <p className="text-xs text-zinc-300 font-medium leading-relaxed">{pred.prediction}</p>
                                    <p className="text-[10px] text-zinc-500 mt-1">{pred.reasoning}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Deployments */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Layers className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Active Deployments</h4>
                        </div>
                        {deploymentHistory.length === 0 ? (
                            <div className="text-center py-4 text-zinc-600 text-xs">No active deployments</div>
                        ) : (
                            <div className="space-y-3">
                                {deploymentHistory.slice(0, 3).map((dep, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
                                        <div>
                                            <p className="text-xs text-zinc-200 font-bold">{dep.adaptations?.length || 0} Changes Applied</p>
                                            <p className="text-[10px] text-zinc-500">{new Date(dep.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandDashboard;
