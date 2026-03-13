/**
 * Hotel Singularity OS — Internal Authentication Service
 * Strict role-backed Firebase auth via backend-issued custom tokens.
 */
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { signInAnonymously } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebase';

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
    | 'issue_guest_key'
    | 'revoke_guest_key'
    | 'resend_guest_key'
    | 'mark_room_clean'
    | 'create_reservation'
    | 'view_financials'
    | 'manage_staff';

const ROLE_PERMISSIONS: Record<OSRole, OSPermission[]> = {
    GM: [
        'approve_leave', 'reject_leave', 'void_transaction', 'approve_recipe',
        'create_event', 'manage_shifts', 'check_in_guest', 'check_out_guest',
        'issue_guest_key', 'revoke_guest_key', 'resend_guest_key',
        'mark_room_clean', 'create_reservation', 'view_financials', 'manage_staff'
    ],
    Manager: [
        'approve_leave', 'reject_leave', 'void_transaction', 'approve_recipe',
        'create_event', 'manage_shifts', 'check_in_guest', 'check_out_guest',
        'issue_guest_key', 'revoke_guest_key', 'resend_guest_key',
        'mark_room_clean', 'create_reservation', 'view_financials'
    ],
    Finance: [
        'void_transaction', 'view_financials', 'approve_recipe'
    ],
    FrontDesk: [
        'check_in_guest', 'check_out_guest', 'issue_guest_key', 'revoke_guest_key', 'resend_guest_key', 'create_reservation'
    ],
    Supervisor: [
        'create_event', 'manage_shifts', 'check_in_guest', 'check_out_guest',
        'issue_guest_key', 'revoke_guest_key', 'resend_guest_key',
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
    userId: string;
    fullName: string;
    role: OSRole;
    hotelId: string;
    loginAt: number;
    expiresAt: number;
    backendToken?: string;
    backendSessionId?: string;
    authMode?: 'custom_token' | 'anonymous_demo';
}

interface IssueOperatorSessionResponse {
    token: string;
    sessionId: string;
    expiresAt: number;
    user: {
        userId: string;
        principal: string;
        fullName: string;
        role: OSRole;
        hotelId: string;
    };
}

const SESSION_KEY = 'hs_os_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const DEMO_MODE_ENABLED = import.meta.env.VITE_ENABLE_DEMO_USERS === 'true';
const DEMO_PIN = String(import.meta.env.VITE_DEMO_USER_PIN || '1234');
/** Dev-only: skip login and auto-enter as GM. Set VITE_SKIP_LOGIN=true in .env.local */
const SKIP_LOGIN_ENABLED = import.meta.env.DEV && import.meta.env.VITE_SKIP_LOGIN === 'true';

const DEMO_USERS: Array<{ userId: string; fullName: string; role: OSRole; hotelId: string }> = [
    { userId: 'GM001', fullName: 'System General Manager', role: 'GM', hotelId: 'demo_property_h1' },
    { userId: 'FD001', fullName: 'Front Desk Agent', role: 'FrontDesk', hotelId: 'demo_property_h1' },
    { userId: 'FIN001', fullName: 'Finance Controller', role: 'Finance', hotelId: 'demo_property_h1' },
    { userId: 'GUEST001', fullName: 'Guest Demo', role: 'Guest', hotelId: 'demo_property_h1' }
];

const parseSession = (): OSSession | null => {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as OSSession;
        if (!parsed?.userId || !parsed?.role || !parsed?.expiresAt) return null;
        return parsed;
    } catch {
        return null;
    }
};

const isBackendUnavailableError = (error: any): boolean => {
    const message = String(error?.message || error?.code || '').toLowerCase();
    return (
        message.includes('unavailable') ||
        message.includes('internal') ||
        message.includes('cors') ||
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('network error') ||
        message.includes('fetch') ||
        message.includes('deadline') ||
        message.includes('timeout') ||
        // Firebase Functions not deployed / unreachable
        message.includes('not-found') === false && message.includes('functions/') ||
        error?.code === 'functions/unavailable' ||
        error?.code === 'functions/internal' ||
        error?.code === 'functions/deadline-exceeded'
    );
};

const normalizeAuthError = (error: any): Error => {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('not-found') || error?.code === 'functions/not-found') {
        return new Error('Employee not found. Check your ID and try again.');
    }
    if (message.includes('permission-denied') || error?.code === 'functions/permission-denied') {
        return new Error('Incorrect PIN. Please try again.');
    }
    if (isBackendUnavailableError(error)) {
        return new Error('Authentication backend is unavailable. Verify Firebase Functions and try again.');
    }
    return new Error(error?.message || 'Login failed.');
};

