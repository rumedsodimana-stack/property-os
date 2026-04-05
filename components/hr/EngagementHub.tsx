import React, { useState, useMemo } from 'react';
import {
    Heart, TrendingUp, Users, BarChart2, MessageSquare,
    ThumbsUp, ThumbsDown, Minus, PlusCircle, Trash2,
    Smile, Meh, Frown, Activity, Send, Award
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar
} from 'recharts';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface DepartmentScore {
    department: string;
    score: number;
    responseRate: number;
    change: number;
    headcount: number;
}

interface SurveyQuestion {
    id: string;
    text: string;
    category: string;
    avgScore: number;
}

interface PulseSurveyQuestion {
    id: string;
    text: string;
}

interface TrendPoint {
    month: string;
    score: number;
    eNPS: number;
}

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const DEPARTMENT_SCORES: DepartmentScore[] = [
    { department: 'Front Office', score: 4.3, responseRate: 92, change: 0.2, headcount: 24 },
    { department: 'F&B', score: 3.8, responseRate: 85, change: -0.1, headcount: 38 },
    { department: 'Housekeeping', score: 4.1, responseRate: 88, change: 0.3, headcount: 32 },
    { department: 'Engineering', score: 4.0, responseRate: 78, change: 0.0, headcount: 12 },
    { department: 'Sales', score: 4.5, responseRate: 95, change: 0.4, headcount: 8 },
    { department: 'Finance', score: 4.2, responseRate: 90, change: 0.1, headcount: 6 },
    { department: 'HR', score: 4.4, responseRate: 100, change: 0.2, headcount: 5 },
    { department: 'Spa', score: 3.9, responseRate: 82, change: -0.2, headcount: 10 },
];

const SURVEY_RESULTS: SurveyQuestion[] = [
    { id: 'q1', text: 'I feel valued and recognized for my contributions', category: 'Recognition', avgScore: 4.1 },
    { id: 'q2', text: 'My manager provides regular and constructive feedback', category: 'Management', avgScore: 3.9 },
    { id: 'q3', text: 'I have the tools and resources to do my job well', category: 'Resources', avgScore: 4.3 },
    { id: 'q4', text: 'I see a clear path for career growth here', category: 'Growth', avgScore: 3.6 },
    { id: 'q5', text: 'I would recommend this hotel as a great place to work', category: 'eNPS', avgScore: 4.2 },
    { id: 'q6', text: 'Communication from leadership is transparent and timely', category: 'Communication', avgScore: 3.8 },
    { id: 'q7', text: 'I feel a sense of belonging with my team', category: 'Culture', avgScore: 4.4 },
    { id: 'q8', text: 'Work-life balance is respected and supported', category: 'Wellbeing', avgScore: 3.7 },
];

const TREND_DATA: TrendPoint[] = [
    { month: 'Oct', score: 3.8, eNPS: 28 },
    { month: 'Nov', score: 3.9, eNPS: 30 },
    { month: 'Dec', score: 3.7, eNPS: 25 },
    { month: 'Jan', score: 4.0, eNPS: 35 },
    { month: 'Feb', score: 4.1, eNPS: 38 },
    { month: 'Mar', score: 4.2, eNPS: 42 },
];

const ENPS_BREAKDOWN = { promoters: 52, passives: 30, detractors: 18 };

