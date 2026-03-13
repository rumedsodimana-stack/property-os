export type SessionModel = 'outlet_kiosk' | 'hybrid' | 'personal';

export interface PosAccessPolicy {
    model: SessionModel;
    requirePin: boolean;
    allowBiometric: boolean;
    pinLength: 4 | 6;
    idleLockMinutes: number;
    autoClockOutMinutes: number;
    offlineQueueLimit: number;
    kioskRoles: string[];
    managerOverrideRoles: string[];
}

export const POS_ACCESS_STORAGE_KEY = 'hs_pos_access_policy_v1';

export const DEFAULT_POS_ACCESS_POLICY: PosAccessPolicy = {
    model: 'hybrid',
    requirePin: true,
    allowBiometric: true,
    pinLength: 4,
    idleLockMinutes: 8,
    autoClockOutMinutes: 480,
    offlineQueueLimit: 25,
    kioskRoles: ['server', 'bartender', 'cashier'],
    managerOverrideRoles: ['outlet_manager', 'gm']
};

export const loadPosAccessPolicy = (): PosAccessPolicy => {
    try {
        const raw = localStorage.getItem(POS_ACCESS_STORAGE_KEY);
        if (!raw) return DEFAULT_POS_ACCESS_POLICY;
        const parsed = JSON.parse(raw) as Partial<PosAccessPolicy>;
        return {
            ...DEFAULT_POS_ACCESS_POLICY,
            ...parsed,
            pinLength: parsed.pinLength === 6 ? 6 : 4
        };
    } catch {
        return DEFAULT_POS_ACCESS_POLICY;
    }
};

export const savePosAccessPolicy = (policy: PosAccessPolicy) => {
    localStorage.setItem(POS_ACCESS_STORAGE_KEY, JSON.stringify(policy));
};

export const isRoleKioskEligible = (roleId: string, policy?: PosAccessPolicy) =>
    (policy || loadPosAccessPolicy()).kioskRoles.includes(roleId);

export const isRoleManagerOverride = (roleId: string, policy?: PosAccessPolicy) =>
    (policy || loadPosAccessPolicy()).managerOverrideRoles.includes(roleId);
