import React, { useState } from 'react';
import {
    Calendar, Plus, Check, X, Clock, AlertCircle,
    ChevronDown, Filter, Bell, TrendingDown
} from 'lucide-react';
import { StaffMember, LeaveRequest, LeaveBalance } from '../../types';
import { addItem, updateItem } from '../../services/kernel/firestoreService';
import { useAuth } from '../../context/AuthContext';

interface LeaveManagementProps {
    staff: StaffMember[];
}

type LeaveTab = 'Requests' | 'Balances' | 'Calendar';

const LEAVE_TYPE_COLORS: Record<string, string> = {
    Annual: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    Sick: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Emergency: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Maternity: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Paternity: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    Unpaid: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
    'Public Holiday': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function generateMockLeaveRequests(staff: StaffMember[]): LeaveRequest[] {
    const types: LeaveRequest['type'][] = ['Annual', 'Sick', 'Emergency', 'Annual', 'Annual'];
    return staff.slice(0, 8).map((s, i) => ({
        id: `lr-${i}`,
        employeeId: s.id,
        employeeName: s.fullName,
        type: types[i % types.length],
        startDate: Date.now() + (i + 1) * 3 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + (i + 1 + 2) * 3 * 24 * 60 * 60 * 1000,
        daysRequested: 3,
        reason: i % 3 === 0 ? 'Family event' : i % 3 === 1 ? 'Medical appointment' : 'Personal',
        status: i < 3 ? 'Pending' : i < 5 ? 'Approved' : 'Rejected',
        submittedAt: Date.now() - i * 24 * 60 * 60 * 1000,
        isPaid: true,
    }));
}

function generateMockBalances(staff: StaffMember[]): LeaveBalance[] {
    return staff.map((s) => ({
        employeeId: s.id,
        annual: { entitled: 30, used: Math.floor(Math.random() * 15), pending: Math.floor(Math.random() * 5), remaining: 0 },
        sick: { entitled: 15, used: Math.floor(Math.random() * 5), remaining: 0 },
        unpaid: { used: 0 },
        year: 2026,
        lastUpdated: Date.now(),
    })).map(b => ({
        ...b,
        annual: { ...b.annual, remaining: b.annual.entitled - b.annual.used - b.annual.pending },
        sick: { ...b.sick, remaining: b.sick.entitled - b.sick.used },
    }));
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ staff }) => {
    const { currentUser, hasPermission } = useAuth();
    const canApprove = hasPermission('approve_leave');
    const [activeTab, setActiveTab] = useState<LeaveTab>('Requests');
    const [requests, setRequests] = useState<LeaveRequest[]>(() => generateMockLeaveRequests(staff));
    const balances = generateMockBalances(staff);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [newRequest, setNewRequest] = useState({ employeeId: '', type: 'Annual', startDate: '', endDate: '', reason: '' });

    const pending = requests.filter(r => r.status === 'Pending');
    const filtered = filterStatus === 'All' ? requests : requests.filter(r => r.status === filterStatus);

    const handleApprove = async (id: string) => {
        const by = currentUser?.fullName || 'Manager';
        const byRole = currentUser?.role || 'Manager';
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved', approvedBy: by, approvedAt: Date.now() } : r));
        await updateItem('leaveRequests', id, { status: 'Approved', approvedBy: by, approvedByRole: byRole, approvedAt: Date.now() });
    };
    const handleReject = async (id: string) => {
        const by = currentUser?.fullName || 'Manager';
        const byRole = currentUser?.role || 'Manager';
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected', rejectionNote: 'Business needs' } : r));
        await updateItem('leaveRequests', id, { status: 'Rejected', rejectedBy: by, rejectedByRole: byRole, rejectedAt: Date.now(), rejectionNote: 'Business needs' });
    };

    const handleSubmitRequest = async () => {
        if (!newRequest.employeeId || !newRequest.startDate || !newRequest.endDate) return;
        const staffMember = staff.find(s => s.id === newRequest.employeeId);
        const start = new Date(newRequest.startDate).getTime();
        const end = new Date(newRequest.endDate).getTime();
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
        const id = `lr_${Date.now()}`;
        const payload: LeaveRequest = {
            id,
            employeeId: newRequest.employeeId,
            employeeName: staffMember?.fullName || newRequest.employeeId,
            type: newRequest.type as LeaveRequest['type'],
            startDate: start,
            endDate: end,
            daysRequested: days,
            reason: newRequest.reason,
            status: 'Pending',
            submittedAt: Date.now(),
            isPaid: true,
        };
        setRequests(prev => [payload, ...prev]);
        await addItem('leaveRequests', payload as any);
        setNewRequest({ employeeId: '', type: 'Annual', startDate: '', endDate: '', reason: '' });
        setShowRequestForm(false);
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-fadeIn">

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <div>
                        <div className="text-xl font-light text-white">{pending.length}</div>
                        <div className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">Pending Approval</div>
                    </div>
                </div>
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-violet-400" />
                    <div>
                        <div className="text-xl font-light text-white">{requests.filter(r => r.status === 'Approved' && r.startDate > Date.now()).length}</div>
                        <div className="text-[9px] text-violet-500 uppercase font-bold tracking-wider">Upcoming Leave</div>
                    </div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <div>
                        <div className="text-xl font-light text-white">{requests.filter(r => r.status === 'Approved').length}</div>
                        <div className="text-[9px] text-emerald-500 uppercase font-bold tracking-wider">Approved This Month</div>
                    </div>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                    <div>
                        <div className="text-xl font-light text-white">
                            {Math.round(balances.reduce((s, b) => s + b.annual.used, 0) / (balances.length || 1))}
                        </div>
                        <div className="text-[9px] text-rose-500 uppercase font-bold tracking-wider">Avg Days Used</div>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 w-fit">
                {(['Requests', 'Balances', 'Calendar'] as LeaveTab[]).map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={`px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === t ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        {t}
                        {t === 'Requests' && pending.length > 0 && (
                            <span className="ml-2 bg-amber-500 text-black text-[8px] rounded-full px-1.5 py-0.5">{pending.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* REQUESTS TAB */}
            {activeTab === 'Requests' && (
                <div className="flex flex-col gap-4 flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition ${filterStatus === s ? 'bg-zinc-800 text-white border-zinc-700' : 'text-zinc-600 border-zinc-800 hover:text-zinc-400'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowRequestForm(p => !p)}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition">
                            <Plus className="w-3.5 h-3.5" /> New Request
                        </button>
                    </div>

                    {showRequestForm && (
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 animate-slideUp">
                            <h4 className="text-xs font-bold text-zinc-300 mb-4 uppercase tracking-wider">New Leave Request</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Staff Member</label>
                                    <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none" value={newRequest.employeeId} onChange={e => setNewRequest(p => ({ ...p, employeeId: e.target.value }))}>
                                        <option value="">Select staff...</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Leave Type</label>
                                    <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none" value={newRequest.type} onChange={e => setNewRequest(p => ({ ...p, type: e.target.value }))}>
                                        {Object.keys(LEAVE_TYPE_COLORS).map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Start Date</label>
                                    <input type="date" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none" value={newRequest.startDate} onChange={e => setNewRequest(p => ({ ...p, startDate: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">End Date</label>
                                    <input type="date" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none" value={newRequest.endDate} onChange={e => setNewRequest(p => ({ ...p, endDate: e.target.value }))} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Reason (optional)</label>
                                    <input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none" placeholder="Brief reason..." value={newRequest.reason} onChange={e => setNewRequest(p => ({ ...p, reason: e.target.value }))} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setShowRequestForm(false)} className="px-4 py-2 text-zinc-500 hover:text-white border border-zinc-800 rounded-xl text-xs transition">Cancel</button>
                                <button onClick={handleSubmitRequest}
                                    className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition">Submit Request</button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 space-y-3 overflow-y-auto">
                        {filtered.map(req => (
                            <div key={req.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-700 transition">
                                {/* Type badge */}
                                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border flex-shrink-0 ${LEAVE_TYPE_COLORS[req.type] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                                    {req.type}
                                </span>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-zinc-200">{req.employeeName}</div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">
                                        {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()} · {req.daysRequested} days
                                        {req.reason && <span className="ml-2 text-zinc-600">· {req.reason}</span>}
                                    </div>
                                </div>

                                {/* Status */}
                                {/* Status — only show approve/reject to authorized roles */}
                                <div>
                                    {req.status === 'Pending' ? (
                                        canApprove ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleApprove(req.id)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleReject(req.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border text-amber-400 bg-amber-500/10 border-amber-500/20">Awaiting Approval</span>
                                        )
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${req.status === 'Approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                            req.status === 'Rejected' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                                'text-zinc-400 bg-zinc-800 border-zinc-700'
                                            }`}>{req.status}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="text-center text-zinc-600 py-12 text-sm">No leave requests found.</div>
                        )}
                    </div>
                </div>
            )}

            {/* BALANCES TAB */}
            {activeTab === 'Balances' && (
                <div className="flex-1 overflow-hidden">
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-xs text-zinc-400">
                            <thead className="bg-zinc-950/60 text-zinc-600 uppercase text-[9px] tracking-wider font-bold">
                                <tr>
                                    <th className="px-4 py-3 text-left">Staff Member</th>
                                    <th className="px-4 py-3 text-center" colSpan={3}>Annual Leave</th>
                                    <th className="px-4 py-3 text-center" colSpan={2}>Sick Leave</th>
                                </tr>
                                <tr>
                                    <th className="px-4 py-2"></th>
                                    <th className="px-4 py-2 text-center text-zinc-700">Entitled</th>
                                    <th className="px-4 py-2 text-center text-rose-800">Used</th>
                                    <th className="px-4 py-2 text-center text-emerald-800">Remaining</th>
                                    <th className="px-4 py-2 text-center text-rose-800">Used</th>
                                    <th className="px-4 py-2 text-center text-emerald-800">Remaining</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {balances.map(b => {
                                    const member = staff.find(s => s.id === b.employeeId);
                                    const annualUsedPct = b.annual.used / b.annual.entitled;
                                    return (
                                        <tr key={b.employeeId} className="hover:bg-zinc-800/20 transition">
                                            <td className="px-4 py-3 font-medium text-zinc-200">{member?.fullName ?? b.employeeId}</td>
                                            <td className="px-4 py-3 text-center text-zinc-400">{b.annual.entitled}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${annualUsedPct > 0.8 ? 'bg-rose-500' : annualUsedPct > 0.5 ? 'bg-amber-500' : 'bg-violet-500'}`} style={{ width: `${annualUsedPct * 100}%` }} />
                                                    </div>
                                                    <span className={annualUsedPct > 0.8 ? 'text-rose-400' : 'text-zinc-400'}>{b.annual.used}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-emerald-400 font-bold">{b.annual.remaining}</td>
                                            <td className="px-4 py-3 text-center text-zinc-400">{b.sick.used}</td>
                                            <td className="px-4 py-3 text-center text-emerald-400">{b.sick.remaining}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CALENDAR TAB */}
            {activeTab === 'Calendar' && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-zinc-600">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-sm">Team absence calendar view</p>
                        <p className="text-xs mt-1 text-zinc-700">Shows all approved leave on a shared team calendar</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveManagement;
