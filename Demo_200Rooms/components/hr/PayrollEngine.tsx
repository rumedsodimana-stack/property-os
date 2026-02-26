import React, { useState, useMemo } from 'react';
import {
    DollarSign, Calculator, CheckCircle, Lock, Send,
    AlertTriangle, ChevronDown, ChevronUp, Download,
    Loader, Eye, TrendingUp, Wallet, Gift, Percent, Globe, Clock
} from 'lucide-react';
import { StaffMember, FullPayrollRun, PayrollEntry, FinalSettlement, Deduction, Benefit } from '../../types';

interface PayrollEngineProps {
    staff: StaffMember[];
    posRevenue?: number;
    totalTips?: number;
    serviceChargePool?: number;
}

// Tax jurisdictions
const TAX_JURISDICTIONS: Record<string, { label: string; rate: number }> = {
    BHD: { label: 'Bahrain (BHD)', rate: 0 },
    USD: { label: 'USA (USD)', rate: 0.22 },
    AED: { label: 'UAE (AED)', rate: 0.05 },
    SAR: { label: 'Saudi Arabia (SAR)', rate: 0 },
    EUR: { label: 'Europe (EUR)', rate: 0.25 },
};

function calcYearsServed(startDate: number): number {
    return (Date.now() - startDate) / (1000 * 60 * 60 * 24 * 365.25);
}

function calcGratuityAccrual(staff: StaffMember): number {
    const dailyRate = staff.basicSalary / 30;
    return dailyRate * 21 / 12;
}

function calcFinalSettlement(staff: StaffMember, exitType: 'Resignation' | 'Termination' | 'EndOfContract' | 'Retirement', unusedLeaveDays: number): FinalSettlement {
    const years = calcYearsServed(staff.gratuityStartDate);
    const dailyRate = staff.basicSalary / 30;
    const daysEarned = years <= 5 ? years * 21 : (5 * 21) + (years - 5) * 30;
    const grossGratuity = Math.min(dailyRate * daysEarned, staff.basicSalary * 24);
    let pct = 1.0;
    if (exitType === 'Resignation') {
        if (years < 1) pct = 0;
        else if (years < 3) pct = 0.33;
        else if (years < 5) pct = 0.66;
    }
    const gratuityAmount = grossGratuity * pct;
    const unusedLeavePayout = (staff.basicSalary / 30) * unusedLeaveDays;
    return {
        employeeId: staff.id,
        regularPay: staff.basicSalary,
        unusedLeavePayout,
        gratuityAmount,
        noticePay: 0,
        deductions: 0,
        totalNet: staff.basicSalary + unusedLeavePayout + gratuityAmount,
        gratuityFormula: `${years.toFixed(2)} yrs × ${years <= 5 ? 21 : 30} days × ${dailyRate.toFixed(2)}/day × ${(pct * 100).toFixed(0)}%`,
        calculatedAt: Date.now(),
    };
}

function getMockBenefits(s: StaffMember): Benefit[] {
    // In production, pull from StaffMember benefits field / payGrade
    return [
        { name: 'Housing Allowance', amount: s.basicSalary * 0.15, taxable: false },
        { name: 'Transport', amount: s.basicSalary * 0.05, taxable: false },
        { name: 'Meals', amount: 30, taxable: false },
    ];
}

