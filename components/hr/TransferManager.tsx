import React, { useState } from 'react';
import {
    ArrowRight, MapPin, AlertTriangle, DollarSign,
    CheckCircle, Clock, Calendar, Building2, Loader
} from 'lucide-react';
import { StaffMember, TransferRecord } from '../../types';

interface TransferManagerProps {
    staff: StaffMember[];
}

const DEPARTMENTS = ['F&B', 'Front Office', 'Housekeeping', 'Finance', 'Engineering', 'Security', 'HR'];

function calcCurrentGratuity(s: StaffMember): number {
    const years = (Date.now() - s.gratuityStartDate) / (1000 * 60 * 60 * 24 * 365.25);
    const dailyRate = s.basicSalary / 30;
    const daysEarned = years <= 5 ? years * 21 : 5 * 21 + (years - 5) * 30;
    return Math.min(dailyRate * daysEarned, s.basicSalary * 24);
}

const TransferManager: React.FC<TransferManagerProps> = ({ staff }) => {
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [targetDept, setTargetDept] = useState('');
    const [transferType, setTransferType] = useState<TransferRecord['transferType']>('Internal');
    const [gratuityImpact, setGratuityImpact] = useState<'Continue' | 'Settle'>('Continue');
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);

    const gratuityAmount = selectedStaff ? calcCurrentGratuity(selectedStaff) : 0;
    const yearsServed = selectedStaff
        ? ((Date.now() - selectedStaff.hireDate) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
        : '0';

    const handleSubmit = async () => {
        setProcessing(true);
        await new Promise(r => setTimeout(r, 1500));
        setProcessing(false);
        setDone(true);
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-fadeIn">
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-2xl font-light text-zinc-100">{staff.filter(s => s.transferHistory.length > 0).length}</div>
                    <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider mt-1">Staff Transferred</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-2xl font-light text-amber-400">{staff.filter(s => (s.transferHistory ?? []).some(t => t.transferType === 'Secondment' && !t.endDate)).length}</div>
                    <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider mt-1">Active Secondments</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-2xl font-light text-violet-400">{staff.filter(s => (s.transferHistory ?? []).some(t => t.transferType === 'Property')).length}</div>
                    <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider mt-1">Property Transfers</div>
                </div>
            </div>

            <div className="flex-1 flex gap-5">
                {/* Staff picker */}
                <div className="w-72 flex flex-col gap-3">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Select Staff to Transfer</div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {staff.filter(s => s.status === 'Active').map(s => (
                            <div
                                key={s.id}
                                onClick={() => { setSelectedStaff(s); setTargetDept(''); setDone(false); }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:border-zinc-700 ${selectedStaff?.id === s.id ? 'border-violet-500/40 bg-violet-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}
                            >
                                <div className="text-xs font-medium text-zinc-200">{s.fullName}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">{s.departmentName} · {s.jobTitle}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transfer form */}
                <div className="flex-1">
                    {!selectedStaff ? (
                        <div className="h-full flex items-center justify-center text-zinc-600">
                            <div className="text-center">
                                <ArrowRight className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Select a staff member to initiate a transfer</p>
                            </div>
                        </div>
                    ) : done ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center animate-fadeIn">
                                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                <div className="text-xl font-light text-white mb-2">Transfer Initiated</div>
                                <p className="text-sm text-zinc-400">
                                    {selectedStaff.fullName} will move to {targetDept} effective {effectiveDate}
                                </p>
                                {gratuityImpact === 'Settle' && (
                                    <p className="text-xs text-amber-400 mt-2">Gratuity settlement of BHD {gratuityAmount.toFixed(2)} scheduled</p>
                                )}
                                <button onClick={() => { setSelectedStaff(null); setDone(false); setTargetDept(''); }}
                                    className="mt-4 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs transition">
                                    New Transfer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-4 p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                                <Building2 className="w-5 h-5 text-violet-400 flex-shrink-0" />
                                <div>
                                    <div className="text-sm font-semibold text-zinc-100">{selectedStaff.fullName}</div>
                                    <div className="text-[10px] text-zinc-500">From: {selectedStaff.departmentName} · {yearsServed} yrs service · Gratuity: BHD {gratuityAmount.toFixed(2)}</div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-zinc-600 mx-2" />
                                <div className="flex-1">
                                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
                                        value={targetDept} onChange={e => setTargetDept(e.target.value)}>
                                        <option value="">Select destination department...</option>
                                        {DEPARTMENTS.filter(d => d !== selectedStaff.departmentName).map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Transfer Type</label>
                                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
                                        value={transferType} onChange={e => setTransferType(e.target.value as any)}>
                                        <option>Internal</option><option>Property</option><option>Secondment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Effective Date</label>
                                    <input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/50"
                                        value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
                                </div>
                            </div>

                            {/* Gratuity Impact */}
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Gratuity Impact</span>
                                </div>
                                <div className="flex gap-3 mb-3">
                                    {(['Continue', 'Settle'] as const).map(opt => (
                                        <button key={opt} onClick={() => setGratuityImpact(opt)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition ${gratuityImpact === opt ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}>
                                            {opt === 'Continue' ? '↻ Continue Accrual' : `⬛ Settle Now (BHD ${gratuityAmount.toFixed(2)})`}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-500">
                                    {gratuityImpact === 'Continue'
                                        ? 'Gratuity clock continues uninterrupted. Recommended for internal moves.'
                                        : 'Gratuity will be settled and paid out. Accrual restarts from transfer date. Required for property transfers.'}
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Reason</label>
                                <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-violet-500/50 resize-none"
                                    rows={2} placeholder="Brief reason for transfer..." value={reason} onChange={e => setReason(e.target.value)} />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!targetDept || !reason || processing}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-sm font-bold transition"
                            >
                                {processing ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                {processing ? 'Processing...' : 'Submit Transfer'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransferManager;
