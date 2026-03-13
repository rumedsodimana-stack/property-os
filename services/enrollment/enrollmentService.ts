/**
 * Hotel Singularity — Enrollment Service
 *
 * Frontend service that calls the `enrollHotel` Cloud Function.
 * Handles hotel provisioning: Firestore tenant creation, admin account,
 * Stripe customer, and welcome email.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnrollmentPayload {
  // Plan
  planId: 'starter' | 'professional' | 'enterprise';

  // Hotel identity
  hotelName: string;
  hotelDomain: string;          // e.g. "grandmeridian.com" (user-provided) or auto slug
  useCustomDomain: boolean;     // false = we generate a subdomain

  // Location
  country: string;
  timezone: string;
  currency: string;

  // Admin account
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
  adminPin: string;           // 4–6 digit daily ops PIN (hashed server-side)

  // Room count (for plan validation)
  roomCount: number;
}

export interface EnrollmentResult {
  success: boolean;
  hotelId: string;
  hotelSlug: string;
  adminEmail: string;
  operationsUrl: string;   // e.g. https://grandmeridian.singularityos.com/operation
  guestUrl: string;        // e.g. https://grandmeridian.singularityos.com
  message: string;
}

export interface EnrollmentError {
  code: string;
  message: string;
}

/**
 * Extract a user-friendly message from Firebase Callable / HttpsError.
 * Firebase returns errors where message can be "internal" or "INTERNAL: real message".
 * For failed-precondition, invalid-argument, already-exists, the backend message is passed through.
 */
export function getEnrollmentErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const e = err as { message?: string; details?: string; code?: string };
  let msg = (e.message ?? e.details ?? '').trim();
  // For non-internal codes, the backend message is user-facing — use it
  if (msg && e.code && !e.code.includes('internal')) {
    return msg;
  }
  // Firebase often returns "INTERNAL: actual message" or just "internal" for internal errors
  if (msg && msg.toLowerCase() !== 'internal' && !msg.startsWith('INTERNAL:')) {
    return msg;
  }
  if (typeof e.details === 'string' && e.details.trim()) return e.details;
  // Fallback for generic internal errors (message gets sanitized by Firebase)
  if (e.code === 'functions/internal' || (msg && msg.toLowerCase() === 'internal')) {
    return 'A server error occurred during enrollment. Please try again in a few minutes or contact support.';
  }
  return msg || 'An unexpected error occurred. Please try again.';
}

// ─── Service ─────────────────────────────────────────────────────────────────

const functions = getFunctions();

/**
 * Enroll a new hotel property.
 * Calls the `enrollHotel` Firebase Callable Function which:
 *  1. Validates the payload
 *  2. Creates the hotel Firestore document + subcollections
 *  3. Creates the Firebase Auth admin user with custom claims
 *  4. Creates a Stripe customer for subscription billing
 *  5. Sends a welcome email to the admin
 *  6. Returns the hotel's URLs and access details
 */
export async function enrollHotel(
  payload: EnrollmentPayload
): Promise<EnrollmentResult> {
  const enrollFn = httpsCallable<EnrollmentPayload, EnrollmentResult>(
    functions,
    'enrollHotel'
  );

  const result = await enrollFn(payload);
  return result.data;
}

/**
 * Check if a hotel domain/slug is already taken.
 */
export async function checkDomainAvailability(
  slug: string
): Promise<{ available: boolean }> {
  const checkFn = httpsCallable<{ slug: string }, { available: boolean }>(
    functions,
    'checkHotelDomain'
  );
  const result = await checkFn({ slug });
  return result.data;
}

