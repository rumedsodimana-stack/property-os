import React, { useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, User, Edit3, Save, X } from 'lucide-react';
import { StaffMember, AttendanceLog } from '../../types';

interface TimeAttendanceProps { staff: StaffMember[] }

import { attendanceService, getTodayAttendance } from '../../services/operations/attendanceService';

const STATUS_CONFIG: Record<string, string> = {
    Present: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Late: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Absent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    OnLeave: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    Holiday: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    Off: 'bg-zinc-700/50 text-zinc-500 border-zinc-700',
};

const TimeAttendance: React.FC<TimeAttendanceProps> = ({ staff }) => {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        loadLogs();
    }, [staff]);

    const loadLogs = async () => {
        setLoading(true);
        const data = await getTodayAttendance(staff);
        setLogs(data);
        setLoading(false);
    };

    const handleClockIn = async (employeeId: string, scheduledStart?: string, scheduledEnd?: string) => {
        await attendanceService.clockIn(employeeId, scheduledStart, scheduledEnd);
        loadLogs();
    };

    const handleClockOut = async (logId: string) => {
        await attendanceService.clockOut(logId);
        loadLogs();
    };

    const handleMarkAbsent = async (employeeId: string) => {
        await attendanceService.markAbsent(employeeId);
        loadLogs();
    };

    const present = logs.filter(l => l.status === 'Present').length;
    const late = logs.filter(l => l.status === 'Late').length;
    const absent = logs.filter(l => l.status === 'Absent').length;
    const totalOT = logs.reduce((s, l) => s + (l.overtimeHours ?? 0), 0);

    const fmt = (ts?: number) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

    return (
        <div className="flex flex-col h-full gap-6 animate-fadeIn">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Present Today', value: present, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
                    { label: 'Late Arrivals', value: late, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
                    { label: 'Absent', value: absent, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5' },
                    { label: 'Total OT Hours', value: `${totalOT.toFixed(1)}h`, color: 'text-violet-400', border: 'border-violet-500/20', bg: 'bg-violet-500/5' },
                ].map(k => (
                    <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-4 flex items-center gap-3`}>
                        <Clock className={`w-5 h-5 ${k.color} flex-shrink-0`} />
                        <div>
                            <div className={`text-2xl font-light ${k.color}`}>{k.value}</div>
                            <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-zinc-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Today's Attendance Feed</span>
                    <span className="text-[10px] text-zinc-600">{new Date().toDateString()}</span>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-xs text-zinc-400">
                        <thead className="bg-zinc-950/60 text-zinc-600 uppercase text-[9px] tracking-wider font-bold sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Staff Member</th>
                                <th className="px-4 py-3">Scheduled</th>
                                <th className="px-4 py-3">Clock In</th>
                                <th className="px-4 py-3">Clock Out</th>
                                <th className="px-4 py-3">Hours</th>
                                <th className="px-4 py-3">OT</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Override</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {logs.map(log => {
                                const member = staff.find(s => s.id === log.employeeId);
                                return (
                                    <tr key={log.id} className="hover:bg-zinc-800/20 transition">
                                        <td className="px-4 py-3 font-medium text-zinc-200">{member?.fullName ?? log.employeeId}</td>
                                        <td className="px-4 py-3 font-mono text-zinc-600">{log.scheduledStart} – {log.scheduledEnd}</td>
                                        <td className="px-4 py-3 font-mono">
                                            {log.status === 'Absent' ? '—' : <span className={log.lateMinutes ? 'text-amber-400' : 'text-zinc-300'}>{fmt(log.actualClockIn)}{log.lateMinutes ? ` (+${log.lateMinutes}m)` : ''}</span>}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-zinc-300">{fmt(log.actualClockOut)}</td>
                                        <td className="px-4 py-3 font-mono text-zinc-300">{log.totalHoursWorked?.toFixed(1) ?? '—'}h</td>
                                        <td className="px-4 py-3 font-mono text-teal-400">{(log.overtimeHours ?? 0) > 0 ? `+${log.overtimeHours}h` : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${STATUS_CONFIG[log.status] ?? ''}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            {log.status === 'Off' && (
                                                <>
                                                    <button onClick={() => handleClockIn(log.employeeId, log.scheduledStart, log.scheduledEnd)} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/20 transition">In</button>
                                                    <button onClick={() => handleMarkAbsent(log.employeeId)} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded border border-rose-500/20 transition">Abs</button>
                                                </>
                                            )}
                                            {(log.status === 'Present' || log.status === 'Late') && !log.actualClockOut && (
                                                <button onClick={() => handleClockOut(log.id)} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded border border-amber-500/20 transition">Out</button>
                                            )}
                                            <button onClick={() => setEditingId(editingId === log.id ? null : log.id)}
                                                className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-500 hover:text-white transition ml-auto">
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TimeAttendance;
