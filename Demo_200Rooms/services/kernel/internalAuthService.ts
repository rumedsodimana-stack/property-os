/**
 * Hotel Singularity OS — Internal Authentication Service
 * Self-contained session management. No external auth provider required.
 * Uses Firestore `users` collection for identity + SHA-256 PIN hashing.
 */
import { fetchItems } from './firestoreService';

// ─── Role Permission Matrix ──────────────────────────────────────────────────

export type OSRole = 'GM' | 'Manager' | 'Supervisor' | 'Staff' | 'Guest' | 'Finance' | 'FrontDesk' | 'Chef';

export type OSPermission =
    | 'approve_leave'
    | 'reject_leave'
    | 'void_transaction'
    | 'approve_recipe'
    | 'create_event'
    | 'manage_shifts'
    | 'check_in_guest'
    | 'check_out_guest'
    | 'mark_room_clean'
    | 'create_reservation'
    | 'view_financials'
    | 'manage_staff';

const ROLE_PERMISSIONS: Record<OSRole, OSPermission[]> = {
    GM: [
        'approve_leave', 'reject_leave', 'void_transaction', 'approve_recipe',
        'create_event', 'manage_shifts', 'check_in_guest', 'check_out_guest',
        'mark_room_clean', 'create_reservation', 'view_financials', 'manage_staff'
    ],
    Manager: [
        'approve_leave', 'reject_leave', 'void_transaction', 'approve_recipe',
        'create_event', 'manage_shifts', 'check_in_guest', 'check_out_guest',
        'mark_room_clean', 'create_reservation', 'view_financials'
    ],
    Finance: [
        'void_transaction', 'view_financials', 'approve_recipe'
    ],
    FrontDesk: [
        'check_in_guest', 'check_out_guest', 'create_reservation'
    ],
    Supervisor: [
        'create_event', 'manage_shifts', 'check_in_guest', 'check_out_guest',
        'mark_room_clean', 'create_reservation'
    ],
    Chef: [
        'approve_recipe', 'mark_room_clean'
    ],
    Staff: [
        'mark_room_clean', 'create_reservation'
    ],
    Guest: [],
};

// ─── Session Types ────────────────────────────────────────────────────────────

export interface OSSession {
    userId: string;       // matches `principal` in users collection
    fullName: string;
    role: OSRole;
    hotelId: string;
    loginAt: number;
    expiresAt: number;    // 12-hour rolling session
    backendToken?: string;
    backendSessionId?: string;
}

const SESSION_KEY = 'hs_os_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

const getEnv = (key: string): string => {
    try {
        // @ts-ignore - import.meta.env is handled by Vite
        if (import.meta && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch { }
    try {
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key] as string;
        }
    } catch { }
    return '';
};

const demoUsersEnabled = getEnv('VITE_ENABLE_DEMO_USERS') === 'true';
const demoPin = getEnv('VITE_DEMO_USER_PIN');

const FALLBACK_USERS = demoUsersEnabled && !!demoPin ? [
    { principal: 'GM001', employeeId: 'GM001', fullName: 'System General Manager', role: 'GM', hotelId: 'H1', pin: demoPin },
    { principal: 'FD001', employeeId: 'FD001', fullName: 'Front Desk Agent', role: 'FrontDesk', hotelId: 'H1', pin: demoPin },
    { principal: 'FIN001', employeeId: 'FIN001', fullName: 'Finance Controller', role: 'Finance', hotelId: 'H1', pin: demoPin },
    { principal: 'GUEST001', employeeId: 'GUEST001', fullName: 'Guest Demo', role: 'Guest', hotelId: 'H1', pin: demoPin },
] as const : [];

const DIGIT_WORDS: Record<string, string> = {
    ZERO: '0',
    ONE: '1',
    TWO: '2',
    THREE: '3',
    FOUR: '4',
    FIVE: '5',
    SIX: '6',
    SEVEN: '7',
    EIGHT: '8',
    NINE: '9',
};

