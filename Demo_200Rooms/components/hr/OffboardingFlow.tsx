import React, { useState } from 'react';
import {
    X, AlertTriangle, CheckCircle, Clock, DollarSign,
    Shield, UserX, Loader, ChevronRight, FileText, Trash2, LogOut
} from 'lucide-react';
import { StaffMember, OffboardingChecklist, OffboardingTask, FinalSettlement } from '../../types';

interface OffboardingFlowProps {
    staff: StaffMember[];
}

function calcFinalSettlement(s: StaffMember, exitType: 'Resignation' | 'Termination' | 'EndOfContract' | 'Retirement', unusedLeaveDays: number): FinalSettlement {
    const years = (Date.now() - s.gratuityStartDate) / (1000 * 60 * 60 * 24 * 365.25);
    const dailyRate = s.basicSalary / 30;
    const daysEarned = years <= 5 ? years * 21 : 5 * 21 + (years - 5) * 30;
    const gross = Math.min(dailyRate * daysEarned, s.basicSalary * 24);
    let pct = 1.0;
    if (exitType === 'Resignation') {
        if (years < 1) pct = 0;
        else if (years < 3) pct = 0.33;
        else if (years < 5) pct = 0.66;
    }
    const gratuityAmount = gross * pct;
    const unusedLeavePayout = dailyRate * unusedLeaveDays;
    return {
        employeeId: s.id,
        regularPay: s.basicSalary,
        unusedLeavePayout,
        gratuityAmount,
        noticePay: 0,
        deductions: 0,
        totalNet: s.basicSalary + unusedLeavePayout + gratuityAmount,
        gratuityFormula: `${years.toFixed(2)} yrs × ${daysEarned.toFixed(1)} days × BHD ${dailyRate.toFixed(2)}/day × ${(pct * 100).toFixed(0)}%`,
        calculatedAt: Date.now(),
    };
}

function buildDefaultTasks(exitType: string): OffboardingTask[] {
    const hr: OffboardingTask[] = [
        { id: 'h1', title: 'Complete exit interview', assignedTo: 'HR', dueDate: Date.now() + 2 * 86400000, status: 'Pending' },
        { id: 'h2', title: 'Process final settlement', assignedTo: 'HR', dueDate: Date.now() + 5 * 86400000, status: 'Pending' },
        { id: 'h3', title: 'Update status to Alumni', assignedTo: 'HR', dueDate: Date.now() + 7 * 86400000, status: 'Pending' },
        { id: 'h4', title: 'Archive employee file', assignedTo: 'HR', dueDate: Date.now() + 7 * 86400000, status: 'Pending' },
    ];
    const it: OffboardingTask[] = [
        { id: 'i1', title: 'Revoke system access', assignedTo: 'IT', dueDate: Date.now() + 1 * 86400000, status: 'Pending' },
        { id: 'i2', title: 'Deactivate email/accounts', assignedTo: 'IT', dueDate: Date.now() + 1 * 86400000, status: 'Pending' },
        { id: 'i3', title: 'Collect device & access card', assignedTo: 'IT', dueDate: Date.now() + 2 * 86400000, status: 'Pending' },
    ];
    const ops: OffboardingTask[] = [
        { id: 'o1', title: 'Collect uniforms', assignedTo: 'Operations', dueDate: Date.now() + 3 * 86400000, status: 'Pending' },
        { id: 'o2', title: 'Handover shift duties', assignedTo: 'Manager', dueDate: Date.now() + 3 * 86400000, status: 'Pending' },
        { id: 'o3', title: 'Locker clearance', assignedTo: 'Operations', dueDate: Date.now() + 3 * 86400000, status: 'Pending' },
    ];
    const fin: OffboardingTask[] = [
        { id: 'f1', title: 'Clear outstanding advances', assignedTo: 'Finance', dueDate: Date.now() + 3 * 86400000, status: 'Pending' },
        { id: 'f2', title: 'Generate final payslip', assignedTo: 'Finance', dueDate: Date.now() + 5 * 86400000, status: 'Pending' },
        { id: 'f3', title: 'Process bank transfer', assignedTo: 'Finance', dueDate: Date.now() + 7 * 86400000, status: 'Pending' },
    ];
    return [...hr, ...it, ...ops, ...fin];
}