function buildPayrollEntry(s: StaffMember, tipsShare: number, scShare: number, taxRate: number, regularHours = 160, otHours = 0): PayrollEntry {
    const basicPay = s.basicSalary;
    const overtimePay = (s.hourlyRate * s.overtimeRate) * otHours;
    const allowancesTotal = (s.allowances ?? []).reduce((sum, a) => sum + a.amount, 0);
    const benefits = getMockBenefits(s);
    const benefitTotal = benefits.reduce((sum, b) => sum + b.amount, 0);
    const bonusAmount = basicPay * 0.05; // 5% performance bonus mock
    const grossPay = basicPay + overtimePay + tipsShare + scShare + allowancesTotal + benefitTotal + bonusAmount;

    const deductions: Deduction[] = [
        { name: 'Social Insurance', amount: basicPay * 0.07, type: 'Percentage', isRecurring: true },
        { name: 'Health Deduction', amount: basicPay * 0.01, type: 'Percentage', isRecurring: true },
    ];
    if (taxRate > 0) {
        deductions.push({ name: `Income Tax (${(taxRate * 100).toFixed(0)}%)`, amount: basicPay * taxRate, type: 'Percentage', isRecurring: true });
    }
    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
    const gratuityAccrued = calcGratuityAccrual(s);

    return {
        employeeId: s.id,
        employeeName: s.fullName,
        jobTitle: s.jobTitle,
        costCenterId: s.costCenterId,
        departmentName: s.departmentName,
        basicPay,
        overtimePay,
        holidayPay: 0,
        tips: tipsShare,
        serviceChargeShare: scShare,
        allowances: allowancesTotal + benefitTotal + bonusAmount,
        grossPay,
        deductions,
        totalDeductions,
        benefits,
        taxJurisdiction: 'BHD',
        taxRate,
        netPay: grossPay - totalDeductions,
        gratuityAccrued,
    };
}

// YTD mock: assume this is month N of fiscal year
const CURRENT_MONTH = new Date().getMonth() + 1;

const STATUS_STEPS = ['Draft', 'Under Review', 'Approved', 'Locked', 'Posted'];

