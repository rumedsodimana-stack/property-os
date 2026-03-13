import { httpsCallable } from 'firebase/functions';
import { GuestKey } from '../../types';
import { functions } from '../kernel/firebase';

interface IssueGuestWalletKeyRequest {
    reservationId: string;
    forceReissue?: boolean;
}

interface RevokeGuestWalletKeyRequest {
    reservationId?: string;
    guestKeyId?: string;
    reason?: string;
}

interface ResendGuestWalletKeyRequest {
    reservationId?: string;
    guestKeyId?: string;
}

interface GuestKeyCallableResponse {
    success: boolean;
    key?: GuestKey;
    keyId?: string;
    revoked?: number;
    reason?: string;
    message?: string;
    alreadyActive?: boolean;
}

interface GenerateApplePassRequest {
    reservationId?: string;
    guestKeyId?: string;
}

interface GenerateApplePassResponse {
    success: boolean;
    keyId?: string;
    filename?: string;
    pkpassBase64?: string;
    installable?: boolean;
    message?: string;
}

const issueGuestWalletKeyFn = httpsCallable<IssueGuestWalletKeyRequest, GuestKeyCallableResponse>(
    functions,
    'issueGuestWalletKey'
);

const revokeGuestWalletKeyFn = httpsCallable<RevokeGuestWalletKeyRequest, GuestKeyCallableResponse>(
    functions,
    'revokeGuestWalletKey'
);

const resendGuestWalletKeyFn = httpsCallable<ResendGuestWalletKeyRequest, GuestKeyCallableResponse>(
    functions,
    'resendGuestWalletKey'
);

const generateAppleWalletPassFn = httpsCallable<GenerateApplePassRequest, GenerateApplePassResponse>(
    functions,
    'generateMockAppleWalletPass'
);

const normalizeError = (error: unknown, fallback: string): Error => {
    const typed = error as { message?: string; details?: unknown; code?: string };
    const details = typeof typed?.details === 'string' ? typed.details : '';
    const message = typeof typed?.message === 'string' ? typed.message : '';
    const code = typeof typed?.code === 'string' ? typed.code : '';

    if (details) return new Error(details);
    if (message && message.toLowerCase() !== 'internal') return new Error(message);
    if (code.includes('failed-precondition')) return new Error('Reservation is not eligible for key issuance yet.');
    if (code.includes('permission-denied')) return new Error('Permission denied. Check your role and Firestore rules.');
    if (code.includes('unauthenticated')) return new Error('Please sign in again and retry.');
    return new Error(fallback);
};

export const guestKeyService = {
    async issueWalletKey(reservationId: string, forceReissue = false): Promise<GuestKeyCallableResponse> {
        if (!reservationId?.trim()) {
            throw new Error('Reservation ID is required to issue a guest key.');
        }
        try {
            const result = await issueGuestWalletKeyFn({
                reservationId: reservationId.trim(),
                forceReissue
            });
            return result.data;
        } catch (error) {
            throw normalizeError(error, 'Unable to issue guest wallet key.');
        }
    },

    async revokeWalletKeyForReservation(reservationId: string, reason?: string): Promise<GuestKeyCallableResponse> {
        if (!reservationId?.trim()) {
            throw new Error('Reservation ID is required to revoke guest keys.');
        }
        try {
            const result = await revokeGuestWalletKeyFn({
                reservationId: reservationId.trim(),
                reason
            });
            return result.data;
        } catch (error) {
            throw normalizeError(error, 'Unable to revoke guest wallet key.');
        }
    },

    async resendWalletKeyByReservation(reservationId: string): Promise<GuestKeyCallableResponse> {
        if (!reservationId?.trim()) {
            throw new Error('Reservation ID is required to resend wallet key.');
        }
        try {
            const result = await resendGuestWalletKeyFn({
                reservationId: reservationId.trim()
            });
            return result.data;
        } catch (error) {
            throw normalizeError(error, 'Unable to resend wallet key.');
        }
    },

    async resendWalletKeyById(guestKeyId: string): Promise<GuestKeyCallableResponse> {
        if (!guestKeyId?.trim()) {
            throw new Error('Guest key ID is required to resend wallet key.');
        }
        try {
            const result = await resendGuestWalletKeyFn({
                guestKeyId: guestKeyId.trim()
            });
            return result.data;
        } catch (error) {
            throw normalizeError(error, 'Unable to resend wallet key.');
        }
    },

    async generateAppleWalletPassByReservation(reservationId: string): Promise<GenerateApplePassResponse> {
        if (!reservationId?.trim()) {
            throw new Error('Reservation ID is required to generate Apple Wallet pass.');
        }
        try {
            const result = await generateAppleWalletPassFn({
                reservationId: reservationId.trim()
            });
            return result.data;
        } catch (error) {
            throw normalizeError(error, 'Unable to generate Apple Wallet pass.');
        }
    },

    async generateAppleWalletPassByKey(guestKeyId: string): Promise<GenerateApplePassResponse> {
        if (!guestKeyId?.trim()) {
            throw new Error('Guest key ID is required to generate Apple Wallet pass.');
        }
        try {
            const result = await generateAppleWalletPassFn({
                guestKeyId: guestKeyId.trim()
            });
            return result.data;
        } catch (error) {
            throw normalizeError(error, 'Unable to generate Apple Wallet pass.');
        }
    }
};
