import type { AITier } from '../../types/ai';

// Core agent principals — Wal (System), Don (Analytics), Ali (Concierge), Fred (Brand)
export type AgentPrincipal = 'WAL' | 'DON' | 'ALI' | 'FRED' | 'SYSTEM' | 'CONCIERGE' | 'BRAND' | 'OPS';

export type SovereignAction =
    | 'CHECK_IN'
    | 'CHECK_OUT'
    | 'CREATE_ORDER'
    | 'SETTLE_ORDER'
    | 'UPDATE_BRAND'
    | 'SYSTEM_CONTROL'
    | 'CREATE_TASK'
    | 'NAVIGATE'
    | 'TROUBLESHOOT'
    | 'MODIFY_CODE'
    // ── Role-bound operational actions ────────────────────────────────────────
    | 'CREATE_RESERVATION'
    | 'CANCEL_RESERVATION'
    | 'UPDATE_RESERVATION'
    | 'ISSUE_GUEST_KEY'
    | 'REVOKE_GUEST_KEY'
    | 'MARK_ROOM_CLEAN'
    | 'UPDATE_ROOM_STATUS'
    | 'APPROVE_LEAVE'
    | 'REJECT_LEAVE'
    | 'VOID_TRANSACTION'
    | 'MANAGE_SHIFTS'
    | 'CREATE_EVENT'
    | 'SEND_GUEST_MESSAGE'
    | 'CREATE_MAINTENANCE';

export interface SandboxViolation {
    code: string;
    message: string;
}

export interface SandboxResult<T = Record<string, any>> {
    allowed: boolean;
    normalizedParams: T;
    violations: SandboxViolation[];
}

const ACTOR_ALLOWED_ACTIONS: Record<AgentPrincipal, SovereignAction[]> = {
    // ── Named Core Agents ──────────────────────────────────────────────────────
    // Wal — System Agent: full OS control + all operational actions
    WAL: [
        'CHECK_IN', 'CHECK_OUT',
        'CREATE_ORDER', 'SETTLE_ORDER',
        'UPDATE_BRAND', 'CREATE_TASK',
        'NAVIGATE', 'TROUBLESHOOT', 'MODIFY_CODE',
        // Role-bound operational actions (user role gate enforced at execution)
        'CREATE_RESERVATION', 'CANCEL_RESERVATION', 'UPDATE_RESERVATION',
        'ISSUE_GUEST_KEY', 'REVOKE_GUEST_KEY',
        'MARK_ROOM_CLEAN', 'UPDATE_ROOM_STATUS',
        'APPROVE_LEAVE', 'REJECT_LEAVE',
        'VOID_TRANSACTION', 'MANAGE_SHIFTS',
        'CREATE_EVENT', 'SEND_GUEST_MESSAGE', 'CREATE_MAINTENANCE',
    ],
    // Don — Analytics Agent: finance + analytics + procurement actions
    DON: [
        'NAVIGATE', 'CREATE_TASK', 'TROUBLESHOOT',
        'VOID_TRANSACTION', 'CREATE_EVENT',
    ],
    // Ali — Concierge Agent: guest-facing actions
    ALI: [
        'NAVIGATE', 'CREATE_TASK',
        'CHECK_IN', 'CHECK_OUT',
        'CREATE_RESERVATION', 'CANCEL_RESERVATION', 'UPDATE_RESERVATION',
        'ISSUE_GUEST_KEY', 'REVOKE_GUEST_KEY',
        'SEND_GUEST_MESSAGE', 'CREATE_MAINTENANCE',
        'MARK_ROOM_CLEAN',
    ],
    // Fred — Brand, HR & Compliance Agent
    FRED: [
        'NAVIGATE', 'UPDATE_BRAND', 'CREATE_TASK',
        'APPROVE_LEAVE', 'REJECT_LEAVE',
        'MANAGE_SHIFTS', 'CREATE_EVENT',
    ],
    // ── Legacy aliases (kept for backward compatibility) ───────────────────────
    SYSTEM: [
        'CHECK_IN', 'CHECK_OUT',
        'CREATE_ORDER', 'SETTLE_ORDER',
        'UPDATE_BRAND', 'CREATE_TASK',
        'NAVIGATE', 'TROUBLESHOOT', 'MODIFY_CODE',
        'CREATE_RESERVATION', 'CANCEL_RESERVATION', 'UPDATE_RESERVATION',
        'ISSUE_GUEST_KEY', 'REVOKE_GUEST_KEY',
        'MARK_ROOM_CLEAN', 'UPDATE_ROOM_STATUS',
        'APPROVE_LEAVE', 'REJECT_LEAVE',
        'VOID_TRANSACTION', 'MANAGE_SHIFTS',
        'CREATE_EVENT', 'SEND_GUEST_MESSAGE', 'CREATE_MAINTENANCE',
    ],
    CONCIERGE: [
        'NAVIGATE', 'CREATE_TASK',
        'CHECK_IN', 'CHECK_OUT',
        'CREATE_RESERVATION', 'ISSUE_GUEST_KEY', 'REVOKE_GUEST_KEY',
        'SEND_GUEST_MESSAGE',
    ],
    BRAND: ['NAVIGATE', 'UPDATE_BRAND', 'APPROVE_LEAVE', 'REJECT_LEAVE'],
    OPS: ['NAVIGATE', 'CREATE_TASK', 'TROUBLESHOOT', 'CREATE_MAINTENANCE'],
};

