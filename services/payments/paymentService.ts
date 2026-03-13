import { httpsCallable } from 'firebase/functions';
import { functions } from '../kernel/firebase';

export interface PaymentIntentRequest {
    amountInCents: number;
    currency: string;
    reservationId: string;
    guestName: string;
    propertyId: string;
    captureMethod?: 'manual' | 'automatic';
}

export interface PaymentIntentResult {
    clientSecret: string;
    paymentIntentId: string;
}

/**
 * Singularity OS — Payment Service
 *
 * Calls the secure backend Cloud Function to create a Stripe Payment Intent.
 * The backend holds the Stripe secret key; the frontend only receives the
 * client_secret needed to confirm payment via Stripe.js (Stripe Elements).
 *
 * Hotel pre-authorization pattern:
 * - Funds are held (authorized) at booking creation.
 * - Funds are captured at check-out via a separate backend action.
 */
export const createPaymentIntent = async (
    amountInCents: number,
    currency: string,
    reservationId: string,
    guestName: string,
    propertyId: string,
    captureMethod: 'manual' | 'automatic' = 'manual'
): Promise<PaymentIntentResult> => {
    const createIntent = httpsCallable<PaymentIntentRequest, PaymentIntentResult>(
        functions,
        'createPaymentIntent'
    );

    const result = await createIntent({ amountInCents, currency, reservationId, guestName, propertyId, captureMethod });
    return result.data;
};

export const capturePaymentIntent = async (
    paymentIntentId: string,
    propertyId: string,
    amountInCents?: number
): Promise<{ status: string; amountCaptured: number }> => {
    const callable = httpsCallable(functions, 'capturePaymentIntent');
    const result: any = await callable({ paymentIntentId, propertyId, amountInCents });
    return result.data;
};

export const refundPaymentIntent = async (
    paymentIntentId: string,
    propertyId: string,
    amountInCents?: number,
    reason?: string
): Promise<{ status: string; refundId: string }> => {
    const callable = httpsCallable(functions, 'refundPaymentIntent');
    const result: any = await callable({ paymentIntentId, propertyId, amountInCents, reason });
    return result.data;
};

export const createSetupIntent = async (
    propertyId: string,
    customerId?: string
): Promise<{ clientSecret: string; customerId: string; setupIntentId: string }> => {
    const callable = httpsCallable(functions, 'createSetupIntent');
    const result: any = await callable({ propertyId, customerId });
    return result.data;
};