const resolveDemoUser = (employeeId: string, pin: string): OSSession | null => {
    if (!DEMO_MODE_ENABLED) return null;
    if (pin !== DEMO_PIN) return null;
    const normalized = employeeId.trim().toUpperCase();
    const found = DEMO_USERS.find((user) => user.userId === normalized);
    if (!found) return null;

    return {
        userId: found.userId,
        fullName: found.fullName,
        role: found.role,
        hotelId: found.hotelId,
        loginAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION_MS,
        authMode: 'anonymous_demo'
    };
};

// ─── Auth Service ────────────────────────────────────────────────────────────

export const internalAuthService = {
    async ensureFirebaseClientAuth(): Promise<void> {
        if (auth.currentUser) return;
        const session = parseSession();
        if (session?.authMode === 'anonymous_demo') {
            if (!DEMO_MODE_ENABLED) {
                throw new Error('Demo login mode is disabled. Please sign in again.');
            }
            try {
                await signInAnonymously(auth);
            } catch (error) {
                console.warn('[Auth] Anonymous auth unavailable; continuing in demo fallback mode.', error);
            }
            return;
        }
        if (!session?.backendToken) {
            throw new Error('No active Firebase session token. Please sign in again.');
        }
        await signInWithCustomToken(auth, session.backendToken);
    },

    async login(employeeId: string, pin: string): Promise<OSSession> {
        const cleanEmployeeId = employeeId.trim();
        const cleanPin = pin.trim();

        if (!cleanEmployeeId || !cleanPin) {
            throw new Error('Employee ID and PIN are required.');
        }

        if (!/^\d{4,6}$/.test(cleanPin)) {
            throw new Error('PIN must be 4–6 digits');
        }

        const issueOperatorSession = httpsCallable<
            { employeeId: string; pin: string },
            IssueOperatorSessionResponse
        >(functions, 'issueOperatorSession');

        let response: IssueOperatorSessionResponse;
        try {
            const result = await issueOperatorSession({ employeeId: cleanEmployeeId, pin: cleanPin });
            response = result.data;
        } catch (error: any) {
            const normalizedError = normalizeAuthError(error);
            const demoSession = resolveDemoUser(cleanEmployeeId, cleanPin);
            // Fall back to demo session whenever the backend is unreachable (network, CORS,
            // function not deployed, timeout, etc.) and valid demo credentials were supplied.
            if (demoSession && isBackendUnavailableError(error)) {
                try {
                    await signInAnonymously(auth);
                } catch (anonymousError) {
                    console.warn('[Auth] Anonymous auth unavailable; continuing in demo fallback mode.', anonymousError);
                }
                localStorage.setItem(SESSION_KEY, JSON.stringify(demoSession));
                return demoSession;
            }
            throw normalizedError;
        }

        if (!response?.token || !response?.user?.userId) {
            throw new Error('Authentication backend returned an invalid session payload.');
        }

        try {
            await signInWithCustomToken(auth, response.token);
        } catch {
            throw new Error('Failed to establish Firebase session. Check Firebase Auth configuration.');
        }

        const session: OSSession = {
            userId: response.user.userId,
            fullName: response.user.fullName || cleanEmployeeId,
            role: response.user.role || 'Staff',
            hotelId: response.user.hotelId || '',
            loginAt: Date.now(),
            expiresAt: Math.min(Date.now() + SESSION_DURATION_MS, response.expiresAt || Number.MAX_SAFE_INTEGER),
            backendToken: response.token,
            backendSessionId: response.sessionId,
            authMode: 'custom_token'
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    },

    logout(): void {
        localStorage.removeItem(SESSION_KEY);
        void signOut(auth).catch((error) => {
            console.warn('[Auth] Firebase sign-out failed:', error);
        });
    },

    /**
     * Dev-only bypass: create and store a GM demo session without credentials.
     * Only works when VITE_SKIP_LOGIN=true and in development.
     */
    async bypassLoginAsDemo(): Promise<OSSession | null> {
        if (!SKIP_LOGIN_ENABLED) return null;
        const gm = DEMO_USERS.find((u) => u.role === 'GM');
        if (!gm) return null;
        const session: OSSession = {
            userId: gm.userId,
            fullName: gm.fullName,
            role: gm.role,
            hotelId: gm.hotelId,
            loginAt: Date.now(),
            expiresAt: Date.now() + SESSION_DURATION_MS,
            authMode: 'anonymous_demo',
        };
        try {
            await signInAnonymously(auth);
        } catch (err) {
            console.warn('[Auth] Anonymous sign-in failed; continuing in bypass mode.', err);
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    },

    getSession(): OSSession | null {
        const session = parseSession();
        if (!session) return null;

        if (Date.now() > session.expiresAt) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        const rolled: OSSession = {
            ...session,
            expiresAt: Math.min(Date.now() + SESSION_DURATION_MS, session.expiresAt)
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(rolled));
        return rolled;
    },

    hasPermission(permission: OSPermission, role?: OSRole): boolean {
        const checkRole = role || this.getSession()?.role || 'Guest';
        return ROLE_PERMISSIONS[checkRole]?.includes(permission) ?? false;
    },

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
