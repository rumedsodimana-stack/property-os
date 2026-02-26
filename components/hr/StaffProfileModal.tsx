import React, { useState } from 'react';
import { EmployeeProfile, Shift, PayrollRun } from '../../types';
import { X, Briefcase, Activity, Calendar, Award, DollarSign, Clock, CheckCircle, ArrowLeft, Receipt, Edit2, Save } from 'lucide-react';
import { updateItem } from '../../services/kernel/firestoreService';

interface StaffProfileModalProps {
    employee: EmployeeProfile;
    shifts: Shift[];
    payrollHistory?: PayrollRun[];
    onClose: () => void;
}

const StaffProfileModal: React.FC<StaffProfileModalProps> = ({ employee, shifts, payrollHistory = [], onClose }) => {
    const [viewMode, setViewMode] = useState<'details' | 'payroll'>('details');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Local state for editing fields
    const [formData, setFormData] = useState({
        role: employee.role,
        hourlyRate: employee.hourlyRate,
        overtimeRate: employee.overtimeRate
    });

    const getPerformanceColor = (score: number) => {
        if (score >= 90) return 'text-teal-400 border-teal-500/50 bg-teal-500/10';
        if (score >= 80) return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
        return 'text-rose-400 border-rose-500/50 bg-rose-500/10';
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            await updateItem('employees', employee.principal, {
                role: formData.role,
                hourlyRate: Number(formData.hourlyRate) || 0,
                overtimeRate: Number(formData.overtimeRate) || 0
            });
            setIsEditing(false);
        } catch (error) {
            setSaveError('Failed to save profile updates. Please retry.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div
                className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Background */}
                <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-zinc-800 to-zinc-950 opacity-50"></div>

                <div className="relative z-10 px-8 pt-8 pb-4 flex justify-between items-start">
                    <div className="flex gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-3xl font-bold text-zinc-500 shadow-xl">
                            {employee.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="pt-2">
                            <h2 className="text-3xl font-bold text-zinc-100">{employee.fullName}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                                    <Briefcase className="w-3 h-3" />
                                    {isEditing ? (
                                        <input
                                            className="bg-zinc-800 border-b border-zinc-600 outline-none text-zinc-100 w-32 h-5 px-1 text-xs"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        />
                                    ) : (
                                        formData.role
                                    )}
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-bold ${getPerformanceColor(employee.aiPerformanceScore || 0)}`}>
                                    <Activity className="w-3 h-3" /> AI Score: {employee.aiPerformanceScore}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition border border-zinc-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {viewMode === 'details' ? (
                    <div className="relative z-10 p-8 overflow-y-auto space-y-6 flex-1">

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Hourly Rate</div>
                                <div className="text-xl font-mono text-zinc-200 flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-zinc-600" />
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            className="bg-zinc-800 border-b border-zinc-600 outline-none text-zinc-100 w-20 px-1 py-0.5 text-lg font-mono"
                                            value={formData.hourlyRate}
                                            onChange={e => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                                        />
                                    ) : (
                                        formData.hourlyRate.toFixed(2)
                                    )}
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Overtime x</div>
                                <div className="text-xl font-mono text-zinc-200">
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            step="0.25"
                                            className="bg-zinc-800 border-b border-zinc-600 outline-none text-zinc-100 w-20 px-1 py-0.5 text-lg font-mono"
                                            value={formData.overtimeRate}
                                            onChange={e => setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) })}
                                        />
                                    ) : (
                                        formData.overtimeRate
                                    )}
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Nationality</div>
                                <div className="text-xl text-zinc-200">{employee.nationality}</div>
                            </div>
                        </div>

                        {/* AI Insight */}
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
                                <Award className="w-4 h-4 text-violet-500" /> Performance Analysis
                            </h3>
                            <div className="space-y-3">
                                {employee.skills.map((skill, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-zinc-400">{skill.name}</span>
                                            <span className="text-zinc-200">{skill.score}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-violet-600 rounded-full" style={{ width: `${skill.score}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {employee.performanceFeedback && employee.performanceFeedback.length > 0 && (
                                <div className="mt-4 p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg">
                                    <p className="text-xs text-violet-300 italic">"{employee.performanceFeedback[0]}"</p>
                                </div>
                            )}
                        </div>

                        {/* Shift History */}
                        <div>
                            <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-teal-500" /> Recent Shifts
                            </h3>
                            <div className="space-y-2">
                                {shifts.slice(0, 3).map(shift => (
                                    <div key={shift.id} className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-zinc-600" />
                                            <div className="text-sm text-zinc-300">
                                                {new Date(shift.start).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono text-zinc-400">
                                            {new Date(shift.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${shift.status === 'Completed' ? 'bg-teal-500/10 text-teal-500' : 'bg-zinc-800 text-zinc-500'
                                            }`}>
                                            {shift.status}
                                        </span>
                                    </div>
                                ))}
                                {shifts.length === 0 && <div className="text-zinc-500 text-xs italic">No recent shifts found.</div>}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Payroll View */
                    <div className="relative z-10 p-8 overflow-y-auto space-y-6 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setViewMode('details')} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-teal-500" /> Payroll History
                            </h3>
                        </div>

                        <div className="space-y-3">
                            {payrollHistory.map((pr) => (
                                <div key={pr.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-sm font-bold text-zinc-200">{new Date(pr.periodStart).toLocaleDateString()} - {new Date(pr.periodEnd).toLocaleDateString()}</div>
                                            <div className="text-xs text-zinc-500">Run ID: {pr.id}</div>
                                        </div>
                                        <div className="px-2 py-1 bg-teal-500/10 text-teal-500 text-xs font-bold rounded uppercase">{pr.status}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                        <div className="flex justify-between border-b border-zinc-800 pb-1">
                                            <span className="text-zinc-500">Base Pay</span>
                                            <span className="text-zinc-300 font-mono">{pr.basePay.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-zinc-800 pb-1">
                                            <span className="text-zinc-500">Overtime</span>
                                            <span className="text-zinc-300 font-mono">{pr.overtimePay.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-zinc-800 pb-1">
                                            <span className="text-zinc-500">Tips</span>
                                            <span className="text-violet-400 font-mono">{pr.tips.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-zinc-800 pb-1">
                                            <span className="text-zinc-500">Deductions</span>
                                            <span className="text-rose-400 font-mono">-{pr.deductions.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs text-zinc-500 uppercase font-bold">Net Pay</span>
                                        <span className="text-xl font-bold text-zinc-100 font-mono">{pr.netPay.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                            {payrollHistory.length === 0 && (
                                <div className="text-center p-8 text-zinc-500 italic">No payroll history found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal Footer */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                    {viewMode === 'details' ? (
                        <>
                            {saveError && (
                                <div className="mr-auto text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                                    {saveError}
                                </div>
                            )}
                            <button
                                onClick={() => setViewMode('payroll')}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
                            >
                                <Receipt className="w-4 h-4" /> View Payroll
                            </button>
                            {isEditing ? (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-teal-900/20 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-violet-900/20 flex items-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit Profile
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => setViewMode('details')}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition"
                        >
                            Back to Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffProfileModal;
