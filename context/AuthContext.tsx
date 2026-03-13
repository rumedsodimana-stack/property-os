/**
 * Hotel Singularity OS — AuthContext
 * The single source of truth for the currently logged-in operator.
 * Wraps internalAuthService and exposes a useAuth() hook app-wide.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { internalAuthService, OSSession, OSPermission, OSRole } from '../services/kernel/internalAuthService';
import { tenantService } from '../services/kernel/tenantService';
import { db } from '../services/kernel/firebase';
import { savePropertyConfig, getPropertyConfig } from '../services/kernel/persistence';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
    /** The currently authenticated operator's session. Null if not logged in. */
    currentUser: OSSession | null;
    /** Whether the auth system is still initialising (checking localStorage). */
    loading: boolean;
    /** Error message from the last login attempt. */
    loginError: string | null;
    /** Attempt to log in with employeeId + PIN. */
    login: (employeeId: string, pin: string) => Promise<boolean>;
    /** Log the current user out. */
    logout: () => void;
    /** True if the current user has a specific OS permission. */
    hasPermission: (permission: OSPermission) => boolean;
    /** True if current user has any of the listed roles. */
    hasRole: (...roles: OSRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch the enrolled hotel's base config from `properties/{hotelId}` and
 * cache it in localStorage via savePropertyConfig so all components get the
 * real property name / currency / timezone without needing CURRENT_PROPERTY.
 */
async function hydratePropertyConfig(hotelId: string): Promise<void> {
    if (!hotelId || hotelId.startsWith('demo_property_')) return; // demo handled by seeder
    try {
        const snap = await getDoc(doc(db, 'properties', hotelId));
        if (!snap.exists()) return;
        const data = snap.data() as Record<string, unknown>;
        const existing = getPropertyConfig();
        savePropertyConfig({
            ...existing,
            id: hotelId,
            name: (data.name as string) || existing.name,
            operations: {
                ...existing.operations,
                currency: (data.currency as string) || existing.operations.currency,
                timezone: (data.timezone as string) || existing.operations.timezone,
            },
        });
    } catch (err) {
        console.warn('[Auth] Could not hydrate hotel config from Firestore:', err);
    }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<OSSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [loginError, setLoginError] = useState<string | null>(null);

    // On mount, restore session from localStorage
    useEffect(() => {
        let cancelled = false;
        const restore = async () => {
            const session = internalAuthService.getSession();
            if (session) {
                try {
                    await internalAuthService.ensureFirebaseClientAuth();
                    if (session.hotelId) {
                        const storedProperty = typeof localStorage !== 'undefined'
                            ? localStorage.getItem('hs_active_property')
                            : null;
                        // Keep GM property-switch choice across page reloads.
                        // Non-GM users always use their own hotel.
                        if (session.role !== 'GM' || !storedProperty) {
                            tenantService.setActivePropertyId(session.hotelId);
                        }
                        // Refresh cached hotel config so currency/name/timezone stay current.
                        void hydratePropertyConfig(session.hotelId);
                    }
                } catch (error) {
                    console.warn('[Auth] Firebase auth restore unavailable during bootstrap.', error);
                }
            }
            let userToSet: OSSession | null = session;
            if (!cancelled && !userToSet && import.meta.env.VITE_SKIP_LOGIN === 'true' && import.meta.env.DEV) {
                try {
                    const bypassSession = await internalAuthService.bypassLoginAsDemo();
                    if (bypassSession) {
                        tenantService.setActivePropertyId(bypassSession.hotelId);
                        userToSet = bypassSession;
                    }
                } catch (err) {
                    console.warn('[Auth] Bypass login failed:', err);
                }
            }
            if (!cancelled) {
                setCurrentUser(userToSet);
                setLoading(false);
            }
        };
        void restore();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (employeeId: string, pin: string): Promise<boolean> => {
        setLoginError(null);
        try {
            const session = await internalAuthService.login(employeeId, pin);
            if (session?.hotelId) {
                tenantService.setActivePropertyId(session.hotelId);
                // Load and cache hotel-specific config (name, currency, timezone).
                void hydratePropertyConfig(session.hotelId);
            }
            setCurrentUser(session);
            return true;
        } catch (err: unknown) {
            setLoginError(err instanceof Error ? err.message : 'Login failed.');
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        internalAuthService.logout();
        tenantService.clear();
        setCurrentUser(null);
    }, []);

    const hasPermission = useCallback((permission: OSPermission): boolean => {
        if (!currentUser) return false;
        return internalAuthService.hasPermission(permission, currentUser.role);
    }, [currentUser]);

    const hasRole = useCallback((...roles: OSRole[]): boolean => {
        if (!currentUser) return false;
        return roles.includes(currentUser.role);
    }, [currentUser]);

    return (
        <AuthContext.Provider value={{ currentUser, loading, loginError, login, logout, hasPermission, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};

export default AuthContext;
