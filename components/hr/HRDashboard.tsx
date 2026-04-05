import React, { useState, useMemo, useEffect } from 'react';
import {
    Users, Calendar, DollarSign, TrendingUp, BookOpen,
    BarChart2, UserPlus, LogOut, ArrowLeftRight, Clock,
    Brain, AlertTriangle, Star, Award,
    UsersRound, Shield, GraduationCap, Zap, Activity,
    Target, ChevronRight, TrendingDown,
    LayoutDashboard, Database, ClipboardList, Landmark
} from 'lucide-react';
import { StaffMember } from '../../types';
import StaffDirectory from './StaffDirectory';
import HireWizard from './HireWizard';
import RosterBuilder from './RosterBuilder';
import TimeAttendance from './TimeAttendance';
import LeaveManagement from './LeaveManagement';
import PayrollEngine from './PayrollEngine';
import PerformanceHub from './PerformanceHub';
import TransferManager from './TransferManager';
import OffboardingFlow from './OffboardingFlow';
import RecruitmentPipeline from './RecruitmentPipeline';
import TrainingDevelopment from './TrainingDevelopment';
import OKRGoals from './OKRGoals';
import EngagementHub from './EngagementHub';
import { subscribeToItems } from '../../services/kernel/firestoreService';
import { botEngine } from '../../services/kernel/systemBridge';
import { usePms } from '../../services/kernel/persistence';
import UniversalReportCenter from '../shared/UniversalReportCenter';
import { useInspector } from '../../context/InspectorContext';


// ─── TYPES ───────────────────────────────────────────────────────────────────
type HRTab = 'Overview' | 'Directory' | 'Roster' | 'Attendance' | 'Leave'
    | 'Payroll' | 'Performance' | 'Transfers' | 'Offboarding'
    | 'Recruitment' | 'Training' | 'OKRs' | 'Engagement' | 'Reports';

