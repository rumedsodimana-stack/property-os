import React, { useState, useMemo } from 'react';
import {
    GraduationCap, BookOpen, CheckCircle, Clock, Play,
    Award, Users, Filter, Search, BarChart2,
    Shield, AlertTriangle, ChevronDown, ChevronUp,
    TrendingUp, Star, Calendar, FileText, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── TYPES ───────────────────────────────────────────────────────────────────
type CourseStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
type CourseCategory = 'Compliance' | 'Safety' | 'Service' | 'Technical' | 'Leadership' | 'Wellness';

interface Course {
    id: string;
    title: string;
    category: CourseCategory;
    duration: string;
    mandatory: boolean;
    description: string;
    modules: number;
}

interface Assignment {
    id: string;
    courseId: string;
    employeeName: string;
    department: string;
    status: CourseStatus;
    progress: number; // 0-100
    assignedDate: number;
    dueDate: number;
    completedDate?: number;
    score?: number;
}

const CATEGORY_COLORS: Record<CourseCategory, { text: string; bg: string; border: string }> = {
    Compliance: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    Safety: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    Service: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    Technical: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    Leadership: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    Wellness: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const COURSES: Course[] = [
    { id: 'cr1', title: 'Fire Safety & Evacuation', category: 'Safety', duration: '2h', mandatory: true, description: 'Emergency protocols, fire extinguisher usage, evacuation routes', modules: 4 },
    { id: 'cr2', title: 'Anti-Money Laundering (AML)', category: 'Compliance', duration: '1.5h', mandatory: true, description: 'KYC procedures, suspicious transaction reporting, CBB regulations', modules: 3 },
    { id: 'cr3', title: 'Guest Service Excellence', category: 'Service', duration: '3h', mandatory: false, description: 'Forbes 5-star standards, guest recovery, anticipatory service', modules: 6 },
    { id: 'cr4', title: 'Opera PMS Advanced', category: 'Technical', duration: '4h', mandatory: false, description: 'Rate management, group reservations, night audit procedures', modules: 8 },
    { id: 'cr5', title: 'Leadership Foundations', category: 'Leadership', duration: '5h', mandatory: false, description: 'Coaching, delegation, conflict resolution, team motivation', modules: 10 },
    { id: 'cr6', title: 'Food Hygiene HACCP', category: 'Compliance', duration: '2h', mandatory: true, description: 'Critical control points, temperature logging, allergen management', modules: 5 },
    { id: 'cr7', title: 'Workplace Wellbeing', category: 'Wellness', duration: '1h', mandatory: false, description: 'Stress management, ergonomics, mental health awareness', modules: 3 },
    { id: 'cr8', title: 'Data Protection & GDPR', category: 'Compliance', duration: '1h', mandatory: true, description: 'Guest data handling, consent management, breach protocols', modules: 3 },
];

const ASSIGNMENTS: Assignment[] = [
    { id: 'a1', courseId: 'cr1', employeeName: 'Ali Mohammed', department: 'Front Office', status: 'Completed', progress: 100, assignedDate: Date.now() - 30 * 86400000, dueDate: Date.now() - 5 * 86400000, completedDate: Date.now() - 8 * 86400000, score: 92 },
    { id: 'a2', courseId: 'cr2', employeeName: 'Noor Hasan', department: 'Finance', status: 'In Progress', progress: 65, assignedDate: Date.now() - 14 * 86400000, dueDate: Date.now() + 7 * 86400000 },
    { id: 'a3', courseId: 'cr3', employeeName: 'Priya Sharma', department: 'F&B', status: 'Not Started', progress: 0, assignedDate: Date.now() - 3 * 86400000, dueDate: Date.now() + 14 * 86400000 },
    { id: 'a4', courseId: 'cr6', employeeName: 'Carlos Rivera', department: 'F&B', status: 'Overdue', progress: 40, assignedDate: Date.now() - 45 * 86400000, dueDate: Date.now() - 10 * 86400000 },
    { id: 'a5', courseId: 'cr4', employeeName: 'Yuki Tanaka', department: 'Front Office', status: 'In Progress', progress: 80, assignedDate: Date.now() - 20 * 86400000, dueDate: Date.now() + 3 * 86400000 },
    { id: 'a6', courseId: 'cr5', employeeName: 'Sarah Ahmed', department: 'Housekeeping', status: 'Completed', progress: 100, assignedDate: Date.now() - 40 * 86400000, dueDate: Date.now() - 15 * 86400000, completedDate: Date.now() - 18 * 86400000, score: 88 },
    { id: 'a7', courseId: 'cr1', employeeName: 'James Okafor', department: 'Engineering', status: 'Completed', progress: 100, assignedDate: Date.now() - 35 * 86400000, dueDate: Date.now() - 10 * 86400000, completedDate: Date.now() - 12 * 86400000, score: 95 },
    { id: 'a8', courseId: 'cr8', employeeName: 'Layla Khalifa', department: 'Sales', status: 'Overdue', progress: 20, assignedDate: Date.now() - 30 * 86400000, dueDate: Date.now() - 5 * 86400000 },
    { id: 'a9', courseId: 'cr7', employeeName: 'Omar Farouk', department: 'Housekeeping', status: 'Not Started', progress: 0, assignedDate: Date.now() - 5 * 86400000, dueDate: Date.now() + 21 * 86400000 },
    { id: 'a10', courseId: 'cr2', employeeName: 'Maria Santos', department: 'Finance', status: 'Completed', progress: 100, assignedDate: Date.now() - 25 * 86400000, dueDate: Date.now() - 2 * 86400000, completedDate: Date.now() - 5 * 86400000, score: 98 },
];

const STATUS_STYLES: Record<CourseStatus, { text: string; bg: string; border: string }> = {
    'Not Started': { text: 'text-zinc-500', bg: 'bg-zinc-800/50', border: 'border-zinc-700' },
    'In Progress': { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    'Completed': { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'Overdue': { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const TrainingDevelopment: React.FC = () => {
    const [activeView, setActiveView] = useState<'Catalog' | 'Assignments'>('Assignments');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

    const stats = useMemo(() => {
        const total = ASSIGNMENTS.length;
        const completed = ASSIGNMENTS.filter(a => a.status === 'Completed').length;
        const overdue = ASSIGNMENTS.filter(a => a.status === 'Overdue').length;
        const inProgress = ASSIGNMENTS.filter(a => a.status === 'In Progress').length;
        const avgScore = ASSIGNMENTS.filter(a => a.score).reduce((s, a) => s + (a.score ?? 0), 0) / (ASSIGNMENTS.filter(a => a.score).length || 1);
        const complianceRate = Math.round((completed / (total || 1)) * 100);
        return { total, completed, overdue, inProgress, avgScore: Math.round(avgScore), complianceRate };
    }, []);

    const complianceChartData = useMemo(() => {
        const categories: CourseCategory[] = ['Compliance', 'Safety', 'Service', 'Technical', 'Leadership', 'Wellness'];
        return categories.map(cat => {
            const courseIds = COURSES.filter(c => c.category === cat).map(c => c.id);
            const catAssignments = ASSIGNMENTS.filter(a => courseIds.includes(a.courseId));
            const done = catAssignments.filter(a => a.status === 'Completed').length;
            return { name: cat, completed: done, total: catAssignments.length, rate: catAssignments.length > 0 ? Math.round((done / catAssignments.length) * 100) : 0 };
        });
    }, []);

    const filteredAssignments = useMemo(() => {
        return ASSIGNMENTS.filter(a => {
            const course = COURSES.find(c => c.id === a.courseId);
            const matchSearch = !searchQuery || a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || (course?.title ?? '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchCategory = categoryFilter === 'All' || course?.category === categoryFilter;
            const matchStatus = statusFilter === 'All' || a.status === statusFilter;
            return matchSearch && matchCategory && matchStatus;
        });
    }, [searchQuery, categoryFilter, statusFilter]);

    return (
        <div className="flex flex-col h-full gap-5 animate-fadeIn">
            {/* Stats Row */}
            <div className="grid grid-cols-6 gap-3">
                {[
                    { label: 'Total Assignments', value: stats.total, color: 'text-zinc-200', bg: 'bg-zinc-900/60 border-zinc-800', icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { label: 'Completed', value: stats.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                    { label: 'In Progress', value: stats.inProgress, color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20', icon: <Play className="w-3.5 h-3.5" /> },
                    { label: 'Overdue', value: stats.overdue, color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/20', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                    { label: 'Avg Score', value: `${stats.avgScore}%`, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', icon: <Star className="w-3.5 h-3.5" /> },
                    { label: 'Compliance Rate', value: `${stats.complianceRate}%`, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20', icon: <Shield className="w-3.5 h-3.5" /> },
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

            <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
                {/* Left: Compliance Chart + Course Catalog */}
                <div className="col-span-1 flex flex-col gap-5">
                    {/* Compliance Chart */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Compliance by Category</span>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={complianceChartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#52525b' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '10px' }}
                                    formatter={(value: number) => [`${value}%`, 'Completion']}
                                />
                                <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={16}>
                                    {complianceChartData.map((entry, idx) => {
                                        const cat = entry.name as CourseCategory;
                                        const colorMap: Record<CourseCategory, string> = {
                                            Compliance: '#f43f5e', Safety: '#f59e0b', Service: '#8b5cf6',
                                            Technical: '#0ea5e9', Leadership: '#6366f1', Wellness: '#10b981',
                                        };
                                        return <Cell key={idx} fill={colorMap[cat]} fillOpacity={0.7} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Course Catalog */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex-1 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Course Catalog</span>
                            <span className="ml-auto text-[9px] text-zinc-600">{COURSES.length} courses</span>
                        </div>
                        <div className="space-y-2">
                            {COURSES.map(course => {
                                const cat = CATEGORY_COLORS[course.category];
                                return (
                                    <div
                                        key={course.id}
                                        onClick={() => setExpandedCourse(p => p === course.id ? null : course.id)}
                                        className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3 cursor-pointer hover:border-zinc-700 transition"
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="text-xs font-medium text-zinc-200">{course.title}</div>
                                            {course.mandatory && (
                                                <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase flex-shrink-0 ml-2">
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${cat.bg} ${cat.text} border ${cat.border}`}>
                                                {course.category}
                                            </span>
                                            <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" /> {course.duration}
                                            </span>
                                            <span className="text-[9px] text-zinc-600">{course.modules} modules</span>
                                        </div>
                                        {expandedCourse === course.id && (
                                            <p className="mt-2 text-[9px] text-zinc-500 leading-relaxed border-t border-zinc-800 pt-2">
                                                {course.description}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Assignment Tracking */}
                <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Assignments</span>
                        <div className="flex-1" />
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-1.5 text-[10px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/40 w-40"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] rounded-lg px-2 py-1.5 focus:outline-none"
                        >
                            <option value="All">All Categories</option>
                            {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] rounded-lg px-2 py-1.5 focus:outline-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-xs text-zinc-400">
                            <thead className="bg-zinc-950/60 text-zinc-600 uppercase text-[9px] tracking-wider font-bold sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3">Course</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Progress</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Due Date</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {filteredAssignments.map(a => {
                                    const course = COURSES.find(c => c.id === a.courseId);
                                    const cat = course ? CATEGORY_COLORS[course.category] : CATEGORY_COLORS.Service;
                                    const statusStyle = STATUS_STYLES[a.status];
                                    const dueStr = new Date(a.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                                    return (
                                        <tr key={a.id} className="hover:bg-zinc-800/20 transition">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-zinc-200">{a.employeeName}</div>
                                                <div className="text-[9px] text-zinc-600">{a.department}</div>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-300 max-w-[180px] truncate">{course?.title ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${cat.bg} ${cat.text} border ${cat.border}`}>
                                                    {course?.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 w-32">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${a.status === 'Overdue' ? 'bg-rose-500' : a.status === 'Completed' ? 'bg-emerald-500' : 'bg-violet-500'}`}
                                                            style={{ width: `${a.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-zinc-600 w-7 text-right">{a.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[10px] text-zinc-500">{dueStr}</td>
                                            <td className="px-4 py-3 text-center">
                                                {a.score ? (
                                                    <span className={`font-bold text-sm ${a.score >= 90 ? 'text-emerald-400' : a.score >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                        {a.score}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-700">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingDevelopment;
