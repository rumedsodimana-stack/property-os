import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Star, Target, Award, Users, ChevronRight,
    Calendar, MessageSquare, BarChart2, Brain, CheckCircle,
    ArrowUpRight, AlertTriangle, Zap, Badge, Loader2
} from 'lucide-react';
import { StaffMember, PerformanceReview } from '../../types';
import { performanceService } from '../../services/operations/performanceService';

interface PerformanceHubProps {
    staff: StaffMember[];
}

type Tab = 'NineBox' | 'Reviews' | 'Promotions';

const NINE_BOX_LABELS: Record<string, string> = {
    'High-High': 'Star',
    'High-Medium': 'High Performer',
    'High-Low': 'Consistent Star',
    'Medium-High': 'High Potential',
    'Medium-Medium': 'Key Player',
    'Medium-Low': 'Solid Pro',
    'Low-High': 'Rough Diamond',
    'Low-Medium': 'Dilemma',
    'Low-Low': 'Underperformer',
};

const NINE_BOX_COLORS: Record<string, string> = {
    'High-High': 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    'High-Medium': 'bg-teal-500/20 border-teal-500/30 text-teal-300',
    'High-Low': 'bg-sky-500/20 border-sky-500/30 text-sky-300',
    'Medium-High': 'bg-violet-500/20 border-violet-500/30 text-violet-300',
    'Medium-Medium': 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
    'Medium-Low': 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    'Low-High': 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    'Low-Medium': 'bg-orange-500/20 border-orange-500/30 text-orange-300',
    'Low-Low': 'bg-rose-500/20 border-rose-500/30 text-rose-300',
};

