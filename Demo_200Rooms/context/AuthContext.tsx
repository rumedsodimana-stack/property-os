/**
 * Hotel Singularity OS — AuthContext
 * The single source of truth for the currently logged-in operator.
 * Wraps internalAuthService and exposes a useAuth() hook app-wide.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { internalAuthService, OSSession, OSPermission, OSRole } from '../services/kernel/internalAuthService';

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
        const session = internalAuthService.getSession();
        setCurrentUser(session);
        setLoading(false);
    }, []);

    const login = useCallback(async (employeeId: string, pin: string): Promise<boolean> => {
        setLoginError(null);
        try {
            const session = await internalAuthService.login(employeeId, pin);
            setCurrentUser(session);
            return true;
        } catch (err: any) {
            setLoginError(err.message || 'Login failed.');
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        internalAuthService.logout();
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