const PayrollEngine: React.FC<PayrollEngineProps> = ({ staff, posRevenue = 0, totalTips = 0, serviceChargePool = 0 }) => {
    const [runStatus, setRunStatus] = useState<FullPayrollRun['status']>('Draft');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);
    const [posted, setPosted] = useState(false);
    const [showGLPreview, setShowGLPreview] = useState(false);
    const [taxJurisdictionKey, setTaxJurisdictionKey] = useState('BHD');

    const period = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const cy = taxJurisdictionKey;
    const taxJurisdiction = TAX_JURISDICTIONS[taxJurisdictionKey];

    const activeStaff = staff.filter(s => s.status === 'Active' || s.status === 'OnLeave');
    const tipsShare = activeStaff.length ? totalTips / activeStaff.length : 0;
    const scShare = activeStaff.length ? serviceChargePool / activeStaff.length : 0;

    const entries = useMemo(() =>
        activeStaff.map(s => buildPayrollEntry(s, tipsShare, scShare, taxJurisdiction.rate)),
        [activeStaff, tipsShare, scShare, taxJurisdiction]
    );

    const totals = useMemo(() => ({
        headcount: entries.length,
        grossPay: entries.reduce((s, e) => s + e.grossPay, 0),
        deductions: entries.reduce((s, e) => s + e.totalDeductions, 0),
        netPay: entries.reduce((s, e) => s + e.netPay, 0),
        gratuity: entries.reduce((s, e) => s + e.gratuityAccrued, 0),
        overtime: entries.reduce((s, e) => s + e.overtimePay, 0),
        tips: entries.reduce((s, e) => s + e.tips, 0),
        benefits: entries.reduce((s, e) => s + (e.benefits ?? []).reduce((b, bf) => b + bf.amount, 0), 0),
    }), [entries]);

    // YTD: simple projection based on current month
    const ytd = {
        gross: totals.grossPay * CURRENT_MONTH,
        net: totals.netPay * CURRENT_MONTH,
        tax: totals.deductions * CURRENT_MONTH,
        gratuity: totals.gratuity * CURRENT_MONTH,
    };

    const laborCostPct = posRevenue > 0 ? (totals.grossPay / posRevenue) * 100 : 0;

    const glEntries = [
        { account: 'Salary Expense — F&B', dr: entries.filter(e => e.costCenterId.includes('outlet')).reduce((s, e) => s + e.grossPay, 0), cr: 0 },
        { account: 'Salary Expense — Rooms', dr: entries.filter(e => e.costCenterId.includes('rooms')).reduce((s, e) => s + e.grossPay, 0), cr: 0 },
        { account: 'Salary Expense — Other', dr: entries.filter(e => !e.costCenterId.includes('outlet') && !e.costCenterId.includes('rooms')).reduce((s, e) => s + e.grossPay, 0), cr: 0 },
        { account: 'Gratuity Provision', dr: totals.gratuity, cr: 0 },
        { account: 'Bank / Payable', dr: 0, cr: totals.netPay },
        { account: 'Social Insurance Payable', dr: 0, cr: totals.deductions },
    ];

    const handlePost = async () => {
        setPosting(true);
        await new Promise(r => setTimeout(r, 1800));
        setPosting(false);
        setPosted(true);
        setRunStatus('Posted');
    };

    const stepIndex = STATUS_STEPS.indexOf(runStatus);

    return (
        <div className="flex flex-col h-full gap-5 animate-fadeIn">

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-zinc-900 via-violet-900/10 to-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                        <h3 className="text-xl font-light text-white">{period} Payroll Run</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                            {activeStaff.length} active staff · {taxJurisdiction.label}
                            {laborCostPct > 0 && <span className="ml-3 text-amber-400">Labor Cost: {laborCostPct.toFixed(1)}% of revenue</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Tax Jurisdiction Selector */}
                        <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-zinc-500" />
                            <select
                                value={taxJurisdictionKey}
                                onChange={e => setTaxJurisdictionKey(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] rounded-lg px-2 py-1.5"
                            >
                                {Object.entries(TAX_JURISDICTIONS).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label} ({(v.rate * 100).toFixed(0)}%)</option>
                                ))}
                            </select>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${runStatus === 'Posted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                runStatus === 'Approved' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}>
                            {runStatus}
                        </div>
                    </div>
                </div>

                {/* Status Pipeline */}
                <div className="flex items-center gap-2">
                    {STATUS_STEPS.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${i < stepIndex ? 'bg-emerald-500 text-white' :
                                        i === stepIndex ? 'bg-violet-600 text-white ring-2 ring-violet-400/30' :
                                            'bg-zinc-800 text-zinc-600'
                                    }`}>
                                    {i < stepIndex ? '✓' : i + 1}
                                </div>
                                <span className={`text-[8px] uppercase font-bold tracking-wider ${i === stepIndex ? 'text-violet-400' : 'text-zinc-600'}`}>{s}</span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 rounded-full mb-3 transition-all duration-500 ${i < stepIndex ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {[
                    { label: 'Headcount', value: totals.headcount.toString(), icon: null, color: 'text-zinc-200' },
                    { label: 'Gross Pay', value: `${cy} ${totals.grossPay.toFixed(0)}`, icon: null, color: 'text-violet-400' },
                    { label: 'Benefits', value: `${cy} ${totals.benefits.toFixed(0)}`, icon: <Gift className="w-3 h-3" />, color: 'text-teal-400' },
                    { label: 'Deductions', value: `${cy} ${totals.deductions.toFixed(0)}`, icon: null, color: 'text-rose-400' },
                    { label: 'Net Pay', value: `${cy} ${totals.netPay.toFixed(0)}`, icon: null, color: 'text-emerald-400' },
                    { label: 'Overtime', value: `${cy} ${totals.overtime.toFixed(0)}`, icon: <Clock className="w-3 h-3" />, color: 'text-amber-400' },
                    { label: 'Gratuity', value: `${cy} ${totals.gratuity.toFixed(0)}`, icon: null, color: 'text-sky-400' },
                    { label: `YTD Net (${CURRENT_MONTH}mo)`, value: `${cy} ${(ytd.net / 1000).toFixed(0)}k`, icon: <TrendingUp className="w-3 h-3" />, color: 'text-indigo-400' },
                ].map(k => (
                    <div key={k.label} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                        {k.icon && <div className={`flex justify-center mb-1 ${k.color} opacity-60`}>{k.icon}</div>}
                        <div className={`text-sm font-light ${k.color}`}>{k.value}</div>
                        <div className="text-[8px] text-zinc-600 uppercase tracking-wider mt-1 font-bold leading-tight">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Payroll Table */}
            <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Staff Payroll Entries</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowGLPreview(p => !p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition"
                        >
                            <Eye className="w-3 h-3" /> GL Preview
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition">
                            <Download className="w-3 h-3" /> Export
                        </button>
                    </div>
                </div>

                {/* GL Preview */}
                {showGLPreview && (
                    <div className="p-4 bg-zinc-950/50 border-b border-zinc-800">
                        <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">GL Journal — {period}</h4>
                        <div className="space-y-1.5">
                            {glEntries.filter(g => g.dr > 0 || g.cr > 0).map((g, i) => (
                                <div key={i} className="flex justify-between text-xs font-mono text-zinc-400">
                                    <span className={`text-left ${g.dr > 0 ? 'pl-0' : 'pl-8 text-zinc-600'}`}>
                                        {g.dr > 0 ? 'Dr' : 'Cr'} &nbsp; {g.account}
                                    </span>
                                    <span className={g.dr > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                        {cy} {g.dr > 0 ? g.dr.toFixed(2) : g.cr.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-xs text-zinc-400">
                        <thead className="bg-zinc-950/60 text-zinc-600 uppercase text-[9px] tracking-wider font-bold sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Dept</th>
                                <th className="px-4 py-3">Basic</th>
                                <th className="px-4 py-3">OT</th>
                                <th className="px-4 py-3 text-teal-400">Benefits</th>
                                <th className="px-4 py-3 text-violet-400">Tips</th>
                                <th className="px-4 py-3">Gross</th>
                                <th className="px-4 py-3 text-rose-400">Deductions</th>
                                <th className="px-4 py-3 text-emerald-400">Net Pay</th>
                                <th className="px-4 py-3 text-sky-400">Gratuity</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {entries.map(entry => {
                                const benefitTotal = (entry.benefits ?? []).reduce((s, b) => s + b.amount, 0);
                                const ytdGross = entry.grossPay * CURRENT_MONTH;
                                const ytdNet = entry.netPay * CURRENT_MONTH;
                                const ytdTax = entry.deductions.find(d => d.name.includes('Tax'))?.amount ?? 0;
                                return (
                                    <React.Fragment key={entry.employeeId}>
                                        <tr
                                            className="hover:bg-zinc-800/30 transition cursor-pointer"
                                            onClick={() => setExpandedRow(p => p === entry.employeeId ? null : entry.employeeId)}
                                        >
                                            <td className="px-4 py-3 font-medium text-zinc-200">{entry.employeeName}</td>
                                            <td className="px-4 py-3 text-zinc-600">{entry.departmentName}</td>
                                            <td className="px-4 py-3 font-mono">{entry.basicPay.toFixed(0)}</td>
                                            <td className="px-4 py-3 font-mono text-teal-500">{entry.overtimePay > 0 ? `+${entry.overtimePay.toFixed(0)}` : '—'}</td>
                                            <td className="px-4 py-3 font-mono text-teal-400">{benefitTotal > 0 ? `+${benefitTotal.toFixed(0)}` : '—'}</td>
                                            <td className="px-4 py-3 font-mono text-violet-400">{entry.tips > 0 ? `+${entry.tips.toFixed(0)}` : '—'}</td>
                                            <td className="px-4 py-3 font-mono font-bold text-zinc-100">{entry.grossPay.toFixed(0)}</td>
                                            <td className="px-4 py-3 font-mono text-rose-400">-{entry.totalDeductions.toFixed(0)}</td>
                                            <td className="px-4 py-3 font-mono font-bold text-emerald-400">{entry.netPay.toFixed(0)}</td>
                                            <td className="px-4 py-3 font-mono text-sky-400">+{entry.gratuityAccrued.toFixed(0)}</td>
                                            <td className="px-4 py-3">
                                                {expandedRow === entry.employeeId ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            </td>
                                        </tr>
                                        {expandedRow === entry.employeeId && (
                                            <tr className="bg-zinc-950/40">
                                                <td colSpan={11} className="px-8 py-5">
                                                    <div className="grid grid-cols-4 gap-5 text-[10px]">
                                                        {/* Earnings */}
                                                        <div>
                                                            <div className="text-zinc-500 font-bold uppercase tracking-wider mb-2">Earnings</div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between"><span className="text-zinc-500">Basic Pay</span><span className="font-mono text-zinc-200">{cy} {entry.basicPay.toFixed(2)}</span></div>
                                                                <div className="flex justify-between"><span className="text-zinc-500">Overtime</span><span className="font-mono text-teal-400">{cy} {entry.overtimePay.toFixed(2)}</span></div>
                                                                <div className="flex justify-between"><span className="text-zinc-500">Tips</span><span className="font-mono text-violet-400">{cy} {entry.tips.toFixed(2)}</span></div>
                                                                <div className="flex justify-between"><span className="text-zinc-500">Allowances</span><span className="font-mono text-zinc-300">{cy} {entry.allowances.toFixed(2)}</span></div>
                                                                <div className="flex justify-between border-t border-zinc-800 pt-1 mt-1">
                                                                    <span className="font-bold text-zinc-300">Gross</span>
                                                                    <span className="font-mono font-bold text-zinc-100">{cy} {entry.grossPay.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Benefits */}
                                                        <div>
                                                            <div className="text-zinc-500 font-bold uppercase tracking-wider mb-2">Benefits (Non-taxable)</div>
                                                            <div className="space-y-1">
                                                                {(entry.benefits ?? []).map((b, i) => (
                                                                    <div key={i} className="flex justify-between">
                                                                        <span className="text-zinc-500">{b.name}</span>
                                                                        <span className="font-mono text-teal-400">{cy} {b.amount.toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                                {(entry.benefits ?? []).length === 0 && <div className="text-zinc-700">No benefits</div>}
                                                            </div>
                                                        </div>
                                                        {/* Deductions */}
                                                        <div>
                                                            <div className="text-zinc-500 font-bold uppercase tracking-wider mb-2">Deductions</div>
                                                            <div className="space-y-1">
                                                                {entry.deductions.map((d, i) => (
                                                                    <div key={i} className="flex justify-between">
                                                                        <span className="text-zinc-500">{d.name}</span>
                                                                        <span className="font-mono text-rose-400">-{cy} {d.amount.toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                                <div className="flex justify-between border-t border-zinc-800 pt-1 mt-1 font-bold">
                                                                    <span className="text-zinc-300">Net Pay</span>
                                                                    <span className="font-mono text-emerald-400">{cy} {entry.netPay.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* YTD + Gratuity */}
                                                        <div>
                                                            <div className="text-zinc-500 font-bold uppercase tracking-wider mb-2">YTD ({CURRENT_MONTH} months)</div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between"><span className="text-zinc-500">YTD Gross</span><span className="font-mono text-zinc-300">{cy} {ytdGross.toFixed(0)}</span></div>
                                                                <div className="flex justify-between"><span className="text-zinc-500">YTD Net</span><span className="font-mono text-emerald-400">{cy} {ytdNet.toFixed(0)}</span></div>
                                                                <div className="flex justify-between"><span className="text-zinc-500">YTD Tax</span><span className="font-mono text-rose-400">-{cy} {(ytdTax * CURRENT_MONTH).toFixed(0)}</span></div>
                                                                <div className="h-px bg-zinc-800 my-1" />
                                                                <div className="flex justify-between"><span className="text-zinc-500">Monthly Gratuity</span><span className="font-mono text-sky-400">+{cy} {entry.gratuityAccrued.toFixed(2)}</span></div>
                                                                <div className="flex justify-between"><span className="text-zinc-500">YTD Gratuity</span><span className="font-mono text-sky-400">+{cy} {(entry.gratuityAccrued * CURRENT_MONTH).toFixed(0)}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-between items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                <div className="text-xs text-zinc-500">
                    {posted ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Payroll posted to GL — {new Date().toLocaleString()}
                        </span>
                    ) : (
                        <span>Payroll must be approved before posting. GL entries will be created automatically.</span>
                    )}
                </div>
                <div className="flex gap-3">
                    {runStatus === 'Draft' && (
                        <button onClick={() => setRunStatus('Under Review')} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition">
                            Submit for Review
                        </button>
                    )}
                    {runStatus === 'Under Review' && (
                        <button onClick={() => setRunStatus('Approved')} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition">
                            Approve Run
                        </button>
                    )}
                    {runStatus === 'Approved' && (
                        <button onClick={() => setRunStatus('Locked')} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition">
                            <Lock className="w-3.5 h-3.5" /> Lock Payroll
                        </button>
                    )}
                    {runStatus === 'Locked' && !posted && (
                        <button onClick={handlePost} disabled={posting} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition">
                            {posting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {posting ? 'Posting to GL...' : 'Post to GL'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PayrollEngine;
