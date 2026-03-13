import { loadStripe, Stripe } from '@stripe/stripe-js';

/**
 * Singularity OS — Stripe Frontend Service
 *
 * PCI-DSS Compliance: Stripe.js is loaded from Stripe's CDN.
 * Card data is tokenized directly on Stripe's servers via Stripe Elements —
 * it never passes through Singularity OS servers or code.
 *
 * The publishable key is safe to expose in the frontend (it cannot charge cards).
 * It is read from the environment variable VITE_STRIPE_PUBLISHABLE_KEY.
 */

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns a singleton Stripe instance initialized with the publishable key.
 * Lazily loaded on first call.
 */
export const getStripe = (): Promise<Stripe | null> => {
    if (!stripePromise) {
        const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

        if (!publishableKey || publishableKey === 'your_stripe_publishable_key_here') {
            console.warn('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY is not set. Payment processing will not work.');
            return Promise.resolve(null);
        }

        stripePromise = loadStripe(publishableKey);
    }

    return stripePromise;
};

/**
 * Reset the Stripe singleton (e.g., after key rotation).
 */
export const resetStripe = (): void => {
    stripePromise = null;
};
