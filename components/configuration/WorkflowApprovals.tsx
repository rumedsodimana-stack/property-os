/**
 * Hotel Singularity OS — Workflow Approvals Configuration
 * Lets admins define which roles are required to approve each workflow type.
 * Settings are persisted to Firestore under the `workflowConfig` collection.
 */
import React, { useState, useEffect } from 'react';
import { GitMerge, Save, CheckCircle, Shield, RefreshCw } from 'lucide-react';
import { OSRole, OSPermission } from '../../services/kernel/internalAuthService';
import { fetchItems, updateItem, addItem } from '../../services/kernel/firestoreService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowRule {
    id: string;
    entityType: string;
    label: string;
    description: string;
    requiredPermission: OSPermission;
    approverRoles: OSRole[];       // roles that CAN approve
    notifyRoles: OSRole[];         // roles that get notified (read-only)
}

// ─── Default Rules ─────────────────────────────────────────────────────────

const ALL_ROLES: OSRole[] = ['GM', 'Manager', 'Finance', 'FrontDesk', 'Supervisor', 'Chef', 'Staff'];

const DEFAULT_RULES: WorkflowRule[] = [
    {
        id: 'wf_leave',
        entityType: 'leaveRequest',
        label: 'Leave Requests',
        description: 'Who can approve or reject staff leave applications.',
        requiredPermission: 'approve_leave',
        approverRoles: ['GM', 'Manager'],
        notifyRoles: ['Supervisor'],
    },
    {
        id: 'wf_recipe',
        entityType: 'menuItem',
        label: 'Recipe Approval',
        description: 'Who can approve chef recipe drafts and publish them to the live POS menu.',
        requiredPermission: 'approve_recipe',
        approverRoles: ['GM', 'Manager', 'Finance'],
        notifyRoles: ['Chef'],
    },
    {
        id: 'wf_void',
        entityType: 'transaction',
        label: 'Void Transaction',
        description: 'Who can void/reverse a posted ledger transaction.',
        requiredPermission: 'void_transaction',
        approverRoles: ['GM', 'Manager', 'Finance'],
        notifyRoles: [],
    },
    {
        id: 'wf_purchase',
        entityType: 'purchaseOrder',
        label: 'Purchase Orders',
        description: 'Who can approve procurement requests submitted by department heads.',
        requiredPermission: 'manage_staff',
        approverRoles: ['GM', 'Manager'],
        notifyRoles: ['Finance'],
    },
    {
        id: 'wf_event',
        entityType: 'banquetEvent',
        label: 'Event Bookings',
        description: 'Who can confirm and publish new banquet/event bookings.',
        requiredPermission: 'create_event',
        approverRoles: ['GM', 'Manager', 'Supervisor'],
        notifyRoles: [],
    },
    {
        id: 'wf_checkin',
        entityType: 'reservation',
        label: 'Check-in / Check-out',
        description: 'Who can perform guest check-in and check-out from the Front Desk.',
        requiredPermission: 'check_in_guest',
        approverRoles: ['GM', 'Manager', 'FrontDesk', 'Supervisor'],
        notifyRoles: [],
    },
];

const ROLE_COLORS: Record<OSRole, string> = {
    GM: 'bg-violet-600/20 text-violet-300 border-violet-500/30',
    Manager: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
    Finance: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
    FrontDesk: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30',
    Supervisor: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
    Chef: 'bg-orange-600/20 text-orange-300 border-orange-500/30',
    Staff: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',
    Guest: 'bg-zinc-800/20 text-zinc-600 border-zinc-700/30',
};

// ─── Component ────────────────────────────────────────────────────────────────

