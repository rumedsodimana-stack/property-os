/**
 * Agent Action Gate — AI-Native Architecture
 *
 * Role-aware permission gate that sits between the NeuralSidepanel and
 * SovereignDrive. Before any sovereign intent executes, this gate checks
 * whether the logged-in operator's OS role grants the required permission.
 *
 * This means the AI can ONLY act on behalf of what the human user is
 * allowed to do — respecting the full RBAC model in internalAuthService.
 */

import { OSPermission, OSRole } from '../kernel/internalAuthService';

// ── Action → Required Permission mapping ─────────────────────────────────────
// Actions not listed here require no special permission (available to any
// logged-in operator). The AI agent's own sandbox (agentSandbox.ts) still
// applies on top of this user-level gate.

export const ACTION_REQUIRED_PERMISSION: Partial<Record<string, OSPermission>> = {
  // PMS — Front Desk
  CHECK_IN:            'check_in_guest',
  CHECK_OUT:           'check_out_guest',
  CREATE_RESERVATION:  'create_reservation',
  CANCEL_RESERVATION:  'create_reservation',
  UPDATE_RESERVATION:  'create_reservation',
  ISSUE_GUEST_KEY:     'issue_guest_key',
  REVOKE_GUEST_KEY:    'revoke_guest_key',
  RESEND_GUEST_KEY:    'resend_guest_key',
  // Housekeeping
  MARK_ROOM_CLEAN:     'mark_room_clean',
  UPDATE_ROOM_STATUS:  'mark_room_clean',
  // HR
  APPROVE_LEAVE:       'approve_leave',
  REJECT_LEAVE:        'reject_leave',
  MANAGE_SHIFTS:       'manage_shifts',
  // Finance
  VOID_TRANSACTION:    'void_transaction',
  VIEW_FINANCIALS:     'view_financials',
  // Events
  CREATE_EVENT:        'create_event',
  // HR Staff management
  MANAGE_STAFF:        'manage_staff',
};

// ── Operator-friendly descriptions of what each action does ──────────────────

export const ACTION_DESCRIPTIONS: Partial<Record<string, string>> = {
  CHECK_IN:            'check a guest into their room',
  CHECK_OUT:           'check a guest out',
  CREATE_RESERVATION:  'create a new reservation',
  CANCEL_RESERVATION:  'cancel a reservation',
  UPDATE_RESERVATION:  'update reservation details',
  ISSUE_GUEST_KEY:     'issue a room key to a guest',
  REVOKE_GUEST_KEY:    'revoke a guest room key',
  MARK_ROOM_CLEAN:     'mark a room as clean',
  UPDATE_ROOM_STATUS:  'update a room status',
  APPROVE_LEAVE:       'approve a leave request',
  REJECT_LEAVE:        'reject a leave request',
  MANAGE_SHIFTS:       'manage staff shifts',
  VOID_TRANSACTION:    'void a financial transaction',
  CREATE_EVENT:        'create a hotel event',
  CREATE_TASK:         'create an operational task',
  CREATE_ORDER:        'create a POS order',
  SETTLE_ORDER:        'settle a POS order',
  SEND_GUEST_MESSAGE:  'send a message to a guest',
  CREATE_MAINTENANCE:  'log a maintenance task',
  NAVIGATE:            'navigate to a module',
  TROUBLESHOOT:        'run a system diagnostic',
};

// ── Result shape ──────────────────────────────────────────────────────────────

export interface ActionGateResult {
  allowed: boolean;
  requiredPermission?: OSPermission;
  reason?: string;
}

// ── Gate function ─────────────────────────────────────────────────────────────

/**
 * Check whether the currently logged-in operator is allowed to execute a
 * given sovereign action.
 *
 * @param action       The SovereignAction string (e.g. 'CHECK_IN')
 * @param hasPermission  The hasPermission helper from useAuth()
 * @returns ActionGateResult — `allowed: true` or an explanation of the block
 */
export function checkActionGate(
  action: string,
  hasPermission: (p: OSPermission) => boolean
): ActionGateResult {
  const key = action.toUpperCase();
  const required = ACTION_REQUIRED_PERMISSION[key];

  // No special permission required — anyone logged in can trigger this
  if (!required) return { allowed: true };

  const allowed = hasPermission(required);
  if (allowed) return { allowed: true, requiredPermission: required };

  const desc = ACTION_DESCRIPTIONS[key] ?? action;
  return {
    allowed: false,
    requiredPermission: required,
    reason: `Your role does not have permission to ${desc}. Required: '${required}'.`,
  };
}

// ── Role context builder — injected into agent system prompt ─────────────────

/**
 * Returns a human-readable summary of what the current operator's role
 * permits the AI to do on their behalf. Injected into every AI request so
 * the model is fully aware of its operational boundary.
 */
export function buildRoleCapabilitiesContext(role: OSRole | undefined): string {
  if (!role) return 'Operator: Not authenticated — AI actions are read-only.';

  const capabilities: Record<OSRole, string> = {
    GM: [
      'check-in/out guests', 'create/cancel/update reservations',
      'issue/revoke/resend guest keys', 'approve/reject leave requests',
      'void transactions', 'view all financials', 'manage shifts',
      'create events', 'mark rooms clean', 'update room status',
      'send guest messages', 'create maintenance tasks', 'manage staff',
      'create tasks', 'run system diagnostics', 'navigate to any module',
    ].join(', '),

    Manager: [
      'check-in/out guests', 'create/cancel/update reservations',
      'issue/revoke/resend guest keys', 'approve/reject leave requests',
      'void transactions', 'view financials', 'manage shifts',
      'create events', 'mark rooms clean', 'update room status',
      'send guest messages', 'create maintenance tasks', 'create tasks',
      'navigate to any module',
    ].join(', '),

    Finance: [
      'void transactions', 'view financials',
      'create tasks', 'navigate to any module',
    ].join(', '),

    FrontDesk: [
      'check-in/out guests', 'create reservations',
      'issue/revoke/resend guest keys',
      'send guest messages', 'create tasks', 'navigate to any module',
    ].join(', '),

    Supervisor: [
      'check-in/out guests', 'create reservations',
      'issue/revoke/resend guest keys', 'mark rooms clean',
      'update room status', 'manage shifts', 'create events',
      'send guest messages', 'create maintenance tasks',
      'create tasks', 'navigate to any module',
    ].join(', '),

    Chef: [
      'mark rooms clean',
      'create tasks', 'navigate to any module',
    ].join(', '),

    Staff: [
      'mark rooms clean', 'create reservations',
      'create tasks', 'navigate to any module',
    ].join(', '),

    Guest: ['view information only — no operational actions'].join(', '),
  };

  const caps = capabilities[role] ?? 'standard access';
  return `Operator Role: ${role}\nAI can execute on behalf of this operator: ${caps}`;
}