const SAFE_CODE_PATH_PREFIXES = [
    'App.tsx',
    'index.css',
    'index.html',
    'components/',
    'services/',
    'context/',
    'src/',
    'types/',
    'docs/',
    'public/'
];

const BLOCKED_CODE_PATH_SEGMENTS = [
    '..',
    '.git',
    '.env',
    'node_modules',
    'dist/',
    '.firebase',
    '.singularity_backups',
    'edgeNode/'
];

const ALLOWED_CODE_EXTENSIONS = ['.ts', '.tsx', '.css', '.json', '.md', '.html'];
const MAX_CODE_CHANGE_BYTES = 300_000;

const ACTOR_TO_TIER: Record<AgentPrincipal, AITier> = {
    // Named core agents
    WAL: 'system_ops',
    DON: 'analytics',
    ALI: 'concierge',
    FRED: 'automation',
    // Legacy aliases
    SYSTEM: 'system_ops',
    CONCIERGE: 'concierge',
    BRAND: 'automation',
    OPS: 'analytics'
};

const normalizePath = (filePath: string): string => {
    return (filePath || '')
        .replace(/\\/g, '/')
        .replace(/^\.?\//, '')
        .trim();
};

const getExt = (filePath: string): string => {
    const lastDot = filePath.lastIndexOf('.');
    if (lastDot < 0) return '';
    return filePath.slice(lastDot).toLowerCase();
};

const hasBlockedSegment = (filePath: string): boolean => {
    const lower = filePath.toLowerCase();
    return BLOCKED_CODE_PATH_SEGMENTS.some(seg => lower.includes(seg.toLowerCase()));
};

const hasAllowedPrefix = (filePath: string): boolean => {
    return SAFE_CODE_PATH_PREFIXES.some(prefix => filePath === prefix || filePath.startsWith(prefix));
};

export const validateCodeWriteRequest = (
    actor: AgentPrincipal,
    input: { filePath: string; change: string }
): SandboxResult<{ filePath: string; change: string }> => {
    const violations: SandboxViolation[] = [];
    const filePath = normalizePath(input.filePath);
    const change = typeof input.change === 'string' ? input.change : '';

    if (!ACTOR_ALLOWED_ACTIONS[actor].includes('MODIFY_CODE')) {
        violations.push({
            code: 'action_denied',
            message: `${actor} is not allowed to modify code`
        });
    }

    if (!filePath) {
        violations.push({
            code: 'invalid_path',
            message: 'filePath is required'
        });
    }

    if (filePath.startsWith('/')) {
        violations.push({
            code: 'absolute_path_forbidden',
            message: 'filePath must be relative to project root'
        });
    }

    if (hasBlockedSegment(filePath)) {
        violations.push({
            code: 'blocked_path',
            message: 'filePath is blocked by hard sandbox policy'
        });
    }

    if (!hasAllowedPrefix(filePath)) {
        violations.push({
            code: 'path_outside_allowlist',
            message: `filePath must be inside allowed app paths: ${SAFE_CODE_PATH_PREFIXES.join(', ')}`
        });
    }

    const ext = getExt(filePath);
    if (!ALLOWED_CODE_EXTENSIONS.includes(ext)) {
        violations.push({
            code: 'extension_blocked',
            message: `Only these file extensions are writable: ${ALLOWED_CODE_EXTENSIONS.join(', ')}`
        });
    }

    if (!change.trim()) {
        violations.push({
            code: 'empty_change',
            message: 'change content cannot be empty'
        });
    }

    const bytes = new TextEncoder().encode(change).length;
    if (bytes > MAX_CODE_CHANGE_BYTES) {
        violations.push({
            code: 'change_too_large',
            message: `change content exceeds ${MAX_CODE_CHANGE_BYTES} bytes`
        });
    }

    return {
        allowed: violations.length === 0,
        normalizedParams: { filePath, change },
        violations
    };
};

const ensureString = (value: any, key: string, violations: SandboxViolation[]): string => {
    if (typeof value !== 'string' || !value.trim()) {
        violations.push({
            code: 'invalid_param',
            message: `${key} must be a non-empty string`
        });
        return '';
    }
    return value.trim();
};

export const validateIntent = (
    actor: AgentPrincipal,
    intent: { action?: any; params?: any; parameters?: any }
): SandboxResult<Record<string, any>> => {
    const violations: SandboxViolation[] = [];
    const action = (intent.action || '').toString().trim().toUpperCase() as SovereignAction;
    const params = intent.params ?? intent.parameters ?? {};
    const normalized: Record<string, any> = {};

    if (!action) {
        violations.push({
            code: 'missing_action',
            message: 'Intent action is required'
        });
        return { allowed: false, normalizedParams: normalized, violations };
    }

    if (!ACTOR_ALLOWED_ACTIONS[actor].includes(action)) {
        violations.push({
            code: 'action_not_permitted',
            message: `${actor} cannot execute ${action}`
        });
        return { allowed: false, normalizedParams: normalized, violations };
    }

    switch (action) {
        case 'CHECK_IN':
            normalized.reservationId = ensureString(params.reservationId, 'reservationId', violations);
            normalized.roomId = ensureString(params.roomId, 'roomId', violations);
            break;
        case 'CHECK_OUT':
            normalized.reservationId = ensureString(params.reservationId, 'reservationId', violations);
            normalized.roomId = ensureString(params.roomId, 'roomId', violations);
            break;
        case 'CREATE_ORDER':
            normalized.outletId = ensureString(params.outletId, 'outletId', violations);
            if (!Array.isArray(params.items) || params.items.length === 0) {
                violations.push({
                    code: 'invalid_param',
                    message: 'items must be a non-empty array'
                });
            } else if (params.items.length > 100) {
                violations.push({
                    code: 'too_many_items',
                    message: 'items array cannot exceed 100 entries'
                });
            } else {
                normalized.items = params.items;
            }
            if (params.tableId !== undefined) {
                normalized.tableId = String(params.tableId).trim();
            }
            break;
        case 'SETTLE_ORDER':
            normalized.orderId = ensureString(params.orderId, 'orderId', violations);
            normalized.paymentMethod = ensureString(params.paymentMethod, 'paymentMethod', violations);
            break;
        case 'UPDATE_BRAND':
            if (typeof params.standards !== 'object' || params.standards === null) {
                violations.push({
                    code: 'invalid_param',
                    message: 'standards must be an object'
                });
            } else {
                normalized.standards = params.standards;
            }
            break;
        case 'CREATE_TASK':
            normalized.title = ensureString(params.title, 'title', violations);
            normalized.description = ensureString(params.description, 'description', violations);
            normalized.department = ensureString(params.department, 'department', violations);
            normalized.priority = ensureString(params.priority, 'priority', violations);
            break;
        case 'NAVIGATE':
            normalized.module = ensureString(params.module, 'module', violations);
            break;

        // ── Role-bound operational actions ─────────────────────────────────────
        case 'CREATE_RESERVATION':
            normalized.guestName = ensureString(params.guestName, 'guestName', violations);
            normalized.checkIn = params.checkIn ? String(params.checkIn) : '';
            normalized.checkOut = params.checkOut ? String(params.checkOut) : '';
            normalized.roomTypeId = params.roomTypeId ? String(params.roomTypeId) : 'standard';
            normalized.adults = typeof params.adults === 'number' ? params.adults : 1;
            normalized.ratePerNight = typeof params.ratePerNight === 'number' ? params.ratePerNight : 0;
            normalized.specialRequests = params.specialRequests ? String(params.specialRequests) : '';
            break;
        case 'CANCEL_RESERVATION':
            normalized.reservationId = ensureString(params.reservationId, 'reservationId', violations);
            normalized.reason = params.reason ? String(params.reason) : 'Cancelled by operator';
            break;
        case 'UPDATE_RESERVATION':
            normalized.reservationId = ensureString(params.reservationId, 'reservationId', violations);
            normalized.updates = typeof params.updates === 'object' && params.updates ? params.updates : {};
            break;
        case 'ISSUE_GUEST_KEY':
            normalized.roomId = ensureString(params.roomId, 'roomId', violations);
            normalized.guestId = params.guestId ? String(params.guestId) : '';
            normalized.reservationId = params.reservationId ? String(params.reservationId) : '';
            break;
        case 'REVOKE_GUEST_KEY':
            normalized.roomId = ensureString(params.roomId, 'roomId', violations);
            normalized.reason = params.reason ? String(params.reason) : 'Revoked by operator';
            break;
        case 'MARK_ROOM_CLEAN':
            normalized.roomId = ensureString(params.roomId, 'roomId', violations);
            normalized.cleaner = params.cleaner ? String(params.cleaner) : '';
            break;
        case 'UPDATE_ROOM_STATUS':
            normalized.roomId = ensureString(params.roomId, 'roomId', violations);
            normalized.status = ensureString(params.status, 'status', violations);
            normalized.note = params.note ? String(params.note) : '';
            break;
        case 'APPROVE_LEAVE':
            normalized.requestId = ensureString(params.requestId, 'requestId', violations);
            normalized.approverName = params.approverName ? String(params.approverName) : '';
            break;
        case 'REJECT_LEAVE':
            normalized.requestId = ensureString(params.requestId, 'requestId', violations);
            normalized.reason = params.reason ? String(params.reason) : 'Rejected by operator';
            normalized.approverName = params.approverName ? String(params.approverName) : '';
            break;
        case 'VOID_TRANSACTION':
            normalized.transactionId = ensureString(params.transactionId, 'transactionId', violations);
            normalized.reason = ensureString(params.reason, 'reason', violations);
            break;
        case 'MANAGE_SHIFTS':
            normalized.action = ensureString(params.action, 'action', violations);
            normalized.staffId = params.staffId ? String(params.staffId) : '';
            normalized.shiftDate = params.shiftDate ? String(params.shiftDate) : '';
            normalized.shiftType = params.shiftType ? String(params.shiftType) : 'Morning';
            break;
        case 'CREATE_EVENT':
            normalized.title = ensureString(params.title, 'title', violations);
            normalized.type = params.type ? String(params.type) : 'Conference';
            normalized.startDate = params.startDate ? String(params.startDate) : '';
            normalized.endDate = params.endDate ? String(params.endDate) : '';
            normalized.pax = typeof params.pax === 'number' ? params.pax : 0;
            normalized.totalValue = typeof params.totalValue === 'number' ? params.totalValue : 0;
            break;
        case 'SEND_GUEST_MESSAGE':
            normalized.message = ensureString(params.message, 'message', violations);
            normalized.roomId = params.roomId ? String(params.roomId) : '';
            normalized.guestId = params.guestId ? String(params.guestId) : '';
            normalized.channel = params.channel ? String(params.channel) : 'in_app';
            break;
        case 'CREATE_MAINTENANCE':
            normalized.title = ensureString(params.title, 'title', violations);
            normalized.description = params.description ? String(params.description) : '';
            normalized.roomId = params.roomId ? String(params.roomId) : '';
            normalized.priority = params.priority ? String(params.priority) : 'Medium';
            break;

        case 'TROUBLESHOOT':
            normalized.target = ensureString(params.target, 'target', violations);
            normalized.command = ensureString(params.command, 'command', violations);
            normalized.reason = ensureString(params.reason, 'reason', violations);
            if (/[;&|`$]/.test(normalized.command)) {
                violations.push({
                    code: 'unsafe_command',
                    message: 'command contains unsafe shell metacharacters'
                });
            }
            break;
        case 'MODIFY_CODE': {
            const writeCheck = validateCodeWriteRequest(actor, {
                filePath: String(params.filePath || ''),
                change: String(params.change || '')
            });
            normalized.filePath = writeCheck.normalizedParams.filePath;
            normalized.change = writeCheck.normalizedParams.change;
            normalized.description = typeof params.description === 'string'
                ? params.description.trim()
                : 'AI requested code change';
            if (!writeCheck.allowed) {
                violations.push(...writeCheck.violations);
            }
            break;
        }
        default:
            violations.push({
                code: 'unknown_action',
                message: `Unsupported action: ${action}`
            });
    }

    return {
        allowed: violations.length === 0,
        normalizedParams: normalized,
        violations
    };
};

export const getTierForActor = (actor: AgentPrincipal): AITier => {
    return ACTOR_TO_TIER[actor];
};