/**
 * Derive a URL-safe slug from a hotel name.
 * e.g. "Grand Meridian Hotel" → "grand-meridian-hotel"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

// ─── Static data ──────────────────────────────────────────────────────────────

export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bahrain', 'Bangladesh', 'Belgium', 'Brazil', 'Cambodia', 'Canada', 'Chile',
  'China', 'Colombia', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark',
  'Ecuador', 'Egypt', 'Estonia', 'Ethiopia', 'Finland', 'France', 'Georgia',
  'Germany', 'Ghana', 'Greece', 'Hungary', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kuwait', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia',
  'Maldives', 'Malta', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand',
  'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Singapore',
  'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka',
  'Sweden', 'Switzerland', 'Taiwan', 'Tanzania', 'Thailand', 'Tunisia',
  'Turkey', 'UAE', 'Uganda', 'Ukraine', 'United Kingdom', 'United States',
  'Uruguay', 'Uzbekistan', 'Vietnam', 'Zimbabwe',
];

export const TIMEZONES: { label: string; value: string }[] = [
  { label: 'UTC-12:00 — Baker Island', value: 'Etc/GMT+12' },
  { label: 'UTC-11:00 — Samoa', value: 'Pacific/Pago_Pago' },
  { label: 'UTC-10:00 — Hawaii', value: 'Pacific/Honolulu' },
  { label: 'UTC-08:00 — Los Angeles', value: 'America/Los_Angeles' },
  { label: 'UTC-07:00 — Denver', value: 'America/Denver' },
  { label: 'UTC-06:00 — Chicago', value: 'America/Chicago' },
  { label: 'UTC-05:00 — New York', value: 'America/New_York' },
  { label: 'UTC-04:00 — Caracas', value: 'America/Caracas' },
  { label: 'UTC-03:00 — São Paulo', value: 'America/Sao_Paulo' },
  { label: 'UTC-02:00 — South Georgia', value: 'Atlantic/South_Georgia' },
  { label: 'UTC-01:00 — Azores', value: 'Atlantic/Azores' },
  { label: 'UTC+00:00 — London (GMT)', value: 'Europe/London' },
  { label: 'UTC+01:00 — Paris / Berlin', value: 'Europe/Paris' },
  { label: 'UTC+02:00 — Cairo / Helsinki', value: 'Africa/Cairo' },
  { label: 'UTC+03:00 — Moscow / Riyadh', value: 'Europe/Moscow' },
  { label: 'UTC+03:30 — Tehran', value: 'Asia/Tehran' },
  { label: 'UTC+04:00 — Dubai / Baku', value: 'Asia/Dubai' },
  { label: 'UTC+04:30 — Kabul', value: 'Asia/Kabul' },
  { label: 'UTC+05:00 — Karachi', value: 'Asia/Karachi' },
  { label: 'UTC+05:30 — Mumbai / Colombo', value: 'Asia/Kolkata' },
  { label: 'UTC+05:45 — Kathmandu', value: 'Asia/Kathmandu' },
  { label: 'UTC+06:00 — Dhaka', value: 'Asia/Dhaka' },
  { label: 'UTC+06:30 — Rangoon', value: 'Asia/Rangoon' },
  { label: 'UTC+07:00 — Bangkok / Jakarta', value: 'Asia/Bangkok' },
  { label: 'UTC+08:00 — Singapore / Beijing', value: 'Asia/Singapore' },
  { label: 'UTC+09:00 — Tokyo / Seoul', value: 'Asia/Tokyo' },
  { label: 'UTC+09:30 — Darwin / Adelaide', value: 'Australia/Darwin' },
  { label: 'UTC+10:00 — Sydney / Brisbane', value: 'Australia/Sydney' },
  { label: 'UTC+11:00 — Noumea', value: 'Pacific/Noumea' },
  { label: 'UTC+12:00 — Auckland / Fiji', value: 'Pacific/Auckland' },
];

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'SAR', label: 'Saudi Riyal (SAR)' },
  { code: 'QAR', label: 'Qatari Riyal (QAR)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'LKR', label: 'Sri Lankan Rupee (LKR)' },
  { code: 'MVR', label: 'Maldivian Rufiyaa (MVR)' },
  { code: 'THB', label: 'Thai Baht (฿)' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)' },
  { code: 'MYR', label: 'Malaysian Ringgit (MYR)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'NZD', label: 'New Zealand Dollar (NZD)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'CNY', label: 'Chinese Yuan (¥)' },
  { code: 'KRW', label: 'South Korean Won (₩)' },
  { code: 'BRL', label: 'Brazilian Real (R$)' },
  { code: 'ZAR', label: 'South African Rand (ZAR)' },
  { code: 'EGP', label: 'Egyptian Pound (EGP)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'SEK', label: 'Swedish Krona (SEK)' },
  { code: 'NOK', label: 'Norwegian Krone (NOK)' },
  { code: 'DKK', label: 'Danish Krone (DKK)' },
];
