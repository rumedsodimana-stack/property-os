/**
 * Hotel Singularity — Enrollment Cloud Functions
 *
 * enrollHotel   : Callable — provisions a new hotel tenant end-to-end
 * checkHotelDomain : Callable — checks if a hotel slug/domain is already taken
 *
 * Provisioning steps inside enrollHotel:
 *  1. Validate payload
 *  2. Check slug uniqueness
 *  3. Create Firestore hotel document + bootstrap subcollections
 *  4. Create Firebase Auth user (admin) with custom claims
 *  5. Create Stripe customer + free-trial subscription
 *  6. Send branded welcome email via SMTP
 *  7. Return EnrollmentResult
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import Stripe from 'stripe';

// ─── Re-use shared db instance (initialised in index.ts) ─────────────────────
const db = admin.firestore();

// ─── Config ───────────────────────────────────────────────────────────────────

const SMTP_HOST  = process.env.SMTP_HOST  || functions.config().smtp?.host  || '';
const SMTP_PORT  = Number(process.env.SMTP_PORT || functions.config().smtp?.port || 587);
const SMTP_USER  = process.env.SMTP_USER  || functions.config().smtp?.user  || '';
const SMTP_PASS  = process.env.SMTP_PASS  || functions.config().smtp?.pass  || '';
const EMAIL_FROM = process.env.ENROLL_FROM || functions.config().enrollment?.from || SMTP_USER || 'noreply@singularityos.com';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key || '';

// Stripe Price IDs (set these in Firebase config or env vars)
// e.g. firebase functions:config:set stripe.price_starter="price_xxxx"
const STRIPE_PRICE_IDS: Record<string, string> = {
  starter:      process.env.STRIPE_PRICE_STARTER      || functions.config().stripe?.price_starter      || '',
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || functions.config().stripe?.price_professional || '',
  enterprise:   process.env.STRIPE_PRICE_ENTERPRISE   || functions.config().stripe?.price_enterprise   || '',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrollmentPayload {
  planId: 'starter' | 'professional' | 'enterprise';
  hotelName: string;
  hotelDomain: string;
  useCustomDomain: boolean;
  country: string;
  timezone: string;
  currency: string;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
  adminPin: string;           // 4–6 digit daily ops PIN (stored as SHA-256 hash)
  roomCount: number;
}

interface EnrollmentResult {
  success: boolean;
  hotelId: string;
  hotelSlug: string;
  adminEmail: string;
  operationsUrl: string;
  guestUrl: string;
  message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a hotel name to a URL-safe slug (mirrors the frontend slugify). */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

/** Build a plan-display label for emails. */
const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_PRICES: Record<string, number> = {
  starter: 690,
  professional: 1600,
  enterprise: 3900,
};

function discountedPrice(planId: string): number {
  return Math.round((PLAN_PRICES[planId] ?? 0) * 0.5);
}

/** Build the SMTP transporter (lazy — created once per cold start). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _transport: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTransport(): any {
  if (_transport) return _transport;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  _transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return _transport;
}

/** Validate the incoming enrollment payload. Throws HttpsError on failure. */
function validatePayload(d: Partial<EnrollmentPayload>): asserts d is EnrollmentPayload {
  const required: Array<keyof EnrollmentPayload> = [
    'planId', 'hotelName', 'hotelDomain', 'country', 'timezone',
    'currency', 'adminFullName', 'adminEmail', 'adminPassword', 'adminPin', 'roomCount',
  ];
  for (const key of required) {
    if (d[key] === undefined || d[key] === null || d[key] === '') {
      throw new functions.https.HttpsError('invalid-argument', `Missing required field: ${key}`);
    }
  }
  if (!['starter', 'professional', 'enterprise'].includes(d.planId!)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid planId');
  }
  if (typeof d.roomCount !== 'number' || d.roomCount < 1) {
    throw new functions.https.HttpsError('invalid-argument', 'roomCount must be a positive number');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.adminEmail!)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid adminEmail');
  }
  if ((d.adminPassword ?? '').length < 8) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 8 characters');
  }
  const pin = d.adminPin ?? '';
  if (!/^\d{4,6}$/.test(pin)) {
    throw new functions.https.HttpsError('invalid-argument', 'adminPin must be 4–6 digits');
  }
}

// ─── Bootstrap Firestore subcollections ──────────────────────────────────────