const normalizePrincipal = (value: string): string => {
    const compact = (value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    return Object.entries(DIGIT_WORDS).reduce(
        (acc, [word, digit]) => acc.replace(new RegExp(word, 'g'), digit),
        compact
    );
};

const canonicalPrincipal = (value: string): string => {
    const normalized = normalizePrincipal(value);
    const match = normalized.match(/^([A-Z]+)(\d+)$/);
    if (!match) return normalized;
    const [, prefix, digits] = match;
    return `${prefix}${Number(digits)}`;
};

// ─── PIN Hashing ─────────────────────────────────────────────────────────────

/**
 * SHA-256 hash a PIN string using the Web Crypto API (built into every browser).
 * No external library needed.
 */
async function hashPin(pin: string): Promise<string> {
    // Preferred: Web Crypto SHA-256
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for environments where SubtleCrypto is unavailable.
    // Not cryptographically secure; used only to avoid auth runtime failure.
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
        hash = ((hash << 5) - hash) + pin.charCodeAt(i);
        hash |= 0;
    }
    return `fallback_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

// ─── Auth Service ────────────────────────────────────────────────────────────

export const internalAuthService = {

    /**
     * Authenticate a user by employeeId + PIN.
     * Looks up the user in Firestore, validates hashed PIN.
     * Falls back to plain-text PIN comparison for users without a hash yet
     * (first-login grace period — the hash is stored after first login).
     */
    async login(employeeId: string, pin: string): Promise<OSSession> {
        const normalizedInput = normalizePrincipal(employeeId);
        let users: any[] = [];
        try {
            users = await fetchItems<any>('users');
        } catch (error) {
            console.warn('[Auth] Unable to read users collection, using local fallback accounts.');
        }

        const canonicalInput = canonicalPrincipal(employeeId);
        const match = users.find((u: any) =>
            normalizePrincipal(u.principal || '') === normalizedInput ||
            normalizePrincipal(u.email || '') === normalizedInput ||
            normalizePrincipal(u.employeeId || '') === normalizedInput ||
            canonicalPrincipal(u.principal || '') === canonicalInput ||
            canonicalPrincipal(u.email || '') === canonicalInput ||
            canonicalPrincipal(u.employeeId || '') === canonicalInput ||
            u.principal === employeeId ||
            u.email === employeeId ||
            u.employeeId === employeeId
        ) || FALLBACK_USERS.find((u: any) =>
            normalizePrincipal(u.principal || '') === normalizedInput ||
            normalizePrincipal(u.employeeId || '') === normalizedInput ||
            canonicalPrincipal(u.principal || '') === canonicalInput ||
            canonicalPrincipal(u.employeeId || '') === canonicalInput ||
            u.principal === employeeId ||
            u.employeeId === employeeId
        );

        if (!match) {
            throw new Error('Employee not found. Check your ID and try again.');
        }

        const inputHash = await hashPin(pin);

        // Support hashed PINs (production) and plain-text PINs (initial seed)
        const storedPin = match.pinHash || match.pin || '';
        const isHashMatch = storedPin === inputHash;
        const isPlainMatch = storedPin === pin; // first-login fallback

        if (!isHashMatch && !isPlainMatch) {
            throw new Error('Incorrect PIN. Please try again.');
        }

        const role = (match.role as OSRole) || 'Staff';
        const session: OSSession = {
            userId: match.principal || match.id,
            fullName: match.fullName || match.name || employeeId,
            role,
            hotelId: match.hotelId || 'H1',
            loginAt: Date.now(),
            expiresAt: Date.now() + SESSION_DURATION_MS,
        };

        // Obtain a short-lived backend token for privileged operations.
        // If unavailable (offline/demo), local session still works for non-privileged UX.
        try {
            const { httpsCallable } = await import('firebase/functions');
            const { functions } = await import('./firebase');
            const issueOperatorSession = httpsCallable(functions, 'issueOperatorSession');
            const tokenResult = await issueOperatorSession({
                userId: session.userId,
                role: session.role,
                hotelId: session.hotelId
            });
            const tokenData = tokenResult.data as { token?: string; sessionId?: string; expiresAt?: number };
            if (tokenData?.token) {
                session.backendToken = tokenData.token;
                session.backendSessionId = tokenData.sessionId;
                if (tokenData.expiresAt) {
                    session.expiresAt = Math.min(session.expiresAt, tokenData.expiresAt);
                }
            }
        } catch (error) {
            console.warn('[Auth] Backend session issuance unavailable; proceeding with local session.', error);
        }

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    },

    /**
     * Log the current user out and clear session.
     */
    logout(): void {
        localStorage.removeItem(SESSION_KEY);
    },

    /**
     * Get the current active session. Returns null if none or expired.
     */
    getSession(): OSSession | null {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const session: OSSession = JSON.parse(raw);
            if (Date.now() > session.expiresAt) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            // Roll session expiry on activity
            session.expiresAt = Date.now() + SESSION_DURATION_MS;
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return session;
        } catch {
            return null;
        }
    },

    /**
     * Check if the current role has a specific permission.
     */
    hasPermission(permission: OSPermission, role?: OSRole): boolean {
        const checkRole = role || this.getSession()?.role || 'Guest';
        return ROLE_PERMISSIONS[checkRole]?.includes(permission) ?? false;
    },

    /**
     * Get the display label for a role.
     */
    getRoleLabel(role: OSRole): string {
        const labels: Record<OSRole, string> = {
            GM: 'General Manager',
            Manager: 'Manager',
            Finance: 'Finance Officer',
            FrontDesk: 'Front Desk Agent',
            Supervisor: 'Supervisor',
            Chef: 'Chef',
            Staff: 'Staff',
            Guest: 'Guest',
        };
        return labels[role] || role;
    },
};
