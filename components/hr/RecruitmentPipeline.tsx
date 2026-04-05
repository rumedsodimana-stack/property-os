import React, { useState, useMemo } from 'react';
import {
    UserPlus, Filter, Search, GripVertical, Mail, Phone,
    MapPin, Calendar, Star, ChevronDown, ChevronUp,
    Briefcase, Clock, CheckCircle, XCircle, ArrowRight,
    TrendingUp, Users, FileText, MoreHorizontal
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────
type PipelineStage = 'Applied' | 'Screened' | 'Interviewed' | 'Offered' | 'Hired';

interface Candidate {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    role: string;
    department: string;
    stage: PipelineStage;
    appliedDate: number;
    rating: number; // 1-5
    source: string;
    experience: number; // years
    notes: string;
    avatar?: string;
}

const STAGES: { id: PipelineStage; color: string; borderColor: string; bgColor: string }[] = [
    { id: 'Applied', color: 'text-zinc-400', borderColor: 'border-zinc-600', bgColor: 'bg-zinc-800/40' },
    { id: 'Screened', color: 'text-sky-400', borderColor: 'border-sky-500/30', bgColor: 'bg-sky-500/5' },
    { id: 'Interviewed', color: 'text-violet-400', borderColor: 'border-violet-500/30', bgColor: 'bg-violet-500/5' },
    { id: 'Offered', color: 'text-amber-400', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/5' },
    { id: 'Hired', color: 'text-emerald-400', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/5' },
];

const DEPARTMENTS = ['Front Office', 'F&B', 'Housekeeping', 'Engineering', 'Sales', 'Finance', 'IT', 'Spa'];
const SOURCES = ['LinkedIn', 'Indeed', 'Referral', 'Walk-in', 'Agency', 'Career Fair'];

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const MOCK_CANDIDATES: Candidate[] = [
    { id: 'c1', name: 'Fatima Al-Rashid', email: 'fatima@email.com', phone: '+973 3400 1122', location: 'Manama', role: 'Guest Relations Manager', department: 'Front Office', stage: 'Interviewed', appliedDate: Date.now() - 5 * 86400000, rating: 4, source: 'LinkedIn', experience: 6, notes: 'Strong leadership skills, fluent in 3 languages' },
    { id: 'c2', name: 'Ahmed Hassan', email: 'ahmed@email.com', phone: '+973 3500 2233', location: 'Riffa', role: 'Sous Chef', department: 'F&B', stage: 'Applied', appliedDate: Date.now() - 2 * 86400000, rating: 3, source: 'Indeed', experience: 4, notes: 'Specializes in Middle Eastern cuisine' },
    { id: 'c3', name: 'Maria Santos', email: 'maria@email.com', phone: '+973 3600 3344', location: 'Juffair', role: 'Revenue Analyst', department: 'Finance', stage: 'Offered', appliedDate: Date.now() - 12 * 86400000, rating: 5, source: 'Referral', experience: 8, notes: 'Former Marriott RM team, expert in IDeaS/Duetto' },
    { id: 'c4', name: 'James Okafor', email: 'james@email.com', phone: '+973 3700 4455', location: 'Seef', role: 'Night Auditor', department: 'Front Office', stage: 'Screened', appliedDate: Date.now() - 7 * 86400000, rating: 3, source: 'Agency', experience: 2, notes: 'Opera PMS certified' },
    { id: 'c5', name: 'Priya Nair', email: 'priya@email.com', phone: '+973 3800 5566', location: 'Adliya', role: 'Spa Therapist', department: 'Spa', stage: 'Applied', appliedDate: Date.now() - 1 * 86400000, rating: 4, source: 'Walk-in', experience: 5, notes: 'CIDESCO certified, Ayurveda trained' },
    { id: 'c6', name: 'Chen Wei', email: 'chen@email.com', phone: '+973 3900 6677', location: 'Bahrain Bay', role: 'IT Systems Admin', department: 'IT', stage: 'Interviewed', appliedDate: Date.now() - 9 * 86400000, rating: 4, source: 'LinkedIn', experience: 7, notes: 'PMS/POS infrastructure specialist' },
    { id: 'c7', name: 'Sarah Miller', email: 'sarah@email.com', phone: '+973 3100 7788', location: 'Amwaj', role: 'Sales Coordinator', department: 'Sales', stage: 'Hired', appliedDate: Date.now() - 20 * 86400000, rating: 5, source: 'Career Fair', experience: 3, notes: 'Joined April 1 — onboarding in progress' },
    { id: 'c8', name: 'Omar Farouk', email: 'omar@email.com', phone: '+973 3200 8899', location: 'Muharraq', role: 'Housekeeping Supervisor', department: 'Housekeeping', stage: 'Screened', appliedDate: Date.now() - 4 * 86400000, rating: 3, source: 'Referral', experience: 5, notes: 'Currently at Intercontinental' },
    { id: 'c9', name: 'Layla Khalifa', email: 'layla@email.com', phone: '+973 3300 9900', location: 'Zinj', role: 'F&B Supervisor', department: 'F&B', stage: 'Offered', appliedDate: Date.now() - 14 * 86400000, rating: 4, source: 'Indeed', experience: 4, notes: 'Awaiting visa clearance' },
    { id: 'c10', name: 'Raj Patel', email: 'raj@email.com', phone: '+973 3450 1010', location: 'Hoora', role: 'Chief Engineer', department: 'Engineering', stage: 'Interviewed', appliedDate: Date.now() - 10 * 86400000, rating: 5, source: 'Agency', experience: 12, notes: 'MEP expert, managed 300-room properties' },
];

// ─── CANDIDATE CARD ─────────────────────────────────────────────────────────
const CandidateCard: React.FC<{
    candidate: Candidate;
    onMove: (id: string, stage: PipelineStage) => void;
    expanded: boolean;
    onToggle: () => void;
}> = ({ candidate, onMove, expanded, onToggle }) => {
    const stageIdx = STAGES.findIndex(s => s.id === candidate.stage);
    const nextStage = stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1] : null;
    const daysAgo = Math.floor((Date.now() - candidate.appliedDate) / 86400000);

    return (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 hover:border-zinc-700 transition-all group">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 flex-shrink-0">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-200 truncate">{candidate.name}</div>
                        <div className="text-[9px] text-zinc-600 truncate">{candidate.role}</div>
                    </div>
                </div>
                <button onClick={onToggle} className="text-zinc-600 hover:text-zinc-400 transition p-0.5">
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                    <Briefcase className="w-2.5 h-2.5" /> {candidate.department}
                </span>
                <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {daysAgo}d ago
                </span>
            </div>

            <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-2.5 h-2.5 ${i <= candidate.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
                ))}
                <span className="text-[8px] text-zinc-600 ml-1">{candidate.experience}yr exp</span>
            </div>

            {expanded && (
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                        <Mail className="w-2.5 h-2.5" /> {candidate.email}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                        <Phone className="w-2.5 h-2.5" /> {candidate.phone}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                        <MapPin className="w-2.5 h-2.5" /> {candidate.location}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                        <FileText className="w-2.5 h-2.5" /> Source: {candidate.source}
                    </div>
                    <p className="text-[9px] text-zinc-500 italic leading-relaxed">{candidate.notes}</p>
                </div>
            )}

            {nextStage && (
                <button
                    onClick={() => onMove(candidate.id, nextStage.id)}
                    className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition opacity-0 group-hover:opacity-100 ${nextStage.borderColor} ${nextStage.bgColor} ${nextStage.color}`}
                >
                    Move to {nextStage.id} <ArrowRight className="w-2.5 h-2.5" />
                </button>
            )}
        </div>
    );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const RecruitmentPipeline: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
    const [searchQuery, setSearchQuery] = useState('');
    const [deptFilter, setDeptFilter] = useState<string>('All');
    const [sourceFilter, setSourceFilter] = useState<string>('All');
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return candidates.filter(c => {
            const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.role.toLowerCase().includes(searchQuery.toLowerCase());
            const matchDept = deptFilter === 'All' || c.department === deptFilter;
            const matchSource = sourceFilter === 'All' || c.source === sourceFilter;
            return matchSearch && matchDept && matchSource;
        });
    }, [candidates, searchQuery, deptFilter, sourceFilter]);

    const moveCandidate = (id: string, newStage: PipelineStage) => {
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: newStage } : c));
    };

    const stats = useMemo(() => {
        const total = candidates.length;
        const hired = candidates.filter(c => c.stage === 'Hired').length;
        const offered = candidates.filter(c => c.stage === 'Offered').length;
        const avgDays = Math.round(candidates.reduce((s, c) => s + (Date.now() - c.appliedDate) / 86400000, 0) / (total || 1));
        const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0;
        return { total, hired, offered, avgDays, conversionRate };
    }, [candidates]);

    return (
        <div className="flex flex-col h-full gap-5 animate-fadeIn">
            {/* Stats Bar */}
            <div className="grid grid-cols-5 gap-3">
                {[
                    { label: 'Total Pipeline', value: stats.total, color: 'text-zinc-200', bg: 'bg-zinc-900/60 border-zinc-800' },
                    { label: 'Avg Time in Pipeline', value: `${stats.avgDays}d`, color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20' },
                    { label: 'Offers Extended', value: stats.offered, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
                    { label: 'Hired This Month', value: stats.hired, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
                    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20' },
                ].map(k => (
                    <div key={k.label} className={`${k.bg} border rounded-xl p-3 text-center`}>
                        <div className={`text-lg font-light ${k.color}`}>{k.value}</div>
                        <div className="text-[8px] text-zinc-600 uppercase font-bold tracking-wider mt-0.5">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input
                        type="text"
                        placeholder="Search candidates or roles..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/40"
                    />
                </div>
                <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-zinc-600" />
                    <select
                        value={deptFilter}
                        onChange={e => setDeptFilter(e.target.value)}
                        className="bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-[10px] rounded-lg px-2 py-2 focus:outline-none"
                    >
                        <option value="All">All Departments</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                        value={sourceFilter}
                        onChange={e => setSourceFilter(e.target.value)}
                        className="bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-[10px] rounded-lg px-2 py-2 focus:outline-none"
                    >
                        <option value="All">All Sources</option>
                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 min-w-max h-full">
                    {STAGES.map(stage => {
                        const stageCandidates = filtered.filter(c => c.stage === stage.id);
                        return (
                            <div key={stage.id} className="w-72 flex flex-col">
                                {/* Column Header */}
                                <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border ${stage.borderColor} ${stage.bgColor}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${stage.color}`}>
                                            {stage.id}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${stage.bgColor} ${stage.color} border ${stage.borderColor}`}>
                                            {stageCandidates.length}
                                        </span>
                                    </div>
                                    {stage.id === 'Applied' && (
                                        <button className="p-1 rounded-lg hover:bg-zinc-800 transition text-zinc-600 hover:text-zinc-400">
                                            <UserPlus className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Column Body */}
                                <div className="flex-1 bg-zinc-950/30 border-x border-b border-zinc-800/50 rounded-b-xl p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-380px)]">
                                    {stageCandidates.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 text-zinc-700">
                                            <Users className="w-6 h-6 mb-2 opacity-30" />
                                            <span className="text-[10px]">No candidates</span>
                                        </div>
                                    )}
                                    {stageCandidates.map(candidate => (
                                        <CandidateCard
                                            key={candidate.id}
                                            candidate={candidate}
                                            onMove={moveCandidate}
                                            expanded={expandedCard === candidate.id}
                                            onToggle={() => setExpandedCard(p => p === candidate.id ? null : candidate.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RecruitmentPipeline;