// ─── GAUGE COMPONENT ────────────────────────────────────────────────────────
const EngagementGauge: React.FC<{ score: number; maxScore: number }> = ({ score, maxScore }) => {
    const percentage = (score / maxScore) * 100;
    const gaugeData = [{ name: 'Score', value: percentage, fill: percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444' }];

    return (
        <div className="flex flex-col items-center">
            <RadialBarChart
                width={180}
                height={120}
                cx={90}
                cy={100}
                innerRadius={60}
                outerRadius={85}
                startAngle={180}
                endAngle={0}
                data={gaugeData}
                barSize={12}
            >
                <RadialBar background={{ fill: '#27272a' }} dataKey="value" cornerRadius={6} />
            </RadialBarChart>
            <div className="-mt-14 text-center">
                <div className="text-3xl font-light text-white">{score.toFixed(1)}</div>
                <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">out of {maxScore}</div>
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const EngagementHub: React.FC = () => {
    const [showSurveyBuilder, setShowSurveyBuilder] = useState(false);
    const [pulseQuestions, setPulseQuestions] = useState<PulseSurveyQuestion[]>([
        { id: 'pq1', text: 'How motivated do you feel this week?' },
        { id: 'pq2', text: 'Do you feel supported by your direct manager?' },
    ]);
    const [newQuestion, setNewQuestion] = useState('');

    const overallScore = useMemo(() => {
        return DEPARTMENT_SCORES.reduce((s, d) => s + d.score * d.headcount, 0) / DEPARTMENT_SCORES.reduce((s, d) => s + d.headcount, 0);
    }, []);

    const overallResponseRate = useMemo(() => {
        return Math.round(DEPARTMENT_SCORES.reduce((s, d) => s + d.responseRate * d.headcount, 0) / DEPARTMENT_SCORES.reduce((s, d) => s + d.headcount, 0));
    }, []);

    const eNPS = ENPS_BREAKDOWN.promoters - ENPS_BREAKDOWN.detractors;

    const addQuestion = () => {
        if (!newQuestion.trim()) return;
        setPulseQuestions(prev => [...prev, { id: `pq${Date.now()}`, text: newQuestion.trim() }]);
        setNewQuestion('');
    };

    const removeQuestion = (id: string) => {
        setPulseQuestions(prev => prev.filter(q => q.id !== id));
    };

    return (
        <div className="flex flex-col h-full gap-5 animate-fadeIn">
            {/* Top KPI Row */}
            <div className="grid grid-cols-5 gap-3">
                {[
                    { label: 'Engagement Score', value: overallScore.toFixed(1), sub: '/5.0', color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20', icon: <Heart className="w-3.5 h-3.5" /> },
                    { label: 'eNPS', value: `+${eNPS}`, sub: '', color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', icon: <ThumbsUp className="w-3.5 h-3.5" /> },
                    { label: 'Response Rate', value: `${overallResponseRate}%`, sub: '', color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                    { label: 'Top Dept', value: 'Sales', sub: '4.5', color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', icon: <Award className="w-3.5 h-3.5" /> },
                    { label: '6-Month Trend', value: '+0.4', sub: 'pts', color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                ].map(k => (
                    <div key={k.label} className={`${k.bg} border rounded-xl p-3 flex items-center gap-3`}>
                        <div className={`${k.color} opacity-60`}>{k.icon}</div>
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-lg font-light ${k.color}`}>{k.value}</span>
                                {k.sub && <span className="text-[9px] text-zinc-600">{k.sub}</span>}
                            </div>
                            <div className="text-[8px] text-zinc-600 uppercase font-bold tracking-wider">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
                {/* Left Column: Gauge + eNPS + Trend */}
                <div className="col-span-1 flex flex-col gap-5">
                    {/* Engagement Gauge */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-2 self-start">
                            <Activity className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Overall Engagement</span>
                        </div>
                        <EngagementGauge score={overallScore} maxScore={5} />
                    </div>

                    {/* eNPS Breakdown */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">eNPS Breakdown</span>
                            <span className="ml-auto text-sm font-bold text-emerald-400">+{eNPS}</span>
                        </div>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Promoters', value: ENPS_BREAKDOWN.promoters, color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: <ThumbsUp className="w-3 h-3" /> },
                                { label: 'Passives', value: ENPS_BREAKDOWN.passives, color: 'bg-amber-500', textColor: 'text-amber-400', icon: <Minus className="w-3 h-3" /> },
                                { label: 'Detractors', value: ENPS_BREAKDOWN.detractors, color: 'bg-rose-500', textColor: 'text-rose-400', icon: <ThumbsDown className="w-3 h-3" /> },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[10px] flex items-center gap-1.5 ${item.textColor}`}>
                                            {item.icon} {item.label}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono">{item.value}%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trend Chart */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">6-Month Trend</span>
                        </div>
                        <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={TREND_DATA} margin={{ left: -20, right: 5, top: 5, bottom: 0 }}>
                                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#52525b' }} axisLine={false} tickLine={false} />
                                <YAxis domain={[3, 5]} tick={{ fontSize: 9, fill: '#52525b' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} name="Score" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Middle Column: Survey Results */}
                <div className="col-span-1 flex flex-col gap-5">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex-1 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Latest Survey Results</span>
                        </div>
                        <div className="space-y-3">
                            {SURVEY_RESULTS.map(q => {
                                const pct = (q.avgScore / 5) * 100;
                                const face = q.avgScore >= 4.0
                                    ? <Smile className="w-3.5 h-3.5 text-emerald-400" />
                                    : q.avgScore >= 3.5
                                        ? <Meh className="w-3.5 h-3.5 text-amber-400" />
                                        : <Frown className="w-3.5 h-3.5 text-rose-400" />;
                                return (
                                    <div key={q.id} className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3">
                                        <div className="flex items-start gap-2 mb-2">
                                            <div className="mt-0.5 flex-shrink-0">{face}</div>
                                            <p className="text-[10px] text-zinc-400 leading-relaxed">{q.text}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">
                                                {q.category}
                                            </span>
                                            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${q.avgScore >= 4.0 ? 'bg-emerald-500' : q.avgScore >= 3.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold ${q.avgScore >= 4.0 ? 'text-emerald-400' : q.avgScore >= 3.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                {q.avgScore.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Department Comparison + Pulse Builder */}
                <div className="col-span-1 flex flex-col gap-5">
                    {/* Department Comparison */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Department Scores</span>
                        </div>
                        <div className="space-y-2">
                            {[...DEPARTMENT_SCORES].sort((a, b) => b.score - a.score).map(dept => (
                                <div key={dept.department} className="flex items-center gap-3">
                                    <span className="text-[10px] text-zinc-500 w-24 truncate">{dept.department}</span>
                                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${dept.score >= 4.2 ? 'bg-emerald-500' : dept.score >= 3.8 ? 'bg-violet-500' : 'bg-amber-500'}`}
                                            style={{ width: `${(dept.score / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold w-8 text-right ${dept.score >= 4.2 ? 'text-emerald-400' : dept.score >= 3.8 ? 'text-violet-400' : 'text-amber-400'}`}>
                                        {dept.score.toFixed(1)}
                                    </span>
                                    <span className={`text-[9px] w-10 text-right ${dept.change > 0 ? 'text-emerald-400' : dept.change < 0 ? 'text-rose-400' : 'text-zinc-600'}`}>
                                        {dept.change > 0 ? '+' : ''}{dept.change.toFixed(1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pulse Survey Builder */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                            <Smile className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pulse Survey Builder</span>
                            <button
                                onClick={() => setShowSurveyBuilder(p => !p)}
                                className="ml-auto text-[9px] text-violet-400 hover:text-violet-300 transition"
                            >
                                {showSurveyBuilder ? 'Collapse' : 'Expand'}
                            </button>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto">
                            {pulseQuestions.map((q, idx) => (
                                <div key={q.id} className="flex items-start gap-2 bg-zinc-950/40 border border-zinc-800/50 rounded-lg p-2.5">
                                    <span className="text-[9px] text-zinc-600 font-mono mt-0.5">{idx + 1}.</span>
                                    <p className="text-[10px] text-zinc-400 flex-1 leading-relaxed">{q.text}</p>
                                    <button
                                        onClick={() => removeQuestion(q.id)}
                                        className="text-zinc-700 hover:text-rose-400 transition flex-shrink-0"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {showSurveyBuilder && (
                            <div className="mt-3 pt-3 border-t border-zinc-800 animate-fadeIn">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a new question..."
                                        value={newQuestion}
                                        onChange={e => setNewQuestion(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addQuestion()}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[10px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/40"
                                    />
                                    <button
                                        onClick={addQuestion}
                                        className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1"
                                    >
                                        <PlusCircle className="w-3 h-3" /> Add
                                    </button>
                                </div>
                            </div>
                        )}

                        <button className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-violet-600/20 transition">
                            <Send className="w-3 h-3" /> Send Pulse Survey
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EngagementHub;