const WorkflowApprovals: React.FC = () => {
    const [rules, setRules] = useState<WorkflowRule[]>(DEFAULT_RULES);
    const [selected, setSelected] = useState<string>(DEFAULT_RULES[0].id);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load from Firestore on mount
    useEffect(() => {
        const load = async () => {
            try {
                const stored = await fetchItems<WorkflowRule>('workflowConfig');
                if (stored.length > 0) {
                    setRules(stored);
                    setSelected(stored[0].id);
                }
            } catch {
                // Use defaults
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const selectedRule = rules.find(r => r.id === selected) ?? rules[0];;

    const toggleApprover = (role: OSRole) => {
        setSaved(false);
        setRules(prev => prev.map(r => {
            if (r.id !== selected) return r;
            const has = r.approverRoles.includes(role);
            return {
                ...r,
                approverRoles: has
                    ? r.approverRoles.filter(x => x !== role)
                    : [...r.approverRoles, role],
            };
        }));
    };

    const toggleNotify = (role: OSRole) => {
        setSaved(false);
        setRules(prev => prev.map(r => {
            if (r.id !== selected) return r;
            const has = r.notifyRoles.includes(role);
            return {
                ...r,
                notifyRoles: has
                    ? r.notifyRoles.filter(x => x !== role)
                    : [...r.notifyRoles, role],
            };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const rule of rules) {
                // Upsert each rule by id
                const existing = await fetchItems<WorkflowRule>('workflowConfig');
                if (existing.find(e => e.id === rule.id)) {
                    await updateItem('workflowConfig', rule.id, rule as any);
                } else {
                    await addItem('workflowConfig', rule as any);
                }
            }
            setSaved(true);
        } finally {
            setSaving(false);
        }
    };

    if (!selectedRule) return <div className="text-zinc-500 text-sm p-8">No workflow rules configured.</div>;

    return (
        <div className="flex gap-6 h-full animate-fadeIn">
            {/* ── Left: Workflow List ── */}
            <div className="w-64 flex flex-col gap-2 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <GitMerge className="w-4 h-4 text-violet-400" />
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Workflow Rules</h3>
                    </div>
                </div>

                {rules.map(rule => (
                    <button
                        key={rule.id}
                        onClick={() => { setSelected(rule.id); setSaved(false); }}
                        className={`w-full p-3.5 rounded-xl border text-left transition group ${selected === rule.id
                            ? 'bg-violet-600/10 border-violet-500/40 text-violet-300'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                            }`}
                    >
                        <div className="font-semibold text-xs mb-1">{rule.label}</div>
                        <div className="text-[9px] text-zinc-600 leading-snug">{rule.description}</div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                            {rule.approverRoles.map(r => (
                                <span key={r} className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${ROLE_COLORS[r]}`}>{r}</span>
                            ))}
                        </div>
                    </button>
                ))}
            </div>

            {/* ── Right: Rule Editor ── */}
            <div className="flex-1 flex flex-col gap-5 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-white">{selectedRule.label}</h3>
                        <p className="text-xs text-zinc-500 mt-1">{selectedRule.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                            <Shield className="w-3 h-3" />
                            Required Permission: <span className="text-violet-400 font-mono">{selectedRule.requiredPermission}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition border ${saved
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-violet-600 border-violet-600 text-white hover:bg-violet-500'
                            } disabled:opacity-50`}
                    >
                        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
                    </button>
                </div>

                {/* Approvers Section */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Who Can Approve</h4>
                        <span className="text-[9px] text-zinc-600 ml-auto">Select at least one role</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {ALL_ROLES.filter(r => r !== 'Guest').map(role => {
                            const active = selectedRule.approverRoles.includes(role);
                            return (
                                <button
                                    key={role}
                                    onClick={() => toggleApprover(role)}
                                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all hover:scale-105 ${active
                                        ? ROLE_COLORS[role] + ' shadow-sm'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:border-zinc-600'
                                        }`}
                                >
                                    <Shield className="w-4 h-4" />
                                    {role}
                                    {active && <CheckCircle className="w-3 h-3" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Notify Section */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Who Gets Notified</h4>
                        <span className="text-[9px] text-zinc-600 ml-auto">Roles that receive read-only alerts on approval decisions</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {ALL_ROLES.filter(r => r !== 'Guest').map(role => {
                            const active = selectedRule.notifyRoles.includes(role);
                            return (
                                <button
                                    key={role}
                                    onClick={() => toggleNotify(role)}
                                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all hover:scale-105 ${active
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-sm'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:border-zinc-600'
                                        }`}
                                >
                                    <Shield className="w-4 h-4" />
                                    {role}
                                    {active && <CheckCircle className="w-3 h-3" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-xl p-4 text-[10px] text-zinc-500 leading-relaxed">
                    <strong className="text-zinc-400">How this works:</strong> When a <span className="text-violet-400">{selectedRule.entityType}</span> is submitted,
                    only operators with roles{' '}
                    {selectedRule.approverRoles.map((r, i) => (
                        <span key={r}>
                            <span className={`font-bold px-1 py-0.5 rounded ${ROLE_COLORS[r]}`}>{r}</span>
                            {i < selectedRule.approverRoles.length - 1 ? ' / ' : ''}
                        </span>
                    ))}{' '}
                    will see the Approve / Reject buttons.
                    {selectedRule.notifyRoles.length > 0 && <> Roles {selectedRule.notifyRoles.join(', ')} will be notified on any decision.</>}
                    {' '}All actions are logged to the Workflow audit trail in Firestore.
                </div>
            </div>
        </div>
    );
};

export default WorkflowApprovals;
