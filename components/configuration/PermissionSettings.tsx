import React, { useState, useMemo } from 'react';
import {
    Shield, Lock, Unlock, Users, Plus, Save, Trash2,
    Check, X, ChevronRight, AlertTriangle, CheckCircle
} from 'lucide-react';
import { usePms } from '../../services/kernel/persistence';
import { Permission, SystemRole } from '../../types';

// ─── Constants ──────────────────────────────────────────────────────────────

const MODULES: Permission['module'][] = [
    'POS', 'HR', 'Rooms', 'Accounts', 'Config',
    'Procurement', 'Events', 'Reports', 'Engineering', 'Security', 'AI'
];

const ACTIONS: Permission['action'][] = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
const SCOPES: Permission['scope'][] = ['own', 'department', 'property', 'all'];

// Default starter roles (used when Firestore is empty)
const DEFAULT_ROLES: Omit<SystemRole, 'createdAt' | 'updatedAt'>[] = [
    {
        id: 'gm',
        name: 'General Manager',
        description: 'Full system access across all modules and properties.',
        isSystemDefault: true,
        permissions: MODULES.flatMap(module =>
            ACTIONS.map(action => ({ module, action, scope: 'all' as Permission['scope'] }))
        ),
    },
    {
        id: 'director',
        name: 'Director of Operations',
        description: 'Department management: approve, edit, view across most modules.',
        isSystemDefault: true,
        permissions: [
            ...(['POS', 'HR', 'Rooms', 'Events', 'Reports'] as Permission['module'][]).flatMap(module =>
                (['view', 'edit', 'approve'] as Permission['action'][]).map(action => ({
                    module, action, scope: 'property' as Permission['scope']
                }))
            ),
        ],
    },
    {
        id: 'frontdesk',
        name: 'Front Desk Agent',
        description: 'Check-in/out, room charges, guest services.',
        isSystemDefault: true,
        permissions: [
            { module: 'Rooms', action: 'view', scope: 'property' },
            { module: 'Rooms', action: 'edit', scope: 'property' },
            { module: 'Accounts', action: 'view', scope: 'department' },
            { module: 'Accounts', action: 'create', scope: 'department' },
        ],
    },
    {
        id: 'server',
        name: 'F&B Server',
        description: 'POS order entry, check printing and own shift view.',
        isSystemDefault: true,
        permissions: [
            { module: 'POS', action: 'view', scope: 'own' },
            { module: 'POS', action: 'create', scope: 'own' },
            { module: 'POS', action: 'edit', scope: 'own' },
        ],
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasPermission(role: SystemRole | LocalRole, module: Permission['module'], action: Permission['action']): boolean {
    return role.permissions.some(p => p.module === module && p.action === action);
}

function togglePermission(role: LocalRole, module: Permission['module'], action: Permission['action']): LocalRole {
    const exists = hasPermission(role, module, action);
    const permissions = exists
        ? role.permissions.filter(p => !(p.module === module && p.action === action))
        : [...role.permissions, { module, action, scope: 'property' as Permission['scope'] }];
    return { ...role, permissions };
}

// ─── Local Role type (includes Firestore roles + default roles) ──────────────
type LocalRole = Omit<SystemRole, 'createdAt' | 'updatedAt'> & {
    createdAt?: number;
    updatedAt?: number;
};

// ─── Component ───────────────────────────────────────────────────────────────

const PermissionSettings: React.FC = () => {
    const { systemRoles } = usePms();

    // Seed defaults if Firestore is empty
    const initialRoles: LocalRole[] = systemRoles.length > 0
        ? systemRoles
        : DEFAULT_ROLES;

    const [roles, setRoles] = useState<LocalRole[]>(initialRoles);
    const [selectedId, setSelectedId] = useState<string>(roles[0]?.id ?? '');
    const [editingName, setEditingName] = useState('');
    const [editingDesc, setEditingDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [saved, setSaved] = useState(false);

    const selectedRole = useMemo(() => roles.find(r => r.id === selectedId), [roles, selectedId]);

    const permCount = selectedRole?.permissions.length ?? 0;

    const selectRole = (id: string) => {
        setSelectedId(id);
        setSaved(false);
        setIsCreating(false);
    };

    const handleToggle = (module: Permission['module'], action: Permission['action']) => {
        if (!selectedRole) return;
        setSaved(false);
        setRoles(prev => prev.map(r =>
            r.id === selectedId ? togglePermission(r, module, action) : r
        ));
    };

    const handleSave = () => {
        // In production: call roleService.update(selectedId, selectedRole)
        setSaved(true);
    };

    const handleCreateRole = () => {
        if (!editingName.trim()) return;
        const newRole: LocalRole = {
            id: `role_${Date.now()}`,
            name: editingName.trim(),
            description: editingDesc.trim() || 'Custom role',
            isSystemDefault: false,
            permissions: [],
        };
        setRoles(prev => [...prev, newRole]);
        setSelectedId(newRole.id);
        setEditingName('');
        setEditingDesc('');
        setIsCreating(false);
        setSaved(false);
    };

    const handleDeleteRole = (id: string) => {
        const role = roles.find(r => r.id === id);
        if (role?.isSystemDefault) return; // protect defaults
        setRoles(prev => prev.filter(r => r.id !== id));
        setSelectedId(roles.find(r => r.id !== id)?.id ?? '');
    };

    const grantAll = () => {
        if (!selectedRole) return;
        setSaved(false);
        setRoles(prev => prev.map(r =>
            r.id === selectedId
                ? { ...r, permissions: MODULES.flatMap(module => ACTIONS.map(action => ({ module, action, scope: 'property' as Permission['scope'] }))) }
                : r
        ));
    };

    const revokeAll = () => {
        if (!selectedRole) return;
        setSaved(false);
        setRoles(prev => prev.map(r => r.id === selectedId ? { ...r, permissions: [] } : r));
    };

    return (
        <div className="flex gap-5 h-full animate-fadeIn">

            {/* ── Role Sidebar ── */}
            <div className="w-64 flex flex-col gap-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">System Roles</h3>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-bold uppercase transition"
                    >
                        <Plus className="w-3 h-3" /> New
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-zinc-900 border border-violet-500/30 rounded-xl p-3 space-y-2">
                        <input
                            autoFocus
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            placeholder="Role name"
                            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-violet-500 outline-none"
                        />
                        <input
                            value={editingDesc}
                            onChange={e => setEditingDesc(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs rounded-lg px-2.5 py-1.5 focus:border-violet-500 outline-none"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleCreateRole} className="flex-1 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-bold uppercase transition">
                                Create
                            </button>
                            <button onClick={() => setIsCreating(false)} className="py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-[10px] transition">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-1.5 overflow-auto flex-1">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => selectRole(role.id)}
                            className={`w-full p-3 rounded-xl border text-left transition group relative ${selectedId === role.id
                                ? 'bg-violet-600/10 border-violet-500/40 text-violet-300'
                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                                }`}
                        >
                            <div className="font-semibold text-xs mb-0.5 pr-6">{role.name}</div>
                            <div className="text-[9px] text-zinc-600 leading-snug">{role.description}</div>
                            <div className="text-[8px] text-zinc-700 mt-1">
                                {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                                {role.isSystemDefault && <span className="ml-2 text-violet-700">• Default</span>}
                            </div>
                            {!role.isSystemDefault && (
                                <button
                                    onClick={e => { e.stopPropagation(); handleDeleteRole(role.id); }}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-rose-400 transition"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Permission Matrix ── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                {selectedRole ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-violet-400" />
                                    <h3 className="text-sm font-bold text-white">{selectedRole.name}</h3>
                                    {selectedRole.isSystemDefault && (
                                        <span className="px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-500 text-[8px] font-bold uppercase rounded">
                                            System Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{selectedRole.description} · {permCount} active permissions</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={grantAll} className="px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition">
                                    Grant All
                                </button>
                                <button onClick={revokeAll} className="px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition">
                                    Revoke All
                                </button>
                                <button
                                    onClick={handleSave}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition border ${saved
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-violet-600 border-violet-600 text-white hover:bg-violet-500'
                                        }`}
                                >
                                    {saved ? <CheckCircle className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                                    {saved ? 'Saved' : 'Save Role'}
                                </button>
                            </div>
                        </div>

                        {/* Info Banner */}
                        <div className="flex items-start gap-2 p-3 bg-violet-500/5 border border-violet-500/15 rounded-xl text-[10px] text-zinc-400">
                            <Shield className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
                            <span>Click any cell to toggle a permission for this role. <strong className="text-zinc-300">Scope</strong> defaults to <em>property</em>. Changes are staged — click <strong className="text-zinc-300">Save Role</strong> to persist.</span>
                        </div>

                        {/* Matrix Table */}
                        <div className="flex-1 overflow-auto bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-zinc-600 text-[9px] uppercase font-bold tracking-wider bg-zinc-950/60 sticky left-0 min-w-[130px] border-r border-zinc-800/50">
                                            Module
                                        </th>
                                        {ACTIONS.map(action => (
                                            <th key={action} className="px-3 py-3 text-center text-zinc-500 text-[9px] uppercase font-bold tracking-wider bg-zinc-950/60 min-w-[80px]">
                                                {action}
                                            </th>
                                        ))}
                                        <th className="px-3 py-3 text-center text-zinc-600 text-[9px] uppercase font-bold tracking-wider bg-zinc-950/60 min-w-[60px]">
                                            Count
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/30">
                                    {MODULES.map(module => {
                                        const moduleCount = ACTIONS.filter(a => hasPermission(selectedRole, module, a)).length;
                                        return (
                                            <tr key={module} className="hover:bg-zinc-800/10 group transition">
                                                <td className="px-4 py-3 sticky left-0 bg-zinc-900/80 group-hover:bg-zinc-800/30 font-medium text-zinc-300 border-r border-zinc-800/50 transition">
                                                    {module}
                                                </td>
                                                {ACTIONS.map(action => {
                                                    const active = hasPermission(selectedRole, module, action);
                                                    return (
                                                        <td key={action} className="px-3 py-3 text-center">
                                                            <button
                                                                onClick={() => handleToggle(module, action)}
                                                                title={`${active ? 'Revoke' : 'Grant'} ${module}:${action}`}
                                                                className={`mx-auto w-7 h-7 rounded-lg flex items-center justify-center border transition-all hover:scale-110 ${active
                                                                    ? 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-900/30'
                                                                    : 'bg-zinc-800 border-zinc-700 text-zinc-600 hover:border-zinc-500'
                                                                    }`}
                                                            >
                                                                {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-40" />}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-3 py-3 text-center font-mono text-[10px] text-zinc-500">
                                                    {moduleCount}/{ACTIONS.length}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-[9px] text-zinc-600">
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-violet-600 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></span>
                                Permitted
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center"><X className="w-2.5 h-2.5 text-zinc-600" /></span>
                                Denied
                            </div>
                            <span className="ml-auto">
                                {ACTIONS.join(' · ')}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600">
                        <Shield className="w-10 h-10 opacity-20" />
                        <span className="text-sm">Select or create a role to manage permissions</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PermissionSettings;
