import React, { useState, useEffect } from 'react';
import {
    X, ChevronRight, ChevronLeft, User, Briefcase, Shield,
    CheckCircle, DollarSign, Calendar, UserPlus, Loader, Eye,
    Bot, Zap, Brain, Sparkles
} from 'lucide-react';
import { StaffMember, JobDescription, PayGrade, SystemRole } from '../../types';
import { addItem, subscribeToItems } from '../../services/kernel/firestoreService';
import { agentService, AgentDefinition, ALL_CAPABILITIES } from '../../services/intelligence/agentService';

interface HireWizardProps {
    onClose: () => void;
    onComplete: (member: StaffMember) => void;
}

interface FormData {
    fullName: string;
    nationality: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    jobDescriptionId: string;
    contractType: 'Full-time' | 'Part-time' | 'Seasonal' | 'Contractor';
    hireDate: string;
    basicSalary: string;
    reportingManagerId: string;
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelationship: string;
}

const STEPS = [
    { id: 1, label: 'Personal', icon: User },
    { id: 2, label: 'Role', icon: Briefcase },
    { id: 3, label: 'Permissions', icon: Shield },
    { id: 4, label: 'AI Agent', icon: Bot },
    { id: 5, label: 'Confirm', icon: CheckCircle },
];

const HireWizard: React.FC<HireWizardProps> = ({ onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<JobDescription[]>([]);
    const [payGrades, setPayGrades] = useState<Record<string, PayGrade>>({});
    const [permissionsData, setPermissionsData] = useState<Record<string, any[]>>({});
    const [form, setForm] = useState<FormData>({
        fullName: '', nationality: '', phone: '', email: '',
        dateOfBirth: '', gender: '', jobDescriptionId: '',
        contractType: 'Full-time', hireDate: new Date().toISOString().split('T')[0],
        basicSalary: '', reportingManagerId: '',
        emergencyName: '', emergencyPhone: '', emergencyRelationship: '',
    });
    // AI Agent step state
    const [agentMode, setAgentMode] = useState<'skip' | 'create' | 'assign'>('create');
    const [existingAgents, setExistingAgents] = useState<AgentDefinition[]>([]);
    const [selectedExistingAgentId, setSelectedExistingAgentId] = useState<string>('');
    const [newAgentName, setNewAgentName] = useState('');
    const [newAgentPrompt, setNewAgentPrompt] = useState('');
    const [newAgentCapabilities, setNewAgentCapabilities] = useState<string[]>([]);
    const [newAgentAvatar, setNewAgentAvatar] = useState('🤖');
    const [agentSaving, setAgentSaving] = useState(false);

    useEffect(() => {
        const unsubJobs = subscribeToItems<JobDescription>('job_descriptions', (data) => {
            setJobs(data);
        });
        const unsubGrades = subscribeToItems<PayGrade>('pay_grades', (data) => {
            const gradesMap: Record<string, PayGrade> = {};
            data.forEach(g => { gradesMap[g.id] = g; });
            setPayGrades(gradesMap);
        });
        const unsubPerms = subscribeToItems<any>('role_permissions', (data) => {
            const permsMap: Record<string, any[]> = {};
            data.forEach(p => { permsMap[p.id] = p.permissions; });
            setPermissionsData(permsMap);
            setLoading(false);
        });
        const unsubAgents = agentService.subscribe(setExistingAgents);

        return () => {
            unsubJobs();
            unsubGrades();
            unsubPerms();
            unsubAgents();
        };
    }, []);

    const selectedJob = jobs.find(j => j.id === form.jobDescriptionId);
    const selectedGrade = selectedJob ? payGrades[selectedJob.payGradeId] : null;
    const permissions = selectedJob ? (permissionsData?.[selectedJob.systemRoleId] ?? []) : [];

    // When job is selected, pre-fill agent details
    useEffect(() => {
        if (selectedJob) {
            setNewAgentName(`${selectedJob.title} AI`);
            setNewAgentAvatar(getDeptEmoji(selectedJob.departmentId));
            setNewAgentPrompt(agentService.buildRolePrompt(
                selectedJob.title,
                selectedJob.departmentId,
                newAgentCapabilities.length ? newAgentCapabilities : ['task-management', 'reporting']
            ));
        }
    }, [selectedJob?.id]);

    const update = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }));

    const getDeptEmoji = (dept: string) => {
        const map: Record<string, string> = {
            'fnb': '🍽️', 'fb': '🍽️', 'housekeeping': '🧹', 'hsk': '🧹',
            'frontoffice': '🏨', 'fo': '🏨', 'hr': '👥', 'finance': '📊',
            'engineering': '🔧', 'security': '🛡️', 'management': '👔',
        };
        return map[dept.toLowerCase().replace(/\s/g, '')] || '🤖';
    };

    const handleConfirm = async () => {
        if (!selectedJob) return;
        setSaving(true);
        try {
            const salary = parseFloat(form.basicSalary) || (selectedGrade?.minSalary ?? 1000);
            const grade = selectedGrade ?? { overtimeMultiplier: 1.5, currency: 'BHD', id: '' };
            const hireTimestamp = new Date(form.hireDate).getTime();

            const newMember: StaffMember = {
                id: `sm-${Date.now()}`,
                principal: `staff.${form.fullName.toLowerCase().replace(/\s/g, '.')}`,
                employeeId: `EMP-${String(Date.now()).slice(-4)}`,
                fullName: form.fullName,
                nationality: form.nationality,
                phone: form.phone,
                email: form.email,
                dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).getTime() : undefined,
                gender: form.gender as any,
                emergencyContact: form.emergencyName ? {
                    name: form.emergencyName, relationship: form.emergencyRelationship, phone: form.emergencyPhone
                } : undefined,
                jobDescriptionId: selectedJob.id,
                jobTitle: selectedJob.title,
                departmentId: selectedJob.departmentId,
                departmentName: selectedJob.departmentId.toUpperCase(),
                costCenterId: selectedJob.costCenterId,
                payGradeId: selectedJob.payGradeId,
                systemRoleId: selectedJob.systemRoleId,
                contractType: form.contractType,
                hireDate: hireTimestamp,
                probationEndDate: hireTimestamp + 90 * 24 * 60 * 60 * 1000,
                reportingManagerId: form.reportingManagerId || undefined,
                basicSalary: salary,
                currency: grade.currency,
                hourlyRate: salary / 160,
                overtimeRate: grade.overtimeMultiplier,
                allowances: [],
                status: 'Active',
                promotionHistory: [],
                salaryHistory: [{ id: `sc-${Date.now()}`, oldSalary: 0, newSalary: salary, reason: 'Annual Increment', effectiveDate: hireTimestamp, approvedBy: 'HR', timestamp: Date.now() }],
                transferHistory: [],
                performanceScore: 80,
                aiPerformanceScore: 80,
                skills: [],
                crossTrainedRoleIds: [],
                certifications: [],
                trainingProgress: [],
                gratuityStartDate: hireTimestamp,
                accruedGratuity: 0,
                auditLog: [{ field: 'status', oldValue: null, newValue: 'Active', changedBy: 'System', changedAt: Date.now(), reason: 'New hire', effectiveDate: hireTimestamp }],
            };

            await addItem('employees', newMember);

            // Create AI agent if selected
            if (agentMode === 'create' && newAgentName && newAgentPrompt) {
                setAgentSaving(true);
                await agentService.create({
                    name: newAgentName,
                    description: `AI Agent for ${selectedJob.title} in ${selectedJob.departmentId}`,
                    department: selectedJob.departmentId,
                    linkedJobDescriptionId: selectedJob.id,
                    linkedJobTitle: selectedJob.title,
                    provider: 'anthropic',
                    model: 'claude-3-5-sonnet-20241022',
                    systemPrompt: newAgentPrompt,
                    capabilities: newAgentCapabilities,
                    isDefault: false,
                    isActive: true,
                    avatar: newAgentAvatar,
                    color: 'violet',
                    createdAt: Date.now(),
                    requestCount: 0,
                });
                setAgentSaving(false);
            } else if (agentMode === 'assign' && selectedExistingAgentId) {
                await agentService.update(selectedExistingAgentId, {
                    linkedJobDescriptionId: selectedJob.id,
                    linkedJobTitle: selectedJob.title,
                });
            }

            onComplete(newMember);
        } catch (err) {
            console.error('Error hiring staff:', err);
        } finally {
            setSaving(false);
        }
    };

    const canNext = () => {
        if (step === 1) return form.fullName && form.nationality && form.hireDate;
        if (step === 2) return form.jobDescriptionId && form.basicSalary;
        return true;
    };

    const totalSteps = 5;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-violet-600/10 rounded-xl border border-violet-500/20">
                            <UserPlus className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-light text-white">New Hire</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Staff Onboarding Wizard</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step indicators */}
                <div className="flex px-6 pt-6 pb-2 gap-0">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className="flex flex-col items-center gap-1.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${step > s.id ? 'bg-emerald-500 text-white' :
                                    step === s.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30' :
                                        'bg-zinc-900 text-zinc-600 border border-zinc-800'
                                    }`}>
                                    {step > s.id ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${step === s.id ? 'text-violet-400' : 'text-zinc-600'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mt-4 mx-2 rounded-full transition-all duration-500 ${step > s.id ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Step 1: Personal Details */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Personal Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Full Name *</label>
                                    <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50 transition" placeholder="e.g. Ahmed Al-Hassan" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Nationality *</label>
                                    <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50 transition" placeholder="e.g. Bahraini" value={form.nationality} onChange={e => update('nationality', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Gender</label>
                                    <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50" value={form.gender} onChange={e => update('gender', e.target.value)}>
                                        <option value="">Select</option>
                                        <option>Male</option><option>Female</option><option>Prefer not to say</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Phone</label>
                                    <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50 transition" placeholder="+973 XXXX XXXX" value={form.phone} onChange={e => update('phone', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Email</label>
                                    <input type="email" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50 transition" placeholder="ahmed@hotel.com" value={form.email} onChange={e => update('email', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Date of Birth</label>
                                    <input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-500/50 transition" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Hire Date *</label>
                                    <input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-500/50 transition" value={form.hireDate} onChange={e => update('hireDate', e.target.value)} />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-800">
                                <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Emergency Contact</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] text-zinc-600 block mb-1">Name</label>
                                        <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-violet-500/50" placeholder="Contact name" value={form.emergencyName} onChange={e => update('emergencyName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-600 block mb-1">Relationship</label>
                                        <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-violet-500/50" placeholder="Spouse / Parent" value={form.emergencyRelationship} onChange={e => update('emergencyRelationship', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-600 block mb-1">Phone</label>
                                        <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-violet-500/50" placeholder="+973 XXXX" value={form.emergencyPhone} onChange={e => update('emergencyPhone', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Role & Pay */}
                    {step === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Role & Compensation</h3>

                            {/* Job Selection */}
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-2">Select Job Position *</label>
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader className="w-5 h-5 text-violet-500 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {jobs.map(job => {
                                            const grade = payGrades[job.payGradeId];
                                            const vacancies = job.headcountBudget - job.headcountFilled;
                                            return (
                                                <div
                                                    key={job.id}
                                                    onClick={() => {
                                                        update('jobDescriptionId', job.id);
                                                        if (grade) update('basicSalary', grade.minSalary.toString());
                                                    }}
                                                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${form.jobDescriptionId === job.id
                                                        ? 'bg-violet-600/10 border-violet-500/40'
                                                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-medium text-zinc-200">{job.title}</div>
                                                            <div className="text-[10px] text-zinc-500 mt-0.5">{job.departmentId.toUpperCase()} · {grade?.name}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-zinc-400 font-mono">{grade?.currency} {grade?.minSalary}–{grade?.maxSalary}</div>
                                                            <div className={`text-[9px] font-bold mt-1 ${vacancies > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {vacancies > 0 ? `${vacancies} vacancy${vacancies > 1 ? 'ies' : ''}` : 'No vacancies'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {selectedJob && selectedGrade && (
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Basic Salary ({selectedGrade.currency}) *</label>
                                        <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50" value={form.basicSalary} onChange={e => update('basicSalary', e.target.value)} min={selectedGrade.minSalary} max={selectedGrade.maxSalary} />
                                        <p className="text-[10px] text-zinc-600 mt-1">Range: {selectedGrade.minSalary} – {selectedGrade.maxSalary}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Contract Type</label>
                                        <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-500/50" value={form.contractType} onChange={e => update('contractType', e.target.value as any)}>
                                            {selectedJob.contractTypes.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Permissions Preview */}
                    {step === 3 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-sm font-semibold text-zinc-300 mb-2">System Access Preview</h3>
                            <p className="text-xs text-zinc-500">These permissions are automatically assigned based on the selected job. They take effect on the hire date.</p>

                            {selectedJob ? (
                                <>
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">System Role: {selectedJob.systemRoleId}</div>
                                        <div className="space-y-2">
                                            {permissions.map((p, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-950/50 border border-zinc-800/50 rounded-lg">
                                                    <div className="p-1.5 rounded-lg bg-violet-500/10">
                                                        <Shield className="w-3.5 h-3.5 text-violet-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="text-xs font-bold text-zinc-200">{p.module}</span>
                                                        <span className="text-zinc-600 mx-2">·</span>
                                                        <span className="text-xs text-zinc-400 capitalize">{p.action}</span>
                                                    </div>
                                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 uppercase font-bold tracking-wider">{p.scope}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">⚠ Separation of Duties</p>
                                        <p className="text-xs text-zinc-400">This role cannot approve its own payroll entries. Cross-role conflicts will be flagged automatically.</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-zinc-600 text-sm text-center py-8">Go back and select a job to preview permissions.</div>
                            )}
                        </div>
                    )}

                    {/* Step 4: AI Agent */}
                    {step === 4 && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                    <Brain className="w-4 h-4 text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">AI Agent Configuration</h3>
                                    <p className="text-[10px] text-zinc-500">Assign an AI agent to assist this role</p>
                                </div>
                            </div>

                            {/* Mode selector */}
                            <div className="grid grid-cols-3 gap-2">
                                {([
                                    { id: 'create', label: 'Create New', icon: Sparkles, desc: 'Custom agent for this role' },
                                    { id: 'assign', label: 'Assign Existing', icon: Bot, desc: 'Link an existing agent' },
                                    { id: 'skip', label: 'Skip', icon: ChevronRight, desc: 'No agent for now' },
                                ] as const).map(mode => (
                                    <button key={mode.id} onClick={() => setAgentMode(mode.id)}
                                        className={`p-3 rounded-xl border text-left transition-all ${agentMode === mode.id ? 'bg-violet-500/10 border-violet-500/40' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                                        <mode.icon className={`w-4 h-4 mb-1.5 ${agentMode === mode.id ? 'text-violet-400' : 'text-zinc-500'}`} />
                                        <div className={`text-xs font-semibold ${agentMode === mode.id ? 'text-white' : 'text-zinc-400'}`}>{mode.label}</div>
                                        <div className="text-[9px] text-zinc-600 mt-0.5">{mode.desc}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Create mode */}
                            {agentMode === 'create' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="col-span-1">
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Avatar</label>
                                            <input value={newAgentAvatar} onChange={e => setNewAgentAvatar(e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-xl focus:outline-none focus:border-violet-500 transition" />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">Agent Name *</label>
                                            <input value={newAgentName} onChange={e => setNewAgentName(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">System Prompt</label>
                                            {selectedJob && (
                                                <button onClick={() => setNewAgentPrompt(agentService.buildRolePrompt(selectedJob.title, selectedJob.departmentId, newAgentCapabilities))}
                                                    className="text-[10px] text-violet-400 hover:text-violet-300 transition flex items-center gap-1">
                                                    <Zap size={10} /> Auto-generate
                                                </button>
                                            )}
                                        </div>
                                        <textarea value={newAgentPrompt} onChange={e => setNewAgentPrompt(e.target.value)}
                                            rows={5} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-violet-500 transition resize-none" />
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Capabilities</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {ALL_CAPABILITIES.slice(0, 16).map(cap => {
                                                const sel = newAgentCapabilities.includes(cap.id);
                                                return (
                                                    <button key={cap.id} onClick={() => setNewAgentCapabilities(p => sel ? p.filter(c => c !== cap.id) : [...p, cap.id])}
                                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition ${sel ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                                                        {sel && '✓ '}{cap.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {newAgentName && (
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                            <p className="text-[11px] text-emerald-300">Agent <strong>{newAgentAvatar} {newAgentName}</strong> will be created and linked to <strong>{selectedJob?.title}</strong></p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Assign mode */}
                            {agentMode === 'assign' && (
                                <div className="space-y-2">
                                    {existingAgents.filter(a => a.isActive).map(agent => (
                                        <button key={agent.id} onClick={() => setSelectedExistingAgentId(agent.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${selectedExistingAgentId === agent.id ? 'bg-violet-500/10 border-violet-500/40' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                                            <span className="text-xl">{agent.avatar}</span>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-white">{agent.name}</div>
                                                <div className="text-[10px] text-zinc-500">{agent.department} • {agent.model}</div>
                                            </div>
                                            {selectedExistingAgentId === agent.id && <CheckCircle className="w-4 h-4 text-violet-400" />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Skip mode */}
                            {agentMode === 'skip' && (
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
                                    <Bot className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-sm text-zinc-500">No AI agent will be assigned to this role.</p>
                                    <p className="text-xs text-zinc-600 mt-1">You can always add one later from AI Configuration.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Confirm (was step 4) */}
                    {step === 5 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Confirm & Create</h3>

                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
                                {[
                                    { label: 'Full Name', value: form.fullName },
                                    { label: 'Nationality', value: form.nationality },
                                    { label: 'Email', value: form.email || '—' },
                                    { label: 'Position', value: selectedJob?.title || '—' },
                                    { label: 'Department', value: selectedJob?.departmentId.toUpperCase() || '—' },
                                    { label: 'Contract', value: form.contractType },
                                    { label: 'Hire Date', value: form.hireDate },
                                    { label: 'Basic Salary', value: `${selectedGrade?.currency || ''} ${form.basicSalary}` },
                                    { label: 'System Role', value: selectedJob?.systemRoleId || '—' },
                                    { label: 'Gratuity Start', value: form.hireDate },
                                ].map(row => (
                                    <div key={row.label} className="flex justify-between text-xs">
                                        <span className="text-zinc-500 font-bold uppercase tracking-wider">{row.label}</span>
                                        <span className="text-zinc-200 font-medium">{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Additional info if agent was configured */}
                            {agentMode !== 'skip' && (
                                <div className="bg-violet-600/5 border border-violet-500/20 rounded-xl p-4 text-xs text-zinc-400">
                                    <p className="flex items-center gap-1.5 text-violet-300 font-medium mb-1">
                                        <Brain size={11} />
                                        {agentMode === 'create' ? `AI Agent: ${newAgentAvatar} ${newAgentName || 'Unnamed'}` : `Linked Agent: ${existingAgents.find(a => a.id === selectedExistingAgentId)?.name || 'None selected'}`}
                                    </p>
                                    <p className="text-zinc-600">This agent will be available in AI Configuration and linked to this role.</p>
                                </div>
                            )}

                            <div className="bg-violet-600/5 border border-violet-500/20 rounded-xl p-4 text-xs text-zinc-400">
                                <p>On confirmation, the system will:</p>
                                <ul className="mt-2 space-y-1 list-disc list-inside text-zinc-500">
                                    <li>Create the staff profile in Singularity</li>
                                    <li>Assign system permissions immediately</li>
                                    <li>Start gratuity accrual calculation</li>
                                    <li>Generate an Employee ID</li>
                                    <li>Add to payroll for next run</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer navigation */}
                <div className="flex justify-between items-center p-6 border-t border-zinc-800 bg-zinc-950/50">
                    <button
                        onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 5 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canNext()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-sm font-bold transition shadow-lg shadow-violet-900/20"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleConfirm}
                            disabled={saving || !form.fullName || !selectedJob}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-900/20"
                        >
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            {saving ? 'Creating...' : 'Confirm & Hire'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HireWizard;
