import React, { useState, useMemo } from 'react';
import {
    Target, ChevronDown, ChevronRight, Users, User,
    Calendar, CheckCircle, Clock, AlertTriangle,
    TrendingUp, Award, Flag, Layers, BarChart2, Zap
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────
type OKRStatus = 'On Track' | 'At Risk' | 'Behind' | 'Completed';
type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
type ViewMode = 'Team' | 'Individual';

interface KeyResult {
    id: string;
    title: string;
    current: number;
    target: number;
    unit: string;
    status: OKRStatus;
}

interface Objective {
    id: string;
    title: string;
    owner: string;
    ownerRole: string;
    department: string;
    quarter: Quarter;
    status: OKRStatus;
    keyResults: KeyResult[];
    isTeam: boolean;
}

const STATUS_STYLES: Record<OKRStatus, { text: string; bg: string; border: string; icon: React.ReactNode }> = {
    'On Track': { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> },
    'At Risk': { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <AlertTriangle className="w-3 h-3" /> },
    'Behind': { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: <Clock className="w-3 h-3" /> },
    'Completed': { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: <Award className="w-3 h-3" /> },
};

const QUARTER_STYLES: Record<Quarter, string> = {
    Q1: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    Q2: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    Q3: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Q4: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const OBJECTIVES: Objective[] = [
    {
        id: 'o1', title: 'Increase Guest Satisfaction to Forbes 5-Star Level', owner: 'Front Office Team', ownerRole: 'Department', department: 'Front Office', quarter: 'Q2', status: 'On Track', isTeam: true,
        keyResults: [
            { id: 'kr1', title: 'Achieve NPS score of 85+', current: 78, target: 85, unit: 'pts', status: 'On Track' },
            { id: 'kr2', title: 'Reduce average check-in time to under 3 minutes', current: 3.8, target: 3, unit: 'min', status: 'At Risk' },
            { id: 'kr3', title: 'Resolve 95% of guest complaints within 30 min', current: 88, target: 95, unit: '%', status: 'On Track' },
        ],
    },
    {
        id: 'o2', title: 'Optimize F&B Revenue per Cover', owner: 'F&B Team', ownerRole: 'Department', department: 'F&B', quarter: 'Q2', status: 'At Risk', isTeam: true,
        keyResults: [
            { id: 'kr4', title: 'Increase average check to BHD 28', current: 24.5, target: 28, unit: 'BHD', status: 'At Risk' },
            { id: 'kr5', title: 'Launch 2 new seasonal menus', current: 1, target: 2, unit: 'menus', status: 'On Track' },
            { id: 'kr6', title: 'Reduce food waste by 15%', current: 8, target: 15, unit: '%', status: 'Behind' },
        ],
    },
    {
        id: 'o3', title: 'Achieve Opera PMS Super-User Certification', owner: 'Yuki Tanaka', ownerRole: 'Front Desk Agent', department: 'Front Office', quarter: 'Q2', status: 'On Track', isTeam: false,
        keyResults: [
            { id: 'kr7', title: 'Complete all 8 training modules', current: 6, target: 8, unit: 'modules', status: 'On Track' },
            { id: 'kr8', title: 'Pass certification exam with 90%+', current: 0, target: 90, unit: '%', status: 'Behind' },
        ],
    },
    {
        id: 'o4', title: 'Reduce Staff Turnover Below 12%', owner: 'HR Team', ownerRole: 'Department', department: 'HR', quarter: 'Q2', status: 'Completed', isTeam: true,
        keyResults: [
            { id: 'kr9', title: 'Implement stay interviews for all departments', current: 8, target: 8, unit: 'depts', status: 'Completed' },
            { id: 'kr10', title: 'Achieve engagement score of 4.2+', current: 4.3, target: 4.2, unit: '/5', status: 'Completed' },
            { id: 'kr11', title: 'Reduce 90-day attrition to under 5%', current: 4.1, target: 5, unit: '%', status: 'Completed' },
        ],
    },
    {
        id: 'o5', title: 'Improve Housekeeping Turnaround Efficiency', owner: 'Housekeeping Team', ownerRole: 'Department', department: 'Housekeeping', quarter: 'Q2', status: 'On Track', isTeam: true,
        keyResults: [
            { id: 'kr12', title: 'Reduce room turnaround to 22 min average', current: 26, target: 22, unit: 'min', status: 'At Risk' },
            { id: 'kr13', title: 'Achieve 98% room inspection pass rate', current: 96, target: 98, unit: '%', status: 'On Track' },
        ],
    },
    {
        id: 'o6', title: 'Complete Leadership Development Program', owner: 'Sarah Ahmed', ownerRole: 'Housekeeping Supervisor', department: 'Housekeeping', quarter: 'Q2', status: 'On Track', isTeam: false,
        keyResults: [
            { id: 'kr14', title: 'Complete all 10 leadership modules', current: 8, target: 10, unit: 'modules', status: 'On Track' },
            { id: 'kr15', title: 'Lead 3 department improvement projects', current: 2, target: 3, unit: 'projects', status: 'On Track' },
            { id: 'kr16', title: 'Achieve 360-feedback score of 4.0+', current: 3.8, target: 4.0, unit: '/5', status: 'At Risk' },
        ],
    },
    {
        id: 'o7', title: 'Drive Direct Booking Revenue Growth', owner: 'Sales Team', ownerRole: 'Department', department: 'Sales', quarter: 'Q1', status: 'Completed', isTeam: true,
        keyResults: [
            { id: 'kr17', title: 'Increase direct bookings to 40% of total', current: 42, target: 40, unit: '%', status: 'Completed' },
            { id: 'kr18', title: 'Launch loyalty program with 500 sign-ups', current: 580, target: 500, unit: 'members', status: 'Completed' },
        ],
    },
];

// ─── OBJECTIVE CARD ─────────────────────────────────────────────────────────
const ObjectiveCard: React.FC<{ objective: Objective }> = ({ objective }) => {
    const [expanded, setExpanded] = useState(false);
    const statusStyle = STATUS_STYLES[objective.status];
    const quarterStyle = QUARTER_STYLES[objective.quarter];

    const overallProgress = useMemo(() => {
        const krs = objective.keyResults;
        if (krs.length === 0) return 0;
        return Math.round(krs.reduce((sum, kr) => {
            const pct = kr.target > 0 ? Math.min((kr.current / kr.target) * 100, 100) : 0;
            return sum + pct;
        }, 0) / krs.length);
    }, [objective.keyResults]);

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition">
            {/* Objective Header */}
            <div
                className="p-4 cursor-pointer flex items-start gap-3"
                onClick={() => setExpanded(p => !p)}
            >
                <div className="mt-1 text-zinc-600">
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${quarterStyle}`}>
                            {objective.quarter}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {statusStyle.icon} {objective.status}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">
                            {objective.department}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-zinc-100 mb-1">{objective.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        {objective.isTeam ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span>{objective.owner}</span>
                        {objective.ownerRole !== 'Department' && (
                            <span className="text-zinc-700">({objective.ownerRole})</span>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className={`text-xl font-light ${overallProgress >= 80 ? 'text-emerald-400' : overallProgress >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {overallProgress}%
                    </span>
                    <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-wider">{objective.keyResults.length} KRs</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-4 pb-3">
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${overallProgress >= 80 ? 'bg-emerald-500' : overallProgress >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
            </div>

            {/* Key Results */}
            {expanded && (
                <div className="border-t border-zinc-800 bg-zinc-950/30 p-4 space-y-3 animate-fadeIn">
                    {objective.keyResults.map(kr => {
                        const krProgress = kr.target > 0 ? Math.min((kr.current / kr.target) * 100, 100) : 0;
                        const krStyle = STATUS_STYLES[kr.status];
                        return (
                            <div key={kr.id} className="flex items-center gap-3">
                                <div className={`flex-shrink-0 ${krStyle.text}`}>{krStyle.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] text-zinc-300 mb-1">{kr.title}</div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${kr.status === 'Completed' ? 'bg-violet-500' : kr.status === 'On Track' ? 'bg-emerald-500' : kr.status === 'At Risk' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                style={{ width: `${krProgress}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-zinc-500 font-mono flex-shrink-0 w-24 text-right">
                                            {kr.current} / {kr.target} {kr.unit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const OKRGoals: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('Team');
    const [quarterFilter, setQuarterFilter] = useState<string>('Q2');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [deptFilter, setDeptFilter] = useState<string>('All');

    const filteredObjectives = useMemo(() => {
        return OBJECTIVES.filter(o => {
            const matchView = viewMode === 'Team' ? o.isTeam : !o.isTeam;
            const matchQuarter = quarterFilter === 'All' || o.quarter === quarterFilter;
            const matchStatus = statusFilter === 'All' || o.status === statusFilter;
            const matchDept = deptFilter === 'All' || o.department === deptFilter;
            return matchView && matchQuarter && matchStatus && matchDept;
        });
    }, [viewMode, quarterFilter, statusFilter, deptFilter]);

    const stats = useMemo(() => {
        const all = OBJECTIVES;
        const totalKRs = all.reduce((s, o) => s + o.keyResults.length, 0);
        const completedKRs = all.reduce((s, o) => s + o.keyResults.filter(k => k.status === 'Completed').length, 0);
        const avgProgress = Math.round(
            all.reduce((sum, o) => {
                const objProg = o.keyResults.length > 0
                    ? o.keyResults.reduce((s, kr) => s + Math.min((kr.current / kr.target) * 100, 100), 0) / o.keyResults.length
                    : 0;
                return sum + objProg;
            }, 0) / (all.length || 1)
        );
        const onTrack = all.filter(o => o.status === 'On Track').length;
        const atRisk = all.filter(o => o.status === 'At Risk' || o.status === 'Behind').length;
        return { totalObjectives: all.length, totalKRs, completedKRs, avgProgress, onTrack, atRisk };
    }, []);

    const departments = [...new Set(OBJECTIVES.map(o => o.department))];

    return (
        <div className="flex flex-col h-full gap-5 animate-fadeIn">
            {/* Stats Bar */}
            <div className="grid grid-cols-6 gap-3">
                {[
                    { label: 'Objectives', value: stats.totalObjectives, color: 'text-zinc-200', bg: 'bg-zinc-900/60 border-zinc-800', icon: <Target className="w-3.5 h-3.5" /> },
                    { label: 'Key Results', value: stats.totalKRs, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20', icon: <Layers className="w-3.5 h-3.5" /> },
                    { label: 'KRs Completed', value: stats.completedKRs, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                    { label: 'Avg Progress', value: `${stats.avgProgress}%`, color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                    { label: 'On Track', value: stats.onTrack, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', icon: <Flag className="w-3.5 h-3.5" /> },
                    { label: 'At Risk / Behind', value: stats.atRisk, color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/20', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                ].map(k => (
                    <div key={k.label} className={`${k.bg} border rounded-xl p-3 flex items-center gap-3`}>
                        <div className={`${k.color} opacity-60`}>{k.icon}</div>
                        <div>
                            <div className={`text-lg font-light ${k.color}`}>{k.value}</div>
                            <div className="text-[8px] text-zinc-600 uppercase font-bold tracking-wider">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                {/* Team / Individual Toggle */}
                <div className="flex bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                    {(['Team', 'Individual'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition ${viewMode === mode
                                ? 'bg-violet-600 text-white'
                                : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                        >
                            {mode === 'Team' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            {mode}
                        </button>
                    ))}
                </div>

                {/* Quarter Filter */}
                <div className="flex bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
                    {['All', 'Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                        <button
                            key={q}
                            onClick={() => setQuarterFilter(q)}
                            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition ${quarterFilter === q
                                ? 'bg-violet-600/20 text-violet-400'
                                : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                        >
                            {q}
                        </button>
                    ))}
                </div>

                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-[10px] rounded-lg px-2 py-2 focus:outline-none"
                >
                    <option value="All">All Statuses</option>
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Behind">Behind</option>
                    <option value="Completed">Completed</option>
                </select>

                <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className="bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-[10px] rounded-lg px-2 py-2 focus:outline-none"
                >
                    <option value="All">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <div className="ml-auto text-[10px] text-zinc-600">
                    {filteredObjectives.length} objective{filteredObjectives.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Objectives List */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {filteredObjectives.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
                        <Target className="w-12 h-12 mb-3 opacity-20" />
                        <span className="text-sm">No objectives match your filters</span>
                    </div>
                )}
                {filteredObjectives.map(obj => (
                    <ObjectiveCard key={obj.id} objective={obj} />
                ))}
            </div>
        </div>
    );
};

export default OKRGoals;