const PerformanceHub: React.FC<PerformanceHubProps> = ({ staff }) => {
    const [activeTab, setActiveTab] = useState<Tab>('NineBox');
    const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [loading, setLoading] = useState(true);

    const activeStaff = staff.filter(s => s.status === 'Active');

    useEffect(() => {
        if (activeStaff.length > 0) {
            performanceService.getOrSeedReviews(activeStaff).then(fetchedReviews => {
                setReviews(fetchedReviews);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [staff]);

    const avgScore = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length) : 0;
    const promotionCandidates = reviews.filter(r => r.promotionRecommended);
    const exceedingCount = reviews.filter(r => r.overallRating === 'Exceeds Expectations').length;

    // 9-box grid structure (Potential rows: High/Med/Low × Performance cols: Low/Med/High)
    const nineBoxGrid: Record<string, PerformanceReview[]> = {};
    for (const r of reviews) {
        const key = `${r.nineBoxPotential}-${r.nineBoxPerformance}`;
        if (!nineBoxGrid[key]) nineBoxGrid[key] = [];
        nineBoxGrid[key].push(r);
    }

    const potentials: PerformanceReview['nineBoxPotential'][] = ['High', 'Medium', 'Low'];
    const performances: PerformanceReview['nineBoxPerformance'][] = ['Low', 'Medium', 'High'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                <span className="ml-3 text-zinc-400">Loading Performance Data...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-6 animate-fadeIn">

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Avg Performance Score', value: `${avgScore}`, icon: <Star className="w-4 h-4" />, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20' },
                    { label: 'Exceeding Expectations', value: exceedingCount, icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
                    { label: 'Promotion Candidates', value: promotionCandidates.length, icon: <Award className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
                    { label: 'Reviews Due', value: Math.floor(activeStaff.length * 0.3), icon: <Calendar className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/20' },
                ].map(k => (
                    <div key={k.label} className={`${k.bg} border rounded-xl p-4 flex items-center gap-3`}>
                        <div className={`p-2 rounded-lg bg-zinc-900/50 ${k.color}`}>{k.icon}</div>
                        <div>
                            <div className={`text-xl font-light ${k.color}`}>{k.value}</div>
                            <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider leading-tight">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 w-fit">
                {(['NineBox', 'Reviews', 'Promotions'] as Tab[]).map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={`px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === t ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        {t === 'NineBox' ? '9-Box Grid' : t}
                    </button>
                ))}
            </div>

            {/* 9-BOX GRID */}
            {activeTab === 'NineBox' && (
                <div className="flex-1 flex gap-6">
                    {/* Grid */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Succession Planning Matrix</div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-zinc-600">Performance →</span>
                            </div>
                        </div>

                        {/* Y-axis label */}
                        <div className="flex gap-3">
                            <div className="flex flex-col justify-center items-center w-4">
                                <span className="text-[8px] text-zinc-600 uppercase tracking-widest rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>Potential ↑</span>
                            </div>

                            {/* Grid itself */}
                            <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}>
                                {/* Column headers */}
                                <div className="contents">
                                    {performances.map(perf => (
                                        <div key={perf} className="text-[9px] text-zinc-600 uppercase font-bold text-center pb-1 tracking-wider">{perf} Perf</div>
                                    ))}
                                </div>

                                {potentials.map(pot => (
                                    <React.Fragment key={pot}>
                                        {performances.map(perf => {
                                            const key = `${pot}-${perf}`;
                                            const cell = nineBoxGrid[key] ?? [];
                                            const colorClass = NINE_BOX_COLORS[key] ?? 'bg-zinc-900 border-zinc-800 text-zinc-400';
                                            return (
                                                <div key={key} className={`border rounded-2xl p-3 min-h-[100px] transition-all hover:scale-[0.98] ${colorClass}`}>
                                                    <div className="text-[8px] font-bold uppercase tracking-wider mb-2 opacity-70">{NINE_BOX_LABELS[key]}</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {cell.map(r => (
                                                            <div key={r.id} title={r.employeeName}
                                                                className="w-6 h-6 rounded-full bg-zinc-950/50 border border-white/10 flex items-center justify-center text-[7px] font-bold text-white cursor-pointer hover:scale-110 transition"
                                                                onClick={() => setSelectedReview(r)}>
                                                                {r.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {cell.length > 0 && <div className="text-[8px] mt-1 opacity-50">{cell.length} staff</div>}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div className="w-72 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                        {selectedReview ? (
                            <div className="animate-fadeIn">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-sm font-semibold text-zinc-100">{selectedReview.employeeName}</div>
                                        <div className="text-[10px] text-zinc-500">{selectedReview.period}</div>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${selectedReview.overallScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : selectedReview.overallScore >= 75 ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                        {selectedReview.overallScore}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* KPI Scores */}
                                    <div>
                                        <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-2">KPI Scores</div>
                                        {selectedReview.kpiScores.map(k => (
                                            <div key={k.kpiName} className="mb-2">
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-zinc-400">{k.kpiName}</span>
                                                    <span className="text-zinc-300 font-bold">{k.score}%</span>
                                                </div>
                                                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${k.score >= 90 ? 'bg-emerald-500' : k.score >= 75 ? 'bg-violet-500' : 'bg-rose-500'}`} style={{ width: `${k.score}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Promotion Readiness */}
                                    <div className={`p-3 rounded-xl border ${selectedReview.promotionRecommended ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-950/50 border-zinc-800'}`}>
                                        <div className="text-[9px] font-bold uppercase tracking-wider mb-1 text-zinc-500">Promotion Readiness</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full" style={{ width: `${selectedReview.promotionReadinessScore}%` }} />
                                            </div>
                                            <span className={`text-sm font-bold ${selectedReview.promotionRecommended ? 'text-emerald-400' : 'text-zinc-400'}`}>{selectedReview.promotionReadinessScore}%</span>
                                        </div>
                                        {selectedReview.promotionRecommended && (
                                            <div className="mt-2 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                                <ArrowUpRight className="w-3 h-3" /> Promotion Recommended
                                            </div>
                                        )}
                                    </div>

                                    {/* AI Insight */}
                                    <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-violet-400 mb-1.5">
                                            <Brain className="w-3 h-3" /> AI Insight
                                        </div>
                                        <p className="text-[10px] text-zinc-400 leading-relaxed">{selectedReview.managerNotes}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                <Users className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-xs text-center">Click a staff member in the grid to view their performance details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'Reviews' && (
                <div className="flex-1 overflow-y-auto space-y-3">
                    {reviews.map(r => (
                        <div key={r.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-700 transition cursor-pointer" onClick={() => { setSelectedReview(r); setActiveTab('NineBox'); }}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${r.overallScore >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : r.overallScore >= 75 ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                {r.overallScore}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-zinc-200">{r.employeeName}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">{r.reviewType} Review · {r.period}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${r.overallRating === 'Exceeds Expectations' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                r.overallRating === 'Meets Expectations' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>{r.overallRating}</span>
                            {r.promotionRecommended && (
                                <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Promo ↑
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* PROMOTIONS TAB */}
            {activeTab === 'Promotions' && (
                <div className="flex-1 space-y-3 overflow-y-auto">
                    <div className="text-xs text-zinc-500 mb-2">AI-identified candidates based on performance scores, tenure, and KPI achievement</div>
                    {promotionCandidates.length === 0 ? (
                        <div className="text-center text-zinc-600 py-12 text-sm">No promotion candidates at this time.</div>
                    ) : promotionCandidates.map(r => (
                        <div key={r.id} className="bg-gradient-to-r from-amber-500/5 to-zinc-900/50 border border-amber-500/20 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-zinc-100">{r.employeeName}</div>
                                    <div className="text-[10px] text-zinc-500">Overall Score: {r.overallScore} · Readiness: {r.promotionReadinessScore}%</div>
                                </div>
                                <Award className="w-6 h-6 text-amber-400" />
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full" style={{ width: `${r.promotionReadinessScore}%` }} />
                            </div>
                            <div className="flex justify-end mt-3">
                                <button className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition">
                                    <ArrowUpRight className="w-3 h-3" /> Initiate Promotion
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PerformanceHub;
