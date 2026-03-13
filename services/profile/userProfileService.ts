import { OSSession } from '../kernel/internalAuthService';
import { PosAccessPolicy, loadPosAccessPolicy } from '../pos/accessPolicy';

export interface UserProfileData {
    displayName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
}

export interface NotificationPreferences {
    incidents: boolean;
    approvals: boolean;
    posAlerts: boolean;
    reports: boolean;
}

export interface RecentSession {
    timestamp: number;
    userAgent: string;
}

const profileKey = (userId: string) => `hs_profile_${userId}`;
const notifKey = (userId: string) => `hs_notification_prefs_${userId}`;
const sessionsKey = (userId: string) => `hs_recent_sessions_${userId}`;

export const loadProfile = (session: OSSession): UserProfileData => {
    try {
        const raw = localStorage.getItem(profileKey(session.userId));
        if (raw) return JSON.parse(raw) as UserProfileData;
    } catch { /* noop */ }

    return {
        displayName: session.fullName,
        email: '',
        phone: '',
        avatarUrl: undefined
    };
};

export const saveProfile = (session: OSSession, data: UserProfileData) => {
    localStorage.setItem(profileKey(session.userId), JSON.stringify(data));
};

export const loadNotificationPrefs = (session: OSSession): NotificationPreferences => {
    try {
        const raw = localStorage.getItem(notifKey(session.userId));
        if (raw) return JSON.parse(raw) as NotificationPreferences;
    } catch { /* noop */ }
    return {
        incidents: true,
        approvals: true,
        posAlerts: true,
        reports: false
    };
};

export const saveNotificationPrefs = (session: OSSession, prefs: NotificationPreferences) => {
    localStorage.setItem(notifKey(session.userId), JSON.stringify(prefs));
};

export const recordRecentSession = (session: OSSession) => {
    const ua = navigator.userAgent;
    const entry: RecentSession = { timestamp: Date.now(), userAgent: ua };
    let list: RecentSession[] = [];
    try {
        const raw = localStorage.getItem(sessionsKey(session.userId));
        if (raw) list = JSON.parse(raw) as RecentSession[];
    } catch { /* noop */ }
    list = [entry, ...list].slice(0, 5);
    localStorage.setItem(sessionsKey(session.userId), JSON.stringify(list));
};

export const loadRecentSessions = (session: OSSession): RecentSession[] => {
    try {
        const raw = localStorage.getItem(sessionsKey(session.userId));
        if (raw) return JSON.parse(raw) as RecentSession[];
    } catch { /* noop */ }
    return [];
};

export const getPosIdentitySummary = (roleId: string) => {
    const policy: PosAccessPolicy = loadPosAccessPolicy();
    return {
        kioskEligible: policy.kioskRoles.includes(roleId),
        managerOverride: policy.managerOverrideRoles.includes(roleId),
        model: policy.model
    };
};