const TEAM_COLORS: Record<string, string> = {
    HR: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    IT: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    Operations: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Manager: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Finance: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const OffboardingFlow: React.FC<OffboardingFlowProps> = ({ staff }) => {
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [exitType, setExitType] = useState<'Resignation' | 'Termination' | 'EndOfContract' | 'Retirement'>('Resignation');
    const [lastWorkingDay, setLastWorkingDay] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    const [unusedLeaveDays, setUnusedLeaveDays] = useState(5);
    const [checklist, setChecklist] = useState<OffboardingChecklist | null>(null);
    const [initiating, setInitiating] = useState(false);
    const [rehireEligible, setRehireEligible] = useState(true);

    const settlement = selectedStaff ? calcFinalSettlement(selectedStaff, exitType, unusedLeaveDays) : null;

    const handleInitiate = async () => {
        if (!selectedStaff || !settlement) return;
        setInitiating(true);
        await new Promise(r => setTimeout(r, 1200));

        const allTasks = buildDefaultTasks(exitType);
        setChecklist({
            id: `ob-${Date.now()}`,
            employeeId: selectedStaff.id,
            employeeName: selectedStaff.fullName,
            exitType,
            lastWorkingDay: new Date(lastWorkingDay).getTime(),
            noticePeriodServed: true,
            initiatedAt: Date.now(),
            initiatedBy: 'HR Manager',
            hrTasks: allTasks.filter(t => t.assignedTo === 'HR'),
            itTasks: allTasks.filter(t => t.assignedTo === 'IT'),
            opsTasks: allTasks.filter(t => t.assignedTo === 'Operations' || t.assignedTo === 'Manager'),
            financeTasks: allTasks.filter(t => t.assignedTo === 'Finance'),
            finalSettlement: settlement,
            status: 'In Progress',
            accessRevoked: false,
            alumniArchived: false,
        });
        setInitiating(false);
    };

    const toggleTask = (taskId: string) => {
        if (!checklist) return;
        const update = (tasks: OffboardingTask[]) =>
            tasks.map(t => t.id === taskId
                ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed', completedAt: Date.now(), completedBy: 'HR' } as OffboardingTask
                : t);
        setChecklist(p => p ? { ...p, hrTasks: update(p.hrTasks), itTasks: update(p.itTasks), opsTasks: update(p.opsTasks), financeTasks: update(p.financeTasks) } : p);
    };

    const allTasks = checklist ? [...checklist.hrTasks, ...checklist.itTasks, ...checklist.opsTasks, ...checklist.financeTasks] : [];
    const completedCount = allTasks.filter(t => t.status === 'Completed').length;
    const progress = allTasks.length ? Math.round(completedCount / allTasks.length * 100) : 0;

    const renderTaskGroup = (label: string, tasks: OffboardingTask[]) => (
        <div>
            <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-2">{label}</div>
            <div className="space-y-1.5">
                {tasks.map(t => (
                    <div key={t.id}
                        onClick={() => toggleTask(t.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${t.status === 'Completed' ? 'bg-emerald-500/5 border-emerald-500/10 opacity-70' : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${t.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700'}`}>
                            {t.status === 'Completed' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-xs flex-1 ${t.status === 'Completed' ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>{t.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${TEAM_COLORS[t.assignedTo] || 'text-zinc-500 bg-zinc-800 border-zinc-700'}`}>
                            {t.assignedTo}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-6 animate-fadeIn">
            {!checklist ? (
                /* Initiation Form */
                <div className="flex gap-6 flex-1">
                    {/* Staff picker */}
                    <div className="w-72 flex flex-col gap-3">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Select Departing Staff</div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {staff.filter(s => s.status === 'Active').map(s => (
                                <div key={s.id} onClick={() => setSelectedStaff(s)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedStaff?.id === s.id ? 'border-rose-500/40 bg-rose-500/5' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}>
                                    <div className="text-xs font-medium text-zinc-200">{s.fullName}</div>
                                    <div className="text-[10px] text-zinc-500 mt-0.5">{s.departmentName} · {s.jobTitle}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1">
                        {!selectedStaff ? (
                            <div className="h-full flex items-center justify-center text-zinc-600">
                                <div className="text-center">
                                    <LogOut className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Select a staff member to begin the offboarding process</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Exit details */}
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
                                    <h4 className="text-sm font-semibold text-zinc-200">Exit Details — {selectedStaff.fullName}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Exit Type</label>
                                            <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none"
                                                value={exitType} onChange={e => setExitType(e.target.value as any)}>
                                                <option>Resignation</option>
                                                <option>Termination</option>
                                                <option>EndOfContract</option>
                                                <option>Retirement</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Last Working Day</label>
                                            <input type="date" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none"
                                                value={lastWorkingDay} onChange={e => setLastWorkingDay(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Unused Leave Days</label>
                                            <input type="number" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none"
                                                value={unusedLeaveDays} min={0} max={30} onChange={e => setUnusedLeaveDays(Number(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Rehire Eligible?</label>
                                            <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none"
                                                value={rehireEligible ? 'Yes' : 'No'} onChange={e => setRehireEligible(e.target.value === 'Yes')}>
                                                <option>Yes</option><option>No</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Final Settlement Preview */}
                                {settlement && (
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                                        <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-4 flex items-center gap-2">
                                            <DollarSign className="w-3.5 h-3.5" /> Final Settlement Preview
                                        </h4>
                                        <div className="space-y-2 text-xs">
                                            {[
                                                { label: 'Regular Pay (pro-rated)', value: settlement.regularPay },
                                                { label: 'Unused Leave Payout', value: settlement.unusedLeavePayout },
                                                { label: 'Gratuity', value: settlement.gratuityAmount },
                                            ].map(row => (
                                                <div key={row.label} className="flex justify-between">
                                                    <span className="text-zinc-500">{row.label}</span>
                                                    <span className="font-mono text-zinc-200">BHD {row.value.toFixed(2)}</span>
                                                </div>
                                            ))}
                                            <div className="border-t border-zinc-800 pt-2 flex justify-between font-bold">
                                                <span className="text-zinc-300">Total Net</span>
                                                <span className="font-mono text-emerald-400 text-base">BHD {settlement.totalNet.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-[10px] text-zinc-600 font-mono">{settlement.gratuityFormula}</div>
                                    </div>
                                )}

                                <button onClick={handleInitiate} disabled={initiating}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition">
                                    {initiating ? <Loader className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                                    {initiating ? 'Initiating...' : 'Initiate Offboarding'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Active Checklist View */
                <div className="flex-1 flex flex-col gap-5">
                    {/* Header */}
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-lg font-light text-white">{checklist.employeeName}</div>
                                <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
                                    {checklist.exitType} · Last Day: {new Date(checklist.lastWorkingDay).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-2xl font-bold ${progress === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>{progress}%</div>
                                <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Complete</div>
                            </div>
                        </div>
                        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-rose-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-zinc-600 mt-1.5">
                            <span>{completedCount} completed</span>
                            <span>{allTasks.length - completedCount} remaining</span>
                        </div>
                    </div>

                    {/* Task Groups */}
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-5">
                        <div className="space-y-5 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                            {renderTaskGroup('HR Tasks', checklist.hrTasks)}
                            {renderTaskGroup('IT & Systems', checklist.itTasks)}
                        </div>
                        <div className="space-y-5 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                            {renderTaskGroup('Operations', checklist.opsTasks)}
                            {renderTaskGroup('Finance', checklist.financeTasks)}
                        </div>
                    </div>

                    {/* Final Settlement Banner */}
                    {checklist.finalSettlement && (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                            <div className="text-xs text-zinc-400">
                                Final settlement: <span className="text-emerald-400 font-bold">BHD {checklist.finalSettlement.totalNet.toFixed(2)}</span>
                                <span className="text-zinc-600 ml-2">· {checklist.finalSettlement.gratuityFormula}</span>
                            </div>
                            {progress === 100 && (
                                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold"><CheckCircle className="w-4 h-4" /> Ready to Process</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OffboardingFlow;
