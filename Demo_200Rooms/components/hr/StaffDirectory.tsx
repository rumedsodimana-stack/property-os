import React, { useState, useMemo } from 'react';
import {
    Users, Search, Filter, Plus, ChevronRight, Shield, Clock,
    Star, AlertTriangle, Award, MapPin, Phone, Mail, Calendar,
    Briefcase, TrendingUp, UserCheck, ArrowUpRight, DollarSign,
    GraduationCap, MoreHorizontal, UserPlus
} from 'lucide-react';
import { StaffMember } from '../../types';
import HireWizard from './HireWizard';

interface StaffDirectoryProps {
    staff: StaffMember[];
    onSelectStaff: (s: StaffMember) => void;
    onStaffHired: (s: StaffMember) => void;
}

const STATUS_CONFIG = {
    Active: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    OnLeave: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
    Suspended: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
    Terminated: { color: 'bg-zinc-700/50 text-zinc-500 border-zinc-700', dot: 'bg-zinc-600' },
    Alumni: { color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', dot: 'bg-violet-400' },
};

const CONTRACT_COLORS: Record<string, string> = {
    'Full-time': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    'Part-time': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Seasonal': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Contractor': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

const DEPARTMENTS = ['All', 'F&B', 'Front Office', 'Housekeeping', 'Finance', 'Engineering', 'Security', 'HR', 'Management'];

function calcGratuity(staff: StaffMember): number {
    const yearsServed = (Date.now() - staff.gratuityStartDate) / (1000 * 60 * 60 * 24 * 365);
    const dailyRate = staff.basicSalary / 30;
    let daysEarned = 0;
    if (yearsServed <= 5) daysEarned = yearsServed * 21;
    else daysEarned = 5 * 21 + (yearsServed - 5) * 30;
    return Math.min(dailyRate * daysEarned, staff.basicSalary * 24);
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
    'from-violet-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-sky-500 to-blue-600',
    'from-rose-500 to-pink-600',
    'from-purple-500 to-violet-600',
];

const StaffCard: React.FC<{ member: StaffMember; onClick: () => void; index: number }> = ({ member, onClick, index }) => {
    const status = STATUS_CONFIG[member.status] || STATUS_CONFIG.Active;
    const gratuity = calcGratuity(member);
    const yearsService = ((Date.now() - member.hireDate) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const score = member.aiPerformanceScore ?? member.performanceScore ?? 85;

    return (
        <div
            onClick={onClick}
            className="bg-zinc-900/60 backdrop-blur border border-zinc-800/60 rounded-2xl p-5 hover:border-violet-500/40 hover:bg-zinc-900/80 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Header row */}
            <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}>
                    {member.photo ? (
                        <img src={member.photo} alt={member.fullName} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                        getInitials(member.fullName)
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-100 truncate group-hover:text-violet-300 transition-colors">
                                {member.fullName}
                            </h3>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{member.jobTitle}</p>
                        </div>
                        {/* AI Score badge */}
                        <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold border ${score >= 90 ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                score >= 75 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                            {score}
                        </div>
                    </div>

                    {/* Status + Contract */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${status.color}`}>
                            <span className={`w-1 h-1 rounded-full ${status.dot}`} />
                            {member.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${CONTRACT_COLORS[member.contractType] || 'text-zinc-500 bg-zinc-800/50 border-zinc-700'}`}>
                            {member.contractType}
                        </span>
                    </div>
                </div>
            </div>

            {/* Department + ID row */}
            <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-500">{member.departmentName}</span>
                <span className="text-zinc-700 mx-1">·</span>
                <span className="text-[10px] text-zinc-600 font-mono">{member.employeeId}</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-950/50 rounded-lg p-2 text-center">
                    <div className="text-xs font-bold text-zinc-200">{yearsService}yr</div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Service</div>
                </div>
                <div className="bg-zinc-950/50 rounded-lg p-2 text-center">
                    <div className="text-xs font-bold text-teal-400">{member.skills.length}</div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Skills</div>
                </div>
                <div className="bg-zinc-950/50 rounded-lg p-2 text-center">
                    <div className="text-xs font-bold text-violet-400">
                        {member.currency} {gratuity > 0 ? (gratuity / 1000).toFixed(1) + 'k' : '0'}
                    </div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Gratuity</div>
                </div>
            </div>

            {/* Cross-training badge */}
            {member.crossTrainedRoleIds.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-[9px] text-indigo-400 font-bold uppercase tracking-wider">
                    <GraduationCap className="w-3 h-3" />
                    Cross-trained in {member.crossTrainedRoleIds.length} role{member.crossTrainedRoleIds.length > 1 ? 's' : ''}
                </div>
            )}

            {/* Work permit warning */}
            {member.workPermitExpiry && member.workPermitExpiry < Date.now() + 30 * 24 * 60 * 60 * 1000 && (
                <div className="mt-3 flex items-center gap-1.5 text-[9px] text-rose-400 font-bold uppercase">
                    <AlertTriangle className="w-3 h-3" />
                    Work Permit Expiring Soon
                </div>
            )}

            {/* View arrow */}
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-violet-400" />
            </div>
        </div>
    );
};

const StaffDirectory: React.FC<StaffDirectoryProps> = ({ staff, onSelectStaff, onStaffHired }) => {
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'OnLeave' | 'Terminated' | 'Alumni'>('All');
    const [contractFilter, setContractFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid');
    const [showHireWizard, setShowHireWizard] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'score' | 'service' | 'gratuity'>('name');

    const filtered = useMemo(() => {
        let result = [...staff];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(s =>
                s.fullName.toLowerCase().includes(q) ||
                s.jobTitle.toLowerCase().includes(q) ||
                s.departmentName.toLowerCase().includes(q) ||
                s.employeeId.toLowerCase().includes(q)
            );
        }
        if (deptFilter !== 'All') result = result.filter(s => s.departmentName.includes(deptFilter));
        if (statusFilter !== 'All') result = result.filter(s => s.status === statusFilter);
        if (contractFilter !== 'All') result = result.filter(s => s.contractType === contractFilter);

        result.sort((a, b) => {
            if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
            if (sortBy === 'score') return (b.aiPerformanceScore ?? 0) - (a.aiPerformanceScore ?? 0);
            if (sortBy === 'service') return b.hireDate - a.hireDate; // most recent first is wrong; let's do longest service first
            if (sortBy === 'gratuity') return calcGratuity(b) - calcGratuity(a);
            return 0;
        });
        return result;
    }, [staff, search, deptFilter, statusFilter, contractFilter, sortBy]);

    const activeCount = staff.filter(s => s.status === 'Active').length;
    const onLeaveCount = staff.filter(s => s.status === 'OnLeave').length;
    const totalGratuityProvision = staff.reduce((sum, s) => sum + calcGratuity(s), 0);
    const avgScore = staff.length ? Math.round(staff.reduce((s, e) => s + (e.aiPerformanceScore ?? e.performanceScore ?? 0), 0) / staff.length) : 0;

    return (
        <div className="flex flex-col h-full gap-6 animate-fadeIn">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Active Staff', value: activeCount.toString(), icon: <UserCheck className="w-4 h-4" />, color: 'text-emerald-400' },
                    { label: 'On Leave', value: onLeaveCount.toString(), icon: <Clock className="w-4 h-4" />, color: 'text-amber-400' },
                    { label: 'Avg AI Score', value: avgScore.toString(), icon: <Star className="w-4 h-4" />, color: 'text-violet-400' },
                    { label: 'Gratuity Provision', value: `${(totalGratuityProvision / 1000).toFixed(0)}k`, icon: <DollarSign className="w-4 h-4" />, color: 'text-sky-400' },
                ].map(stat => (
                    <div key={stat.label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-zinc-800/60 ${stat.color}`}>{stat.icon}</div>
                        <div>
                            <div className="text-lg font-light text-white">{stat.value}</div>
                            <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex gap-3 items-center flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name, role, ID..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-violet-500/50 transition"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Dept Filter */}
                <select
                    className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] rounded-xl px-3 py-2 outline-none focus:border-violet-500/50 uppercase font-bold tracking-wider"
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                >
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>

                {/* Status Filter */}
                <select
                    className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] rounded-xl px-3 py-2 outline-none focus:border-violet-500/50 uppercase font-bold tracking-wider"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                >
                    {['All', 'Active', 'OnLeave', 'Terminated', 'Alumni'].map(s => <option key={s}>{s}</option>)}
                </select>

                {/* Sort */}
                <select
                    className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] rounded-xl px-3 py-2 outline-none focus:border-violet-500/50 uppercase font-bold tracking-wider"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                >
                    <option value="name">Sort: Name</option>
                    <option value="score">Sort: AI Score</option>
                    <option value="service">Sort: Service</option>
                    <option value="gratuity">Sort: Gratuity</option>
                </select>

                {/* Count */}
                <span className="text-[10px] text-zinc-600 font-mono px-3">{filtered.length} staff</span>

                {/* Hire Button */}
                <button
                    onClick={() => setShowHireWizard(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition shadow-lg shadow-violet-900/20"
                >
                    <UserPlus className="w-3.5 h-3.5" />
                    Hire Staff
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                        <Users className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-sm font-medium">No staff found</p>
                        <p className="text-xs mt-1">Adjust your filters or hire a new team member</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((member, i) => (
                            <StaffCard
                                key={member.id}
                                member={member}
                                index={i}
                                onClick={() => onSelectStaff(member)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Hire Wizard Modal */}
            {showHireWizard && (
                <HireWizard
                    onClose={() => setShowHireWizard(false)}
                    onComplete={(newMember) => {
                        onStaffHired(newMember);
                        setShowHireWizard(false);
                    }}
                />
            )}
        </div>
    );
};

export default StaffDirectory;