/**
 * Seed the hotel's Firestore document and all required subcollections.
 * This sets up the "empty but valid" structure that the ops app expects.
 */
async function bootstrapHotelFirestore(
  hotelId: string,
  payload: EnrollmentPayload,
  adminUid: string,
  stripeCustomerId: string,
  pinHash: string,
): Promise<void> {
  const batch = db.batch();
  const hotelRef = db.collection('hotels').doc(hotelId);
  const now = FieldValue.serverTimestamp();

  // ── Main hotel document ──────────────────────────────────────────────────
  batch.set(hotelRef, {
    id: hotelId,
    name: payload.hotelName,
    slug: slugify(payload.hotelName),
    domain: payload.hotelDomain,
    useCustomDomain: payload.useCustomDomain,
    country: payload.country,
    timezone: payload.timezone,
    currency: payload.currency,
    roomCount: payload.roomCount,
    planId: payload.planId,
    status: 'active',
    stripeCustomerId,
    adminUid,
    adminEmail: payload.adminEmail,
    createdAt: now,
    updatedAt: now,
  });

  // ── Settings subcollection ───────────────────────────────────────────────
  const settingsRef = hotelRef.collection('settings').doc('general');
  batch.set(settingsRef, {
    hotelName: payload.hotelName,
    currency: payload.currency,
    timezone: payload.timezone,
    country: payload.country,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    taxRate: 0,
    serviceChargeRate: 0,
    logoUrl: '',
    brandColor: '#6366f1',
    setupComplete: false,          // triggers HotelSetupWizard on first GM login
    brandOnboardingComplete: false,
    updatedAt: now,
  });

  // ── Subscription record ──────────────────────────────────────────────────
  const subRef = hotelRef.collection('subscription').doc('current');
  batch.set(subRef, {
    planId: payload.planId,
    planName: PLAN_LABELS[payload.planId],
    monthlyPrice: PLAN_PRICES[payload.planId],
    discountedPrice: discountedPrice(payload.planId),
    discountPct: 50,
    discountMonths: 3,
    status: 'trialing',
    stripeCustomerId,
    currentPeriodStart: now,
    createdAt: now,
    updatedAt: now,
  });

  // ── Staff document: seeding admin as General Manager ────────────────────
  const staffRef = hotelRef.collection('staff').doc(adminUid);
  batch.set(staffRef, {
    uid: adminUid,
    fullName: payload.adminFullName,
    email: payload.adminEmail,
    role: 'General Manager',
    employeeId: 'GM001',
    department: 'Management',
    status: 'active',
    isAdmin: true,
    hotelId,
    pinHash,              // SHA-256 hash of the admin's daily ops PIN
    createdAt: now,
    updatedAt: now,
  });

  // ── Global users collection ─────────────────────────────────────────────
  // `issueOperatorSession` (in index.ts) looks up staff via db.collection('users').
  // Enrolled GMs must be registered here so that Employee ID + PIN login works
  // the moment they receive their hotel. The document ID is adminUid; the
  // `employeeId` / `principal` fields are what the resolver matches against.
  const usersRef = db.collection('users').doc(adminUid);
  batch.set(usersRef, {
    uid: adminUid,
    userId: 'GM001',
    principal: 'GM001',
    employeeId: 'GM001',
    fullName: payload.adminFullName,
    email: payload.adminEmail,
    role: 'General Manager',
    hotelId,
    pinHash,
    isAdmin: true,
    source: 'enrollment',
    createdAt: now,
    updatedAt: now,
  });

  // ── Properties root document ────────────────────────────────────────────
  // The ops app stores all live operational data under properties/{hotelId}/.
  // Create the root document so the Firestore path exists and security rules
  // can scope reads/writes to this hotel from day one.
  const propRef = db.collection('properties').doc(hotelId);
  batch.set(propRef, {
    id: hotelId,
    hotelId,
    name: payload.hotelName,
    currency: payload.currency,
    timezone: payload.timezone,
    country: payload.country,
    roomCount: payload.roomCount,
    planId: payload.planId,
    isDemo: false,                 // never seed this property with demo data
    enrolledAt: now,
    updatedAt: now,
  });

  // ── Rooms collection: seed placeholder for setup wizard ─────────────────
  const roomsMetaRef = hotelRef.collection('rooms').doc('_meta');
  batch.set(roomsMetaRef, {
    totalRooms: payload.roomCount,
    initialised: false,
    note: 'Rooms will be configured during hotel setup wizard',
    createdAt: now,
  });

  // ── Activity log ────────────────────────────────────────────────────────
  const activityRef = hotelRef.collection('activity').doc();
  batch.set(activityRef, {
    type: 'hotel_enrolled',
    actorUid: adminUid,
    actorEmail: payload.adminEmail,
    description: `Hotel "${payload.hotelName}" enrolled on the ${PLAN_LABELS[payload.planId]} plan.`,
    createdAt: now,
  });

  await batch.commit();

  // ── Register hotel in top-level registry ────────────────────────────────
  await db.collection('hotel_registry').doc(hotelId).set({
    id: hotelId,
    name: payload.hotelName,
    slug: slugify(payload.hotelName),
    domain: payload.hotelDomain,
    planId: payload.planId,
    status: 'active',
    adminEmail: payload.adminEmail,
    createdAt: now,
  });
}

// ─── Welcome email ────────────────────────────────────────────────────────────

async function sendWelcomeEmail(payload: EnrollmentPayload, result: EnrollmentResult): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    functions.logger.warn('[Enrollment] SMTP not configured — skipping welcome email');
    return;
  }

  const planLabel   = PLAN_LABELS[payload.planId];
  const fullPrice   = PLAN_PRICES[payload.planId];
  const discPrice   = discountedPrice(payload.planId);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Hotel Singularity OS</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family:'Segoe UI',Arial,sans-serif; color:#1e293b; }
    .wrap { max-width:560px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
    .header { background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%); padding:32px 32px 24px; }
    .header h1 { margin:0; font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.5px; }
    .header p { margin:6px 0 0; font-size:13px; color:#c7d2fe; }
    .body { padding:28px 32px; }
    .greeting { font-size:16px; font-weight:600; margin-bottom:16px; }
    .info-box { background:#f1f5f9; border-radius:10px; padding:16px 20px; margin:20px 0; }
    .info-row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #e2e8f0; font-size:13px; }
    .info-row:last-child { border:none; }
    .info-label { color:#64748b; font-weight:600; }
    .info-value { color:#1e293b; font-weight:700; text-align:right; }
    .url-value { color:#4f46e5; font-family:monospace; font-size:12px; }
    .cta { display:inline-block; margin:8px 4px; padding:12px 24px; background:#4f46e5; color:#fff; border-radius:10px; text-decoration:none; font-weight:700; font-size:14px; }
    .note { font-size:12px; color:#94a3b8; margin-top:24px; line-height:1.6; }
    .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:18px 32px; font-size:11px; color:#94a3b8; text-align:center; }
    .badge { display:inline-block; background:#dcfce7; color:#16a34a; border-radius:6px; padding:3px 10px; font-size:11px; font-weight:700; margin-left:6px; }
    .discount { display:inline-block; background:#fef3c7; color:#d97706; border-radius:6px; padding:3px 10px; font-size:11px; font-weight:700; margin-left:6px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🏨 Hotel Singularity OS</h1>
      <p>Your property is live and ready for operations.</p>
    </div>
    <div class="body">
      <p class="greeting">Welcome, ${payload.adminFullName}!</p>
      <p style="font-size:14px;line-height:1.7;color:#475569;">
        Your hotel <strong>${payload.hotelName}</strong> has been successfully enrolled on the
        <strong>${planLabel} plan</strong>. Your complete cloud-based hotel management system is ready to use.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Hotel</span>
          <span class="info-value">${payload.hotelName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Plan</span>
          <span class="info-value">
            ${planLabel}
            <span class="badge">All 16 Modules</span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Billing</span>
          <span class="info-value">
            $${discPrice}/mo for 3 months
            <span class="discount">50% off launch</span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Then</span>
          <span class="info-value">$${fullPrice}/mo</span>
        </div>
        <div class="info-row">
          <span class="info-label">Admin Email</span>
          <span class="info-value">${payload.adminEmail}</span>
        </div>
      </div>

      <p style="font-size:13px;font-weight:700;color:#475569;margin-bottom:8px;">Your hotel URLs:</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Guest App</span>
          <span class="info-value url-value">${result.guestUrl}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Operations App</span>
          <span class="info-value url-value">${result.operationsUrl}</span>
        </div>
      </div>

      <div style="text-align:center;margin:28px 0 12px;">
        <a href="${result.operationsUrl}" class="cta">Open Operations App →</a>
      </div>

      <p class="note">
        ℹ️ Sign in to the Operations App with <strong>${payload.adminEmail}</strong> using the password
        you set during enrollment. You can add staff, configure rooms, and set up all modules from the
        hotel settings panel.
        <br /><br />
        Need help? Reach us on LinkedIn or through the in-app support chat.
      </p>
    </div>
    <div class="footer">
      Hotel Singularity OS — All-in-One Hospitality Intelligence Platform<br />
      You're receiving this because you enrolled at singularityos.com
    </div>
  </div>
</body>
</html>`;

  await transport.sendMail({
    from: `"Hotel Singularity OS" <${EMAIL_FROM}>`,
    to: payload.adminEmail,
    subject: `🏨 Your hotel "${payload.hotelName}" is live on Singularity OS`,
    html,
    text: `Welcome to Hotel Singularity OS!\n\n`
      + `Your hotel "${payload.hotelName}" is now live on the ${planLabel} plan.\n\n`
      + `Operations App: ${result.operationsUrl}\n`
      + `Guest App: ${result.guestUrl}\n\n`
      + `Admin Email: ${payload.adminEmail}\n\n`
      + `Billing: $${discPrice}/mo for 3 months (50% launch discount), then $${fullPrice}/mo.\n\n`
      + `Sign in with your credentials to start configuring your hotel.`,
  });

  functions.logger.info('[Enrollment] Welcome email sent', { to: payload.adminEmail });
}

// ─── Cloud Functions ──────────────────────────────────────────────────────────

/**
 * enrollHotel — Callable
 *
 * Full hotel provisioning in one atomic (as possible) sequence:
 *  1. Validate
 *  2. Slug uniqueness check
 *  3. Firebase Auth user creation
 *  4. Firestore bootstrap
 *  5. Stripe customer + trial subscription
 *  6. Welcome email
 *  7. Return EnrollmentResult
 */
export const enrollHotel = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (data: Partial<EnrollmentPayload>): Promise<EnrollmentResult> => {

    functions.logger.info('[Enrollment] Starting hotel enrollment', { email: data.adminEmail });

    // ── 1. Validate ──────────────────────────────────────────────────────
    validatePayload(data);
    const payload = data as EnrollmentPayload;

    const slug = slugify(payload.hotelName);
    if (!slug) {
      throw new functions.https.HttpsError('invalid-argument', 'Hotel name produced an empty slug');
    }

    // ── 2. Check slug uniqueness ─────────────────────────────────────────
    const existingDoc = await db.collection('hotel_registry').doc(slug).get();
    if (existingDoc.exists) {
      throw new functions.https.HttpsError(
        'already-exists',
        `A hotel with slug "${slug}" is already registered. Please choose a different hotel name.`,
      );
    }

    // Also check the admin email isn't already in use for a hotel
    const emailQuery = await db.collection('hotel_registry')
      .where('adminEmail', '==', payload.adminEmail.toLowerCase())
      .limit(1)
      .get();
    if (!emailQuery.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        'An account with this admin email is already enrolled. Please use a different email or contact support.',
      );
    }

    const hotelId = slug; // use slug as the stable Firestore document ID

    const domain = payload.useCustomDomain
      ? payload.hotelDomain
      : `${slug}.singularityos.com`;
    const guestUrl = payload.useCustomDomain
      ? `https://${domain}`
      : `https://${domain}`;
    const operationsUrl = `${guestUrl}/app`;

    // ── 3. Create Firebase Auth admin user ───────────────────────────────
    let adminUid: string;
    try {
      const userRecord = await admin.auth().createUser({
        email: payload.adminEmail.toLowerCase(),
        password: payload.adminPassword,
        displayName: payload.adminFullName,
        emailVerified: false,
      });
      adminUid = userRecord.uid;

      // Set custom claims: role, hotelId, isAdmin
      await admin.auth().setCustomUserClaims(adminUid, {
        role: 'General Manager',
        hotelId,
        isAdmin: true,
        planId: payload.planId,
      });

      functions.logger.info('[Enrollment] Auth user created', { uid: adminUid, hotelId });
    } catch (err: any) {
      functions.logger.error('[Enrollment] Auth creation failed', err);
      const code = err?.code ?? '';
      const msg = err?.message ?? '';
      if (code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          'An account with this email already exists. Please sign in or use a different email.',
        );
      }
      if (code === 'auth/invalid-email') {
        throw new functions.https.HttpsError('invalid-argument', 'Please enter a valid email address.');
      }
      if (code === 'auth/weak-password') {
        throw new functions.https.HttpsError('invalid-argument', 'Password is too weak. Use at least 8 characters with letters and numbers.');
      }
      if (code === 'auth/operation-not-allowed') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Email/password sign-in is not enabled. Contact support to configure Firebase Auth.',
        );
      }
      // Use failed-precondition so message reaches client (internal often gets sanitized)
      throw new functions.https.HttpsError(
        'failed-precondition',
        msg?.includes('already') ? 'This email is already in use. Please use a different email.' : 'Could not create admin account. Please try a different email or contact support.',
      );
    }

    // ── 4. Create Stripe customer ────────────────────────────────────────
    let stripeCustomerId = '';
    if (STRIPE_SECRET) {
      try {
        const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2023-10-16' });

        const customer = await stripe.customers.create({
          email: payload.adminEmail.toLowerCase(),
          name: payload.adminFullName,
          description: `Hotel: ${payload.hotelName} | Plan: ${payload.planId}`,
          metadata: {
            hotelId,
            hotelName: payload.hotelName,
            planId: payload.planId,
            adminUid,
          },
        });
        stripeCustomerId = customer.id;

        // Create trial subscription if price IDs are configured
        const priceId = STRIPE_PRICE_IDS[payload.planId];
        if (priceId) {
          await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            trial_period_days: 90, // 3-month trial (50% off handled by coupon in production)
            metadata: { hotelId, planId: payload.planId },
          });
          functions.logger.info('[Enrollment] Stripe subscription created', { customerId: stripeCustomerId, planId: payload.planId });
        } else {
          functions.logger.warn('[Enrollment] No Stripe price ID configured for plan', { planId: payload.planId });
        }
      } catch (err: any) {
        // Stripe failure is non-fatal — log and continue (admin can fix billing later)
        functions.logger.error('[Enrollment] Stripe customer creation failed (non-fatal)', err);
      }
    } else {
      functions.logger.warn('[Enrollment] Stripe not configured — skipping billing setup');
    }

    // ── 5. Bootstrap Firestore ───────────────────────────────────────────
    const pinHash = crypto.createHash('sha256').update(payload.adminPin).digest('hex');
    try {
      await bootstrapHotelFirestore(hotelId, payload, adminUid, stripeCustomerId, pinHash);
      functions.logger.info('[Enrollment] Firestore bootstrapped', { hotelId });
    } catch (err: any) {
      // Firestore failed — clean up the Auth user to avoid orphaned accounts
      const errMsg = err?.message ?? String(err);
      functions.logger.error('[Enrollment] Firestore bootstrap failed — rolling back Auth user', { errMsg, hotelId });
      try { await admin.auth().deleteUser(adminUid); } catch (_) { /* ignore cleanup error */ }
      // Use failed-precondition so the message reaches the client (internal gets sanitized)
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Database setup failed. Please try again in a few minutes or contact support.',
      );
    }

    // ── 6. Build result ──────────────────────────────────────────────────
    const result: EnrollmentResult = {
      success: true,
      hotelId,
      hotelSlug: slug,
      adminEmail: payload.adminEmail.toLowerCase(),
      guestUrl,
      operationsUrl,
      message: `"${payload.hotelName}" is live on the ${PLAN_LABELS[payload.planId]} plan. Welcome to Hotel Singularity OS!`,
    };

    // ── 7. Send welcome email (non-fatal) ────────────────────────────────
    try {
      await sendWelcomeEmail(payload, result);
    } catch (err) {
      functions.logger.error('[Enrollment] Welcome email failed (non-fatal)', err);
    }

    functions.logger.info('[Enrollment] Hotel enrolled successfully', { hotelId, planId: payload.planId });
    return result;
  });

/**
 * checkHotelDomain — Callable
 *
 * Returns { available: boolean } for a given hotel slug.
 * Used by the wizard's domain step for real-time uniqueness check.
 */
export const checkHotelDomain = functions.https.onCall(
  async (data: { slug?: string }): Promise<{ available: boolean }> => {
    const raw = (data.slug ?? '').toLowerCase().trim();
    if (!raw) {
      throw new functions.https.HttpsError('invalid-argument', 'slug is required');
    }

    // Normalise to match slugify output
    const slug = raw
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 48);

    const doc = await db.collection('hotel_registry').doc(slug).get();
    return { available: !doc.exists };
  },
);
