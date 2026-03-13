/**
 * Hotel Singularity OS — useRoleAccess Hook
 *
 * Role-based module access control gate.
 * Use this hook to decide if the current user can see/interact with a module.
 *
 * Usage:
 *   const { canAccess, canAccessAny, reason } = useRoleAccess();
 *   if (!canAccess('finance')) return <AccessDenied />;
 *
 * Module IDs map to the nav items in OpsApp.tsx
 */

import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { OSRole } from '../services/kernel/internalAuthService';

// ─── Module → Allowed Roles Map ───────────────────────────────────────────────

/**
 * Defines which roles can access each module.
 * If a module is NOT listed here it defaults to GM-only access.
 */
export const MODULE_ACCESS: Record<string, OSRole[]> = {
  // PMS / Front Office
  'front-desk':       ['GM', 'Manager', 'Supervisor', 'FrontDesk', 'Staff'],
  'housekeeping':     ['GM', 'Manager', 'Supervisor', 'Staff'],
  'reservations':     ['GM', 'Manager', 'Supervisor', 'FrontDesk'],

  // POS / F&B
  'pos':              ['GM', 'Manager', 'Supervisor', 'Chef', 'Staff', 'FrontDesk'],
  'kitchen':          ['GM', 'Manager', 'Chef'],
  'fnb':              ['GM', 'Manager', 'Chef', 'Supervisor'],

  // Finance
  'finance':          ['GM', 'Finance'],
  'night-audit':      ['GM', 'Finance'],
  'procurement':      ['GM', 'Manager', 'Finance'],

  // HR
  'hr':               ['GM', 'Manager'],
  'staff-approvals':  ['GM', 'Manager'],

  // CRM / Guest
  'crm':              ['GM', 'Manager', 'FrontDesk'],
  'guest-services':   ['GM', 'Manager', 'FrontDesk', 'Supervisor'],
  'communication':    ['GM', 'Manager', 'Supervisor', 'FrontDesk', 'Staff'],
  'reputation':       ['GM', 'Manager'],

  // Engineering / Security
  'engineering':      ['GM', 'Manager', 'Supervisor'],
  'security':         ['GM', 'Manager', 'Supervisor'],
  'iot':              ['GM', 'Manager', 'Supervisor'],

  // Events / Recreation
  'events':           ['GM', 'Manager', 'Supervisor'],
  'recreation':       ['GM', 'Manager', 'Staff', 'Supervisor'],
  'groups':           ['GM', 'Manager', 'FrontDesk'],

  // AI / Analytics
  'ai':               ['GM', 'Manager'],
  'analytics':        ['GM', 'Manager', 'Finance'],
  'reports':          ['GM', 'Manager', 'Finance'],
  'intelligence':     ['GM', 'Manager'],

  // Portfolio / Config (GM-only by default — covered by the fallback)
  'portfolio':        ['GM'],
  'configuration':    ['GM'],
  'brand':            ['GM', 'Manager'],

  // Terminal (developer/GM)
  'terminal':         ['GM'],

  // Night audit
  'audit':            ['GM', 'Finance'],

  // Profile is always accessible by the current user
  'profile':          ['GM', 'Manager', 'Supervisor', 'FrontDesk', 'Finance', 'Chef', 'Staff'],

  // Suggestions — all staff can submit
  'suggestions':      ['GM', 'Manager', 'Supervisor', 'FrontDesk', 'Finance', 'Chef', 'Staff'],
};

// ─── Action-level gates (for individual features within modules) ───────────────

export type ModuleAction =
  | 'approve_staff'
  | 'manage_billing'
  | 'view_all_properties'
  | 'edit_hotel_config'
  | 'export_reports'
  | 'void_transaction'
  | 'approve_leave'
  | 'manage_rooms'
  | 'view_staff_salaries'
  | 'access_terminal';

export const ACTION_ROLES: Record<ModuleAction, OSRole[]> = {
  approve_staff:        ['GM', 'Manager'],
  manage_billing:       ['GM'],
  view_all_properties:  ['GM'],
  edit_hotel_config:    ['GM'],
  export_reports:       ['GM', 'Manager', 'Finance'],
  void_transaction:     ['GM', 'Finance', 'Manager'],
  approve_leave:        ['GM', 'Manager'],
  manage_rooms:         ['GM', 'Manager', 'Supervisor'],
  view_staff_salaries:  ['GM', 'Finance'],
  access_terminal:      ['GM'],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface RoleAccessResult {
  /** Check if current user can access a module by its ID */
  canAccess:    (moduleId: string) => boolean;
  /** True if the user can access at least one of the given modules */
  canAccessAny: (...moduleIds: string[]) => boolean;
  /** Check a specific action within a module */
  canDo:        (action: ModuleAction) => boolean;
  /** Human-readable reason why access is denied (for display in UI) */
  reason:       (moduleId: string) => string;
  /** The current user's role */
  role:         OSRole | null;
  /** True if the user is a GM */
  isGM:         boolean;
  /** True if the user is a Manager or GM */
  isManagement: boolean;
  /** Filter a list of module IDs to those the user can access */
  filterModules: (moduleIds: string[]) => string[];
}

export function useRoleAccess(): RoleAccessResult {
  const { currentUser } = useAuth();
  const role = (currentUser?.role ?? null) as OSRole | null;

  const canAccess = useCallback((moduleId: string): boolean => {
    if (!role) return false;
    const allowed = MODULE_ACCESS[moduleId];
    // If no rule defined, default to GM only
    if (!allowed) return role === 'GM';
    return allowed.includes(role);
  }, [role]);

  const canAccessAny = useCallback((...moduleIds: string[]): boolean => {
    return moduleIds.some(id => canAccess(id));
  }, [canAccess]);

  const canDo = useCallback((action: ModuleAction): boolean => {
    if (!role) return false;
    return ACTION_ROLES[action]?.includes(role) ?? false;
  }, [role]);

  const reason = useCallback((moduleId: string): string => {
    if (!role) return 'You must be logged in to access this module.';
    if (canAccess(moduleId)) return '';
    const allowed = MODULE_ACCESS[moduleId] ?? ['GM'];
    const roleLabels: Record<string, string> = {
      GM: 'General Manager', Manager: 'Manager', Supervisor: 'Supervisor',
      Finance: 'Finance', FrontDesk: 'Front Desk', Chef: 'Chef', Staff: 'Staff',
    };
    const names = allowed.map(r => roleLabels[r] ?? r).join(', ');
    return `This module requires one of these roles: ${names}.`;
  }, [role, canAccess]);

  const filterModules = useCallback((moduleIds: string[]): string[] => {
    return moduleIds.filter(id => canAccess(id));
  }, [canAccess]);

  return {
    canAccess,
    canAccessAny,
    canDo,
    reason,
    role,
    isGM:         role === 'GM',
    isManagement: role === 'GM' || role === 'Manager',
    filterModules,
  };
}