const TABS: { id: HRTab; label: string; icon: React.ReactNode }[] = [
    { id: 'Overview', label: 'Overview', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'Directory', label: 'Staff', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'Roster', label: 'Roster', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'Attendance', label: 'Time & Att.', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'Leave', label: 'Leave', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'Payroll', label: 'Payroll', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'Performance', label: 'Performance', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'Transfers', label: 'Transfers', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
    { id: 'Offboarding', label: 'Exits', icon: <LogOut className="w-3.5 h-3.5" /> },
    { id: 'Recruitment', label: 'Recruit', icon: <UserPlus className="w-3.5 h-3.5" /> },
    { id: 'Training', label: 'Training', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'OKRs', label: 'OKRs', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'Engagement', label: 'Engage', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'Reports', label: 'Reports', icon: <BarChart2 className="w-3.5 h-3.5" /> },
];

// ─── OVERVIEW PANEL ──────────────────────────────────────────────────────────
const OverviewPanel: React.FC<{ employees: any[]; stats: any; onTabSwitch: (t: HRTab) => void }> = ({ employees, stats, onTabSwitch }) => {
    const active = employees.filter(s => s.status === 'Active').length;
    const onLeave = employees.filter(s => s.status === 'OnLeave').length;
    const totalGrat = employees.reduce((s, m) => s + (m.accruedGratuity ?? 0), 0);
    const avgScore = employees.length > 0 ? Math.round(employees.reduce((s, m) => s + (m.aiPerformanceScore ?? 0), 0) / employees.length) : 0;
    const expiring = employees.filter(m => m.workPermitExpiry && m.workPermitExpiry < Date.now() + 30 * 86400000).length;
    const totalPayroll = employees.reduce((s, m) => s + m.basicSalary, 0);
    const promoReady = employees.filter(m => (m.aiPerformanceScore ?? 0) >= 90 && ((Date.now() - m.hireDate) / 86400000) > 365).length;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* KPI Grid */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Active Staff', value: active, icon: <UsersRound className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', onClick: 'Directory' },
                    { label: 'On Leave Now', value: onLeave, icon: <Clock className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', onClick: 'Leave' },
                    { label: 'Monthly Payroll', value: `BHD ${totalPayroll.toLocaleString()}`, icon: <DollarSign className="w-4 h-4" />, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20', onClick: 'Payroll' },
                    { label: 'Gratuity Provision', value: `BHD ${Math.round(totalGrat / 1000)}k`, icon: <Shield className="w-4 h-4" />, color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20', onClick: 'Payroll' },
                    { label: 'Avg AI Score', value: avgScore, icon: <Star className="w-4 h-4" />, color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/20', onClick: 'Performance' },
                    { label: 'Promotion Candidates', value: promoReady, icon: <Award className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', onClick: 'Performance' },
                    { label: 'Expiring Permits', value: expiring, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/20', onClick: 'Directory' },
                    { label: 'Departments', value: new Set(employees.map(s => s.departmentId)).size, icon: <Target className="w-4 h-4" />, color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/20', onClick: 'Directory' },
                ].map(k => (
                    <div key={k.label} onClick={() => onTabSwitch(k.onClick as HRTab)} className={`${k.bg} border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.02] transition-transform`}>
                        <div className={`p-2 rounded-lg bg-zinc-900/50 ${k.color} flex-shrink-0`}>{k.icon}</div>
                        <div>
                            <div className={`text-xl font-light ${k.color}`}>{k.value}</div>
                            <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider leading-tight">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-5">
                {/* AI Intelligence Panel */}
                <div className="col-span-1 bg-zinc-900/50 border border-violet-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Brain className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">AI HR Intelligence</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { msg: `${promoReady} staff ready for promotion based on KPI trajectory`, icon: <Award className="w-3 h-3 text-amber-400" />, severity: 'amber' },
                            { msg: `${expiring} work permit${expiring !== 1 ? 's' : ''} expiring within 30 days`, icon: <AlertTriangle className="w-3 h-3 text-rose-400" />, severity: 'rose' },
                            { msg: `Gratuity provision at BHD ${Math.round(totalGrat / 1000)}k — recommend monthly GL posting`, icon: <DollarSign className="w-3 h-3 text-sky-400" />, severity: 'sky' },
                            { msg: `F&B dept shows highest OT trend — consider hiring 1 FTE`, icon: <TrendingUp className="w-3 h-3 text-orange-400" />, severity: 'orange' },
                        ].map((item, i) => (
                            <div key={i} className={`p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 flex items-start gap-2.5`}>
                                <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                                <p className="text-[10px] text-zinc-400 leading-relaxed">{item.msg}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Staff List Snapshot */}
                <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Staff Snapshot</span>
                        <button onClick={() => onTabSwitch('Directory')} className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition">
                            View All <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <table className="w-full text-xs text-zinc-400">
                        <thead className="bg-zinc-950/60 text-zinc-600 uppercase text-[9px] tracking-wider font-bold">
                            <tr>
                                <th className="px-4 py-2.5 text-left">Name</th>
                                <th className="px-4 py-2.5 text-left">Role</th>
                                <th className="px-4 py-2.5 text-left">Dept</th>
                                <th className="px-4 py-2.5 text-center">AI Score</th>
                                <th className="px-4 py-2.5 text-center">Status</th>
                                <th className="px-4 py-2.5 text-right">Gratuity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {employees.slice(0, 6).map(m => (
                                <tr key={m.id} className="hover:bg-zinc-800/20 transition">
                                    <td className="px-4 py-2.5 font-medium text-zinc-200">{m.fullName}</td>
                                    <td className="px-4 py-2.5 text-zinc-500 truncate max-w-[120px]">{m.jobTitle}</td>
                                    <td className="px-4 py-2.5 text-zinc-600">{m.departmentName}</td>
                                    <td className="px-4 py-2.5 text-center">
                                        <span className={`font-bold text-sm ${(m.aiPerformanceScore ?? 0) >= 90 ? 'text-emerald-400' : (m.aiPerformanceScore ?? 0) >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                                            {m.aiPerformanceScore ?? m.performanceScore}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase ${m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            m.status === 'OnLeave' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-zinc-800 text-zinc-500 border-zinc-700'
                                            }`}>{m.status}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-sky-400 text-[10px]">
                                        BHD {((m.accruedGratuity ?? 0) / 1000).toFixed(1)}k
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Department Headcount</div>
                <div className="flex gap-4">
                    {Object.entries(
                        employees.reduce((acc, s) => {
                            acc[s.departmentName] = (acc[s.departmentName] ?? 0) + 1;
                            return acc;
                        }, {} as Record<string, number>)
                    ).map(([dept, count]) => (
                        <div key={dept} className="flex-1 bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3 text-center">
                            <div className="text-lg font-light text-zinc-100">{count}</div>
                            <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider mt-0.5">{dept}</div>
                            <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${employees.length > 0 ? (Number(count) / employees.length) * 100 : 0}%` }} />

                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── MAIN HR DASHBOARD ───────────────────────────────────────────────────────
const HRDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<HRTab>('Overview');
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const { employees: EMPLOYEES, loading: pmsLoading } = usePms();
    const { inspect } = useInspector();

    const mHRStats = useMemo(() => {
        if (!staffList.length) return { retentionRate: 0, activeCount: 0, alerts: [] };
        const activeCount = staffList.filter(s => s.status === 'Active').length;
        // Placeholder for retention rate calculation
        const retentionRate = 92; // Example static value
        const alerts: string[] = [];
        const expiringPermits = staffList.filter(m => m.workPermitExpiry && m.workPermitExpiry < Date.now() + 30 * 86400000).length;
        if (expiringPermits > 0) {
            alerts.push(`${expiringPermits} work permit${expiringPermits !== 1 ? 's' : ''} expiring soon.`);
        }
        return { retentionRate, activeCount, alerts };
    }, [staffList]);

    useEffect(() => {
        const unsubscribe = subscribeToItems<StaffMember>('employees', (data) => {
            setStaffList(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const handleStaffHired = (newMember: StaffMember) => {
        setStaffList(prev => [...prev, newMember]);
    };

    const handleSelectStaff = (s: StaffMember) => {
        setSelectedStaff(s);
        // In a full integration this would open StaffProfileModal
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Overview': return <OverviewPanel employees={staffList} stats={mHRStats} onTabSwitch={setActiveTab} />;
            case 'Directory': return <StaffDirectory staff={staffList} onSelectStaff={handleSelectStaff} onStaffHired={handleStaffHired} />;
            case 'Roster': return <RosterBuilder staff={staffList} />;
            case 'Attendance': return <TimeAttendance staff={staffList} />;
            case 'Leave': return <LeaveManagement staff={staffList} />;
            case 'Payroll': return <PayrollEngine staff={staffList} totalTips={850} serviceChargePool={1200} />;
            case 'Performance': return <PerformanceHub staff={staffList} />;
            case 'Transfers': return <TransferManager staff={staffList} />;
            case 'Offboarding': return <OffboardingFlow staff={staffList} />;
            case 'Recruitment': return <RecruitmentPipeline />;
            case 'Training': return <TrainingDevelopment />;
            case 'OKRs': return <OKRGoals />;
            case 'Engagement': return <EngagementHub />;
            case 'Reports': return (
                <UniversalReportCenter defaultCategory="HumanResources" />
            );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Module Header */}
            <div className="flex-shrink-0 px-6 pt-6 pb-0">
                <div className="flex items-center gap-4 mb-5">
                    <div className="p-3 bg-violet-600/10 border border-violet-500/20 rounded-2xl">
                        <UsersRound className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-light text-white">People & HR</h1>
                        <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-wider font-bold">Hotel Singularity · Human Resources</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            {staffList.filter(s => s.status === 'Active').length} Active
                        </div>
                        <div className="px-3 py-1.5 bg-violet-500/5 border border-violet-500/20 rounded-xl text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                            BHD {staffList.reduce((s, m) => s + m.basicSalary, 0).toLocaleString()} / month
                        </div>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-0.5 overflow-x-auto scrollbar-hide pb-px">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'text-violet-400 border-violet-500 bg-zinc-900/50'
                                : 'text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-zinc-900/30'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="h-px bg-zinc-800" />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default HRDashboard;