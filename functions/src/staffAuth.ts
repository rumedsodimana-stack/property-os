/**
 * Hotel Singularity OS — Staff Auth Cloud Functions
 *
 * requestStaffAccess   : Callable — New staff submits an access request
 * approveStaffRequest  : Callable — Manager / HR / GM advances approval stage
 * rejectStaffRequest   : Callable — Any approver rejects at any stage
 * getPendingRequests   : Callable — Returns requests visible to the caller's role
 * getAccessibleHotels  : Callable — Returns hotels a user has access to (cluster switcher)
 *
 * Approval flow:
 *   pending_manager → pending_hr → pending_gm → approved (account activated)
 *
 * On final GM approval:
 *   1. Create Firebase Auth user
 *   2. Create Firestore staff document under hotels/{hotelId}/staff/{uid}
 *   3. Set custom claims { role, hotelId }
 *   4. Hash and store PIN
 *   5. Send activation email
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as nodemailer from 'nodemailer';
import { createHash } from 'crypto';

const db = admin.firestore();

// ─── Config ───────────────────────────────────────────────────────────────────

const SMTP_HOST   = process.env.SMTP_HOST   || functions.config().smtp?.host   || '';
const SMTP_PORT   = Number(process.env.SMTP_PORT || functions.config().smtp?.port || 587);
const SMTP_USER   = process.env.SMTP_USER   || functions.config().smtp?.user   || '';
const SMTP_PASS   = process.env.SMTP_PASS   || functions.config().smtp?.pass   || '';
const EMAIL_FROM  = process.env.ENROLL_FROM || functions.config().enrollment?.from || SMTP_USER || 'noreply@singularityos.com';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _transport: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTransport(): any {
  if (_transport) return _transport;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  _transport = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return _transport;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalStage = 'pending_manager' | 'pending_hr' | 'pending_gm' | 'approved' | 'rejected';

type OSRole = 'GM' | 'Manager' | 'Supervisor' | 'Staff' | 'Guest' | 'Finance' | 'FrontDesk' | 'Chef';

interface StaffRequest {
  id: string;
  hotelId: string;
  fullName: string;
  email: string;
  employeeId: string;
  requestedRole: OSRole;
  department: string;
  phone?: string;
  pinHash: string;
  approvalStage: ApprovalStage;
  managerApprovedAt?: admin.firestore.Timestamp;
  managerApprovedBy?: string;
  hrApprovedAt?: admin.firestore.Timestamp;
  hrApprovedBy?: string;
  gmApprovedAt?: admin.firestore.Timestamp;
  gmApprovedBy?: string;
  rejectedAt?: admin.firestore.Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;
  activatedUid?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const hashPin = (pin: string): string =>
  createHash('sha256').update(pin).digest('hex');

const VALID_ROLES: Set<string> = new Set([
  'GM', 'Manager', 'Supervisor', 'Staff', 'Guest', 'Finance', 'FrontDesk', 'Chef',
]);

/** Verify the caller's Firebase token and return their uid + custom claims */
async function verifyCallerClaims(context: functions.https.CallableContext): Promise<{
  uid: string; role: string; hotelId: string;
}> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }
  const uid     = context.auth.uid;
  const claims  = context.auth.token as Record<string, unknown>;
  const role    = String(claims.role ?? '');
  const hotelId = String(claims.hotelId ?? '');
  return { uid, role, hotelId };
}

/** Compute the next approval stage after the current one */
function nextStage(current: ApprovalStage): ApprovalStage | 'activated' {
  const chain: ApprovalStage[] = ['pending_manager', 'pending_hr', 'pending_gm'];
  const idx = chain.indexOf(current);
  if (idx === -1 || idx === chain.length - 1) return 'activated';
  return chain[idx + 1];
}

/** Which stage a role can act on */
const STAGE_FOR_ROLE: Record<string, ApprovalStage | ApprovalStage[]> = {
  Manager: 'pending_manager',
  GM:      ['pending_manager', 'pending_hr', 'pending_gm'],  // GM can approve any stage
};

function roleCanActOnStage(role: string, stage: ApprovalStage): boolean {
  const allowed = STAGE_FOR_ROLE[role];
  if (!allowed) return false;
  if (Array.isArray(allowed)) return allowed.includes(stage);
  return allowed === stage;
}

// ─── Activation: create Firebase Auth user + Firestore staff doc ──────────────

async function activateStaffAccount(
  request: StaffRequest,
  approverUid: string,
): Promise<string> {
  // 1. Create Firebase Auth user
  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth().createUser({
      email:       request.email,
      displayName: request.fullName,
      emailVerified: false,
    });
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      userRecord = await admin.auth().getUserByEmail(request.email);
    } else {
      throw err;
    }
  }

  const uid = userRecord.uid;

  // 2. Set custom claims
  await admin.auth().setCustomUserClaims(uid, {
    role:       request.requestedRole,
    hotelId:    request.hotelId,
    employeeId: request.employeeId,
    isAdmin:    false,
  });

  const now = FieldValue.serverTimestamp();

  // 3. Write Firestore staff document (matches the existing OperatorRecord structure)
  await db.collection(`hotels/${request.hotelId}/staff`).doc(uid).set({
    uid,
    principal:  request.employeeId,
    employeeId: request.employeeId,
    fullName:   request.fullName,
    name:       request.fullName,
    email:      request.email,
    phone:      request.phone ?? '',
    role:       request.requestedRole,
    department: request.department,
    hotelId:    request.hotelId,
    pinHash:    request.pinHash,
    status:     'active',
    isAdmin:    false,
    approvedBy: approverUid,
    createdAt:  now,
    updatedAt:  now,
  });

  // 4. Send activation email (non-fatal)
  try {
    const transport = getTransport();
    if (transport) {
      await transport.sendMail({
        from: `"Hotel Singularity OS" <${EMAIL_FROM}>`,
        to:   request.email,
        subject: `✅ Your access to ${request.hotelId} has been approved`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
            <div style="background:#4f46e5;padding:24px;color:#fff">
              <h2 style="margin:0;font-size:18px;font-weight:800">Welcome to Hotel Singularity OS</h2>
              <p style="margin:6px 0 0;font-size:12px;color:#c7d2fe">Your access has been approved</p>
            </div>
            <div style="padding:24px">
              <p style="font-size:15px;font-weight:600;margin-bottom:12px">Hi ${request.fullName},</p>
              <p style="font-size:13px;color:#475569;line-height:1.6;">
                Your staff access request has been fully approved by the General Manager.
                You can now log in to the operations app using your Employee ID and PIN.
              </p>
              <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Your login details</p>
                <p style="margin:4px 0;font-size:13px;"><strong>Employee ID:</strong> ${request.employeeId}</p>
                <p style="margin:4px 0;font-size:13px;"><strong>Role:</strong> ${request.requestedRole}</p>
                <p style="margin:4px 0;font-size:13px;"><strong>PIN:</strong> the PIN you set during registration</p>
              </div>
              <p style="font-size:12px;color:#94a3b8;margin-top:16px;">
                Need help? Contact your hotel manager or reach out through the in-app support channel.
              </p>
            </div>
          </div>`,
        text: `Hi ${request.fullName},\n\nYour access has been approved.\n\nLogin with Employee ID: ${request.employeeId} and the PIN you set during registration.`,
      });
    }
  } catch (emailErr) {
    functions.logger.warn('[StaffAuth] Activation email failed (non-fatal)', emailErr);
  }

  return uid;
}

// ─── Cloud Functions ──────────────────────────────────────────────────────────

/**
 * requestStaffAccess — Callable
 * Any authenticated (or anonymous) user can call this to submit an access request.
 */
export const requestStaffAccess = functions.https.onCall(async (data, _context) => {
  const {
    hotelId, fullName, email, employeeId, requestedRole, department, phone, pin,
  } = data as {
    hotelId: string; fullName: string; email: string; employeeId: string;
    requestedRole: OSRole; department: string; phone?: string; pin: string;
  };

  // Validate
  if (!hotelId || !fullName || !email || !employeeId || !requestedRole || !department || !pin) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email');
  }
  if (!VALID_ROLES.has(requestedRole)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
  }
  if (!/^\d{4,6}$/.test(pin)) {
    throw new functions.https.HttpsError('invalid-argument', 'PIN must be 4–6 digits');
  }

  // Check hotel exists
  const hotelDoc = await db.collection('hotels').doc(hotelId).get();
  if (!hotelDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Hotel not found');
  }

  // Prevent duplicate active staff with same employeeId or email
  const [existingEmployee, existingEmail] = await Promise.all([
    db.collection(`hotels/${hotelId}/staff`).where('employeeId', '==', employeeId.toUpperCase()).limit(1).get(),
    db.collection(`hotels/${hotelId}/staff`).where('email', '==', email.toLowerCase()).limit(1).get(),
  ]);
  if (!existingEmployee.empty) {
    throw new functions.https.HttpsError('already-exists', 'A staff member with this Employee ID already exists');
  }
  if (!existingEmail.empty) {
    throw new functions.https.HttpsError('already-exists', 'A staff member with this email already exists');
  }

  // Also check for duplicate pending request
  const existingRequest = await db
    .collection(`hotels/${hotelId}/staff_requests`)
    .where('email', '==', email.toLowerCase())
    .where('approvalStage', 'in', ['pending_manager', 'pending_hr', 'pending_gm'])
    .limit(1)
    .get();
  if (!existingRequest.empty) {
    throw new functions.https.HttpsError('already-exists', 'A pending request for this email already exists');
  }

  const now  = FieldValue.serverTimestamp();
  const ref  = db.collection(`hotels/${hotelId}/staff_requests`).doc();

  await ref.set({
    id:             ref.id,
    hotelId,
    fullName:       fullName.trim(),
    email:          email.trim().toLowerCase(),
    employeeId:     employeeId.trim().toUpperCase(),
    requestedRole,
    department,
    phone:          phone?.trim() ?? '',
    pinHash:        hashPin(pin),
    approvalStage:  'pending_manager' as ApprovalStage,
    createdAt:      now,
    updatedAt:      now,
  });

  functions.logger.info('[StaffAuth] Access request created', { requestId: ref.id, hotelId, email });
  return { requestId: ref.id, message: 'Access request submitted. Awaiting manager review.' };
});

/**
 * approveStaffRequest — Callable
 * Advances the approval stage. On GM final approval, activates the account.
 */
export const approveStaffRequest = functions.https.onCall(async (data, context) => {
  const { uid, role } = await verifyCallerClaims(context);
  const { hotelId, requestId, comment } = data as {
    hotelId: string; requestId: string; comment?: string;
  };

  if (!hotelId || !requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'hotelId and requestId are required');
  }
  if (!roleCanActOnStage(role, 'pending_manager') && !roleCanActOnStage(role, 'pending_hr') && !roleCanActOnStage(role, 'pending_gm')) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have approval authority');
  }

  const ref = db.collection(`hotels/${hotelId}/staff_requests`).doc(requestId);
  const doc = await ref.get();
  if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Request not found');

  const request = doc.data() as StaffRequest;
  if (!roleCanActOnStage(role, request.approvalStage)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Your role (${role}) cannot approve at the current stage (${request.approvalStage})`,
    );
  }

  const now    = FieldValue.serverTimestamp();
  const next   = nextStage(request.approvalStage);
  const update: Record<string, unknown> = { updatedAt: now };

  // Record approval at current stage
  if (request.approvalStage === 'pending_manager') {
    update.managerApprovedAt = now;
    update.managerApprovedBy = uid;
    if (comment) update.managerComment = comment;
  } else if (request.approvalStage === 'pending_hr') {
    update.hrApprovedAt = now;
    update.hrApprovedBy = uid;
    if (comment) update.hrComment = comment;
  } else if (request.approvalStage === 'pending_gm') {
    update.gmApprovedAt = now;
    update.gmApprovedBy = uid;
    if (comment) update.gmComment = comment;
  }

  if (next === 'activated') {
    // Final GM approval → activate account
    let activatedUid: string;
    try {
      activatedUid = await activateStaffAccount(request, uid);
    } catch (err: any) {
      functions.logger.error('[StaffAuth] Account activation failed', err);
      throw new functions.https.HttpsError('internal', 'Account activation failed: ' + (err.message ?? ''));
    }

    update.approvalStage = 'approved';
    update.activatedUid  = activatedUid;
    await ref.update(update);

    functions.logger.info('[StaffAuth] Staff account activated', { requestId, activatedUid, hotelId });
    return { stage: 'approved' as ApprovalStage, message: 'Account activated successfully', activated: true };
  }

  // Not final yet — advance stage
  update.approvalStage = next;
  await ref.update(update);

  functions.logger.info('[StaffAuth] Request advanced', { requestId, from: request.approvalStage, to: next });
  return { stage: next as ApprovalStage, message: `Request advanced to ${next}`, activated: false };
});

/**
 * rejectStaffRequest — Callable
 * Rejects a request at any stage.
 */
export const rejectStaffRequest = functions.https.onCall(async (data, context) => {
  const { uid, role } = await verifyCallerClaims(context);
  const { hotelId, requestId, reason } = data as {
    hotelId: string; requestId: string; reason: string;
  };

  if (!hotelId || !requestId || !reason?.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'hotelId, requestId and reason are required');
  }
  if (!roleCanActOnStage(role, 'pending_manager') && !roleCanActOnStage(role, 'pending_hr') && !roleCanActOnStage(role, 'pending_gm')) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have rejection authority');
  }

  const ref = db.collection(`hotels/${hotelId}/staff_requests`).doc(requestId);
  const doc = await ref.get();
  if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Request not found');

  const now = FieldValue.serverTimestamp();
  await ref.update({
    approvalStage:   'rejected',
    rejectedAt:      now,
    rejectedBy:      uid,
    rejectionReason: reason.trim(),
    updatedAt:       now,
  });

  functions.logger.info('[StaffAuth] Request rejected', { requestId, hotelId, rejectedBy: uid });
  return { message: 'Request rejected' };
});

/**
 * getPendingRequests — Callable
 * Returns access requests visible to the caller based on their role.
 * Managers see pending_manager; GMs see all; HR role sees pending_hr + pending_gm.
 */
export const getPendingRequests = functions.https.onCall(async (data, context) => {
  const { role, hotelId: callerHotelId } = await verifyCallerClaims(context);
  const { hotelId } = data as { hotelId: string };

  if (!hotelId) throw new functions.https.HttpsError('invalid-argument', 'hotelId is required');
  if (callerHotelId !== hotelId && role !== 'GM') {
    throw new functions.https.HttpsError('permission-denied', 'You can only view requests for your hotel');
  }

  let query = db.collection(`hotels/${hotelId}/staff_requests`).orderBy('createdAt', 'desc') as
    FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

  // GMs see everything; Managers only see pending_manager
  if (role === 'Manager') {
    query = query.where('approvalStage', '==', 'pending_manager');
  }

  const snap = await query.limit(100).get();
  const requests = snap.docs.map(d => {
    const data = d.data() as StaffRequest;
    return {
      ...data,
      // Serialize timestamps to ISO strings for the client
      createdAt:          data.createdAt?.toDate?.()?.toISOString() ?? '',
      updatedAt:          data.updatedAt?.toDate?.()?.toISOString() ?? '',
      managerApprovedAt:  data.managerApprovedAt?.toDate?.()?.toISOString(),
      hrApprovedAt:       data.hrApprovedAt?.toDate?.()?.toISOString(),
      gmApprovedAt:       data.gmApprovedAt?.toDate?.()?.toISOString(),
      rejectedAt:         data.rejectedAt?.toDate?.()?.toISOString(),
      // Never send pin hash to client
      pinHash: undefined,
    };
  });

  return { requests };
});

/**
 * getAccessibleHotels — Callable
 * Returns all hotels a user has access to (for the cluster hotel switcher).
 * Looks up the hotel_registry for hotels where this uid appears in the staff subcollection.
 */
export const getAccessibleHotels = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  const callerUid = context.auth.uid;

  // Build a collectionGroup query across all hotels' staff subcollections
  const staffDocs = await db
    .collectionGroup('staff')
    .where('uid', '==', callerUid)
    .where('status', '==', 'active')
    .get();

  if (staffDocs.empty) {
    // Fallback: check the claims
    const claims = context.auth.token as Record<string, unknown>;
    const hotelId = String(claims.hotelId ?? '');
    if (!hotelId) return { hotels: [] };

    const hotelDoc = await db.collection('hotel_registry').doc(hotelId).get();
    if (!hotelDoc.exists) return { hotels: [] };
    const hd = hotelDoc.data()!;
    return {
      hotels: [{
        hotelId,
        hotelName: hd.name ?? hotelId,
        role: String(claims.role ?? 'Staff'),
        domain: hd.domain ?? '',
        country: hd.country ?? '',
        planId: hd.planId ?? '',
      }],
    };
  }

  // Fetch registry docs for each hotel the staff member belongs to
  const hotelIds = staffDocs.docs.map(d => {
    // The staff document path is hotels/{hotelId}/staff/{uid}
    const pathParts = d.ref.path.split('/');
    return pathParts[1]; // hotels/{hotelId}/staff/{uid} → index 1
  });

  const unique = [...new Set(hotelIds)];
  const registryDocs = await Promise.all(
    unique.map(id => db.collection('hotel_registry').doc(id).get())
  );

  const hotels = registryDocs
    .filter(d => d.exists)
    .map(d => {
      const hd = d.data()!;
      const staffDoc = staffDocs.docs.find(sd => sd.ref.path.includes(`/${d.id}/`));
      const staffData = staffDoc?.data() ?? {};
      return {
        hotelId: d.id,
        hotelName: hd.name ?? d.id,
        role: String(staffData.role ?? 'Staff'),
        domain: hd.domain ?? '',
        country: hd.country ?? '',
        planId: hd.planId ?? '',
      };
    });

  return { hotels };
});
