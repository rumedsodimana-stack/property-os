"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushGdsAvailability = exports.sabreReservationWebhook = exports.amadeusReservationWebhook = exports.analyzeRoomQuality = exports.rateAutomationJob = exports.publishRecommendedRates = exports.syncDemandEvents = exports.fetchCompsetRates = exports.postStaySurveyJob = exports.reviewSyncJob = exports.syncReviews = exports.draftReviewResponse = exports.ingestReviewWebhook = exports.issueApiToken = exports.createApiClient = exports.api = exports.twilioWebhook = exports.sendGuestMessage = exports.pushOtaAvailability = exports.expediaReservationWebhook = exports.bookingComReservationWebhook = exports.createSetupIntent = exports.refundPaymentIntent = exports.capturePaymentIntent = exports.createPaymentIntent = exports.notifyOnDemoInquiry = exports.syncGuestWalletKeysOnReservationLifecycle = exports.generateMockAppleWalletPass = exports.resendGuestWalletKey = exports.revokeGuestWalletKey = exports.issueGuestWalletKey = exports.verifyStripeConnection = exports.verifyOtaConnection = exports.processPosTransaction = exports.runNightAudit = exports.otaWebhookReceiver = exports.issueOperatorSession = exports.backendHealth = exports.db = exports.completeHotelSetup = exports.getAccessibleHotels = exports.getPendingRequests = exports.rejectStaffRequest = exports.approveStaffRequest = exports.requestStaffAccess = exports.checkHotelDomain = exports.enrollHotel = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const nodemailer = __importStar(require("nodemailer"));
const stripe_1 = __importDefault(require("stripe"));
const crypto_1 = require("crypto");
const fs = __importStar(require("fs/promises"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const messaging = __importStar(require("./messaging"));
const apiGateway = __importStar(require("./api"));
const reviews = __importStar(require("./reviews"));
const revenue = __importStar(require("./revenue"));
const vision = __importStar(require("./vision"));
const enrollment = __importStar(require("./enrollment"));
const staffAuth = __importStar(require("./staffAuth"));
const setupWizard = __importStar(require("./setupWizard"));
// ─── Enrollment exports ───────────────────────────────────────────────────────
exports.enrollHotel = enrollment.enrollHotel;
exports.checkHotelDomain = enrollment.checkHotelDomain;
// ─── Staff Auth & Approval exports ───────────────────────────────────────────
exports.requestStaffAccess = staffAuth.requestStaffAccess;
exports.approveStaffRequest = staffAuth.approveStaffRequest;
exports.rejectStaffRequest = staffAuth.rejectStaffRequest;
exports.getPendingRequests = staffAuth.getPendingRequests;
exports.getAccessibleHotels = staffAuth.getAccessibleHotels;
// ─── Setup Wizard exports ─────────────────────────────────────────────────────
exports.completeHotelSetup = setupWizard.completeHotelSetup;
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.db = db;
const LOCAL_DEV_KEY = process.env.SINGULARITY_LOCAL_DEV_KEY || '';
const OTA_DEMO_KEY = process.env.SINGULARITY_OTA_DEMO_KEY || '';
const STRIPE_DEMO_KEY = process.env.SINGULARITY_STRIPE_DEMO_KEY || '';
const ALLOW_SIMULATED_PROVIDER_KEYS = process.env.SINGULARITY_ALLOW_SIMULATED_PROVIDER_KEYS === 'true';
const SMTP_HOST = process.env.SMTP_HOST || ((_a = functions.config().smtp) === null || _a === void 0 ? void 0 : _a.host) || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || ((_b = functions.config().smtp) === null || _b === void 0 ? void 0 : _b.port) || 587);
const SMTP_USER = process.env.SMTP_USER || ((_c = functions.config().smtp) === null || _c === void 0 ? void 0 : _c.user) || '';
const SMTP_PASS = process.env.SMTP_PASS || ((_d = functions.config().smtp) === null || _d === void 0 ? void 0 : _d.pass) || '';
const EMAIL_TO = process.env.DEMO_LEADS_TO || ((_e = functions.config().notifications) === null || _e === void 0 ? void 0 : _e.demo_leads_to) || '';
const EMAIL_FROM = process.env.DEMO_LEADS_FROM || ((_f = functions.config().notifications) === null || _f === void 0 ? void 0 : _f.demo_leads_from) || SMTP_USER || '';
const isNotificationConfigured = () => {
    return !!(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && EMAIL_TO && EMAIL_FROM);
};
const notificationTransport = isNotificationConfigured()
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    })
    : null;
const sanitize = (value, fallback = "N/A") => {
    if (typeof value !== "string")
        return fallback;
    const trimmed = value.trim();
    return trimmed ? trimmed : fallback;
};
const asHttpsError = (error, fallbackMessage, fallbackCode = 'internal') => {
    if (error instanceof functions.https.HttpsError)
        return error;
    const message = error instanceof Error && error.message ? error.message : fallbackMessage;
    return new functions.https.HttpsError(fallbackCode, message);
};
const isInternalKey = (value) => {
    return typeof value === 'string' && !!LOCAL_DEV_KEY && value === LOCAL_DEV_KEY;
};
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const OPERATOR_DEMO_PIN = process.env.SINGULARITY_DEMO_USER_PIN || '';
const VALID_ROLES = new Set(['GM', 'Manager', 'Supervisor', 'Staff', 'Guest', 'Finance', 'FrontDesk', 'Chef']);
const normalizePrincipal = (value) => (value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
const canonicalPrincipal = (value) => {
    const normalized = normalizePrincipal(value);
    const match = normalized.match(/^([A-Z]+)(\d+)$/);
    if (!match)
        return normalized;
    return `${match[1]}${Number(match[2])}`;
};
const sanitizeUid = (value) => {
    const normalized = (value || '').replace(/[^A-Za-z0-9_\-.:]/g, '').slice(0, 120);
    return normalized || `operator_${Date.now()}`;
};
// ────────────────────────────────────────────────────────────────────────────
// Door Lock Provider Bridge (ASSA ABLOY / Dormakaba / Salto / Mock)
// ────────────────────────────────────────────────────────────────────────────
const issueHardwareKey = async (provider, payload) => {
    if (provider === 'assa_abloy') {
        const resp = await fetch(`${ASSA_BASE}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': ASSA_KEY },
            body: JSON.stringify(payload)
        });
        if (!resp.ok)
            throw new Error(`ASSA ABLOY issuance failed: ${resp.status}`);
        const body = await resp.json();
        return { externalId: body.keyId, provider: 'assa_abloy' };
    }
    if (provider === 'dormakaba') {
        const resp = await fetch(`${DORMA_BASE}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': DORMA_KEY },
            body: JSON.stringify(payload)
        });
        if (!resp.ok)
            throw new Error(`Dormakaba issuance failed: ${resp.status}`);
        const body = await resp.json();
        return { externalId: body.id, provider: 'dormakaba' };
    }
    if (provider === 'salto') {
        const resp = await fetch(`${SALTO_BASE}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SALTO_KEY}` },
            body: JSON.stringify(payload)
        });
        if (!resp.ok)
            throw new Error(`Salto issuance failed: ${resp.status}`);
        const body = await resp.json();
        return { externalId: body.keyId || body.id, provider: 'salto' };
    }
    return { externalId: `mock_${Date.now()}`, provider: 'mock' };
};
const revokeHardwareKey = async (provider, externalId) => {
    if (!externalId)
        return;
    if (provider === 'assa_abloy') {
        await fetch(`${ASSA_BASE}/keys/${externalId}`, { method: 'DELETE', headers: { 'x-api-key': ASSA_KEY } });
    }
    else if (provider === 'dormakaba') {
        await fetch(`${DORMA_BASE}/keys/${externalId}`, { method: 'DELETE', headers: { 'x-api-key': DORMA_KEY } });
    }
    else if (provider === 'salto') {
        await fetch(`${SALTO_BASE}/keys/${externalId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${SALTO_KEY}` } });
    }
};
const hashPin = (pin) => (0, crypto_1.createHash)('sha256').update(pin).digest('hex');
const resolveOperator = async (employeeId) => {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map((docSnap) => (Object.assign({ sourceDocId: docSnap.id }, docSnap.data())));
    const canonicalInput = canonicalPrincipal(employeeId);
    const normalizedInput = normalizePrincipal(employeeId);
    const found = users.find((u) => {
        const principal = u.principal || u.sourceDocId || '';
        const employee = u.employeeId || '';
        const email = u.email || '';
        return (normalizePrincipal(principal) === normalizedInput ||
            normalizePrincipal(employee) === normalizedInput ||
            normalizePrincipal(email) === normalizedInput ||
            canonicalPrincipal(principal) === canonicalInput ||
            canonicalPrincipal(employee) === canonicalInput ||
            canonicalPrincipal(email) === canonicalInput);
    });
    if (found) {
        return {
            sourceDocId: found.sourceDocId,
            record: {
                principal: found.principal || found.sourceDocId,
                employeeId: found.employeeId || found.principal || found.sourceDocId,
                email: found.email,
                fullName: found.fullName || found.name || found.employeeId || found.principal || found.sourceDocId,
                role: found.role || 'Staff',
                hotelId: found.hotelId || 'H1',
                pinHash: found.pinHash,
                pin: found.pin
            }
        };
    }
    if (!OPERATOR_DEMO_PIN)
        return null;
    const demoUsers = [
        { principal: 'GM001', employeeId: 'GM001', fullName: 'System General Manager', role: 'GM', hotelId: 'H1', pin: OPERATOR_DEMO_PIN },
        { principal: 'FD001', employeeId: 'FD001', fullName: 'Front Desk Agent', role: 'FrontDesk', hotelId: 'H1', pin: OPERATOR_DEMO_PIN },
        { principal: 'FIN001', employeeId: 'FIN001', fullName: 'Finance Controller', role: 'Finance', hotelId: 'H1', pin: OPERATOR_DEMO_PIN },
        { principal: 'GUEST001', employeeId: 'GUEST001', fullName: 'Guest Demo', role: 'Guest', hotelId: 'H1', pin: OPERATOR_DEMO_PIN },
    ];
    const demoFound = demoUsers.find((u) => normalizePrincipal(u.principal) === normalizedInput ||
        normalizePrincipal(u.employeeId) === normalizedInput ||
        canonicalPrincipal(u.principal) === canonicalInput ||
        canonicalPrincipal(u.employeeId) === canonicalInput);
    return demoFound ? { record: demoFound } : null;
};
const WALLET_MOCK_BASE_URL = (process.env.SINGULARITY_WALLET_MOCK_BASE_URL ||
    ((_g = functions.config().wallet) === null || _g === void 0 ? void 0 : _g.mock_base_url) ||
    'https://wallet-pass.hotelsingularity.local').replace(/\/+$/, '');
const APPLE_MOCK_PASS_TYPE_ID = process.env.SINGULARITY_APPLE_MOCK_PASS_TYPE_ID || ((_h = functions.config().wallet) === null || _h === void 0 ? void 0 : _h.apple_pass_type_id) || 'pass.com.hotelsingularity.mockkey';
const APPLE_MOCK_TEAM_ID = process.env.SINGULARITY_APPLE_MOCK_TEAM_ID || ((_j = functions.config().wallet) === null || _j === void 0 ? void 0 : _j.apple_team_id) || 'MOCKTEAM01';
const APPLE_MOCK_ORGANIZATION = process.env.SINGULARITY_APPLE_MOCK_ORGANIZATION || ((_k = functions.config().wallet) === null || _k === void 0 ? void 0 : _k.apple_org) || 'Hotel Singularity';
const APPLE_PASS_CERT = process.env.SINGULARITY_APPLE_PASS_CERT || ((_l = functions.config().wallet) === null || _l === void 0 ? void 0 : _l.apple_pass_cert) || '';
const APPLE_PASS_KEY = process.env.SINGULARITY_APPLE_PASS_KEY || ((_m = functions.config().wallet) === null || _m === void 0 ? void 0 : _m.apple_pass_key) || '';
const APPLE_WWDR_CERT = process.env.SINGULARITY_APPLE_WWDR_CERT || ((_o = functions.config().wallet) === null || _o === void 0 ? void 0 : _o.apple_wwdr_cert) || '';
const OPENSSL_BIN = process.env.SINGULARITY_OPENSSL_BIN || '/usr/bin/openssl';
const ZIP_BIN = process.env.SINGULARITY_ZIP_BIN || '/usr/bin/zip';
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const MOCK_PASS_ICON_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wylx7sAAAAASUVORK5CYII=';
const DIGITAL_KEY_PROVIDER = (process.env.DIGITAL_KEY_PROVIDER || ((_p = functions.config().keys) === null || _p === void 0 ? void 0 : _p.provider) || 'mock').toLowerCase();
const ASSA_BASE = process.env.ASSA_ABLOY_BASE || ((_q = functions.config().keys) === null || _q === void 0 ? void 0 : _q.assa_base) || '';
const ASSA_KEY = process.env.ASSA_ABLOY_API_KEY || ((_r = functions.config().keys) === null || _r === void 0 ? void 0 : _r.assa_key) || '';
const DORMA_BASE = process.env.DORMAKABA_BASE || ((_s = functions.config().keys) === null || _s === void 0 ? void 0 : _s.dorma_base) || '';
const DORMA_KEY = process.env.DORMAKABA_API_KEY || ((_t = functions.config().keys) === null || _t === void 0 ? void 0 : _t.dorma_key) || '';
const SALTO_BASE = process.env.SALTO_BASE || ((_u = functions.config().keys) === null || _u === void 0 ? void 0 : _u.salto_base) || '';
const SALTO_KEY = process.env.SALTO_API_KEY || ((_v = functions.config().keys) === null || _v === void 0 ? void 0 : _v.salto_key) || '';
const ACTIVE_GUEST_KEY_STATUSES = new Set(['issuing', 'active']);
const normalizeReservationStatus = (status) => {
    if (typeof status !== 'string')
        return '';
    return status.toLowerCase().replace(/[^a-z]/g, '');
};
const isCheckedInStatus = (status) => {
    return normalizeReservationStatus(status) === 'checkedin';
};
const sanitizeIdSegment = (value) => {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9_\-]/g, '')
        .slice(0, 40);
};
const resolveActorFromCallableContext = (context) => {
    var _a, _b;
    const token = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token;
    const principal = typeof (token === null || token === void 0 ? void 0 : token.principal) === 'string' ? token.principal : '';
    const role = typeof (token === null || token === void 0 ? void 0 : token.role) === 'string' ? token.role : '';
    return {
        actor: principal || ((_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid) || 'system',
        actorRole: role || 'system'
    };
};
const resolveReservationRecord = async (reservationId) => {
    const byDocId = await db.collection('reservations').doc(reservationId).get();
    if (byDocId.exists) {
        return {
            docId: byDocId.id,
            data: byDocId.data()
        };
    }
    const byPayloadId = await db.collection('reservations')
        .where('id', '==', reservationId)
        .limit(1)
        .get();
    if (byPayloadId.empty) {
        throw new functions.https.HttpsError('not-found', `Reservation ${reservationId} could not be found.`);
    }
    const match = byPayloadId.docs[0];
    return {
        docId: match.id,
        data: match.data()
    };
};
const resolveRoomNumber = async (roomId) => {
    var _a;
    if (!roomId)
        return undefined;
    try {
        const roomDoc = await db.collection('rooms').doc(roomId).get();
        if (!roomDoc.exists)
            return undefined;
        const number = (_a = roomDoc.data()) === null || _a === void 0 ? void 0 : _a.number;
        return typeof number === 'string' && number.trim() ? number.trim() : undefined;
    }
    catch (_b) {
        return undefined;
    }
};
const listReservationGuestKeys = async (reservationId) => {
    const snap = await db.collection('guest_keys')
        .where('reservationId', '==', reservationId)
        .limit(25)
        .get();
    return snap.docs
        .map((docSnap) => ({
        id: docSnap.id,
        ref: docSnap.ref,
        data: docSnap.data()
    }))
        .sort((a, b) => {
        const bTs = Number(b.data.updatedAt || b.data.issuedAt || b.data.createdAt || 0);
        const aTs = Number(a.data.updatedAt || a.data.issuedAt || a.data.createdAt || 0);
        return bTs - aTs;
    });
};
const appendGuestKeyEvent = async (input) => {
    const eventRef = db.collection('guest_key_events').doc();
    await eventRef.set({
        id: eventRef.id,
        guestKeyId: input.guestKeyId,
        reservationId: input.reservationId,
        eventType: input.eventType,
        actor: input.actor,
        actorRole: input.actorRole || 'system',
        occurredAt: Date.now(),
        reason: input.reason || null,
        metadata: input.metadata || null
    });
};
const buildMockWalletLinks = (params) => {
    const issuedAt = Date.now();
    const reservationSegment = sanitizeIdSegment(params.reservationId);
    const roomSegment = sanitizeIdSegment(params.roomNumber || params.roomId || 'room');
    const passToken = `mk_${reservationSegment}_${roomSegment}_${issuedAt}_${Math.random().toString(36).slice(2, 8)}`;
    const baseQuery = `passId=${encodeURIComponent(passToken)}&reservationId=${encodeURIComponent(params.reservationId)}&guestId=${encodeURIComponent(params.guestId)}&roomId=${encodeURIComponent(params.roomId)}&expiresAt=${params.validUntil}`;
    return {
        walletId: passToken,
        appleUrl: `${WALLET_MOCK_BASE_URL}/apple/${passToken}.pkpass?${baseQuery}`,
        googleUrl: `${WALLET_MOCK_BASE_URL}/google/${passToken}?${baseQuery}`
    };
};
const toEpoch = (value) => {
    if (typeof value !== 'string')
        return null;
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed))
        return null;
    return parsed;
};
const revokeGuestKeyRef = async (params) => {
    var _a;
    if (!ACTIVE_GUEST_KEY_STATUSES.has(params.keyData.status)) {
        return false;
    }
    const revokedAt = Date.now();
    if (params.keyData.provider && params.keyData.provider !== 'mock') {
        await revokeHardwareKey(params.keyData.provider, (_a = params.keyData.metadata) === null || _a === void 0 ? void 0 : _a.externalKeyId);
    }
    await params.keyRef.set({
        status: 'revoked',
        revokedAt,
        revokedBy: params.actor,
        revokeReason: params.reason,
        updatedAt: revokedAt
    }, { merge: true });
    await appendGuestKeyEvent({
        guestKeyId: params.keyId,
        reservationId: params.keyData.reservationId,
        eventType: params.eventType || 'key_revoked',
        actor: params.actor,
        actorRole: params.actorRole || 'system',
        reason: params.reason
    });
    return true;
};
const revokeActiveGuestKeysForReservation = async (params) => {
    const keys = await listReservationGuestKeys(params.reservationId);
    let revoked = 0;
    for (const key of keys) {
        const didRevoke = await revokeGuestKeyRef({
            keyId: key.id,
            keyRef: key.ref,
            keyData: key.data,
            actor: params.actor,
            actorRole: params.actorRole,
            reason: params.reason,
            eventType: params.eventType
        });
        if (didRevoke)
            revoked += 1;
    }
    return revoked;
};
const issueWalletKeyForReservation = async (params) => {
    const resolvedReservation = params.reservationRecordOverride || await resolveReservationRecord(params.reservationId);
    const reservationData = resolvedReservation.data || {};
    const reservationDocId = resolvedReservation.docId;
    const reservationId = String(reservationData.id || params.reservationId || reservationDocId);
    if (!isCheckedInStatus(reservationData.status)) {
        throw new functions.https.HttpsError('failed-precondition', 'Guest key issuance is only allowed for checked-in reservations.');
    }
    if (!reservationData.guestId || !reservationData.roomId) {
        throw new functions.https.HttpsError('failed-precondition', 'Reservation must include guest and room assignment before key issuance.');
    }
    const reservationGuestId = String(reservationData.guestId);
    const reservationRoomId = String(reservationData.roomId);
    const reservationPropertyId = String(reservationData.propertyId || 'H1');
    const reservationKeys = await listReservationGuestKeys(reservationId);
    const existingActive = reservationKeys.find((key) => ACTIVE_GUEST_KEY_STATUSES.has(key.data.status));
    if (existingActive && !params.forceReissue) {
        return {
            keyId: existingActive.id,
            key: Object.assign(Object.assign({}, existingActive.data), { id: existingActive.id }),
            alreadyActive: true
        };
    }
    if (existingActive && params.forceReissue) {
        await revokeGuestKeyRef({
            keyId: existingActive.id,
            keyRef: existingActive.ref,
            keyData: existingActive.data,
            actor: params.actor,
            actorRole: params.actorRole,
            reason: 'Key reissued by operator.',
            eventType: 'status_sync'
        });
    }
    const now = Date.now();
    const checkOutEpoch = toEpoch(reservationData.checkOut);
    const validUntil = checkOutEpoch && checkOutEpoch > now ? checkOutEpoch : now + (24 * 60 * 60 * 1000);
    const roomNumber = (await resolveRoomNumber(reservationRoomId)) || reservationRoomId;
    // Issue hardware key with configured provider (fallback to mock)
    const targetProvider = ['assa_abloy', 'dormakaba', 'salto'].includes(DIGITAL_KEY_PROVIDER) ? DIGITAL_KEY_PROVIDER : 'mock';
    const hardware = await issueHardwareKey(targetProvider, {
        roomNumber,
        guestName: reservationGuestId,
        validFrom: now,
        validUntil,
        reservationId
    });
    const wallet = buildMockWalletLinks({
        reservationId,
        guestId: reservationGuestId,
        roomId: reservationRoomId,
        roomNumber,
        validUntil
    });
    const keyRef = db.collection('guest_keys').doc();
    const keyRecord = {
        id: keyRef.id,
        reservationId,
        reservationDocId,
        guestId: reservationGuestId,
        propertyId: reservationPropertyId,
        roomId: reservationRoomId,
        roomNumber,
        status: 'active',
        channel: 'both',
        provider: hardware.provider,
        issuedAt: now,
        issuedBy: params.actor,
        validFrom: now,
        validUntil,
        source: params.source,
        appleWallet: {
            status: 'ready',
            walletId: `apple_${wallet.walletId}`,
            addUrl: wallet.appleUrl,
            lastSentAt: now
        },
        googleWallet: {
            status: 'ready',
            walletId: `google_${wallet.walletId}`,
            addUrl: wallet.googleUrl,
            lastSentAt: now
        },
        metadata: {
            simulatedProvider: hardware.provider === 'mock',
            allowSimulatedProviderKeys: ALLOW_SIMULATED_PROVIDER_KEYS,
            walletMockBaseUrl: WALLET_MOCK_BASE_URL,
            externalKeyId: hardware.externalId
        },
        createdAt: now,
        updatedAt: now
    };
    await keyRef.set(keyRecord);
    await appendGuestKeyEvent({
        guestKeyId: keyRef.id,
        reservationId,
        eventType: 'key_issued',
        actor: params.actor,
        actorRole: params.actorRole || 'system',
        metadata: {
            source: params.source,
            channel: keyRecord.channel,
            provider: keyRecord.provider,
            forceReissue: !!params.forceReissue
        }
    });
    return {
        keyId: keyRef.id,
        key: keyRecord,
        alreadyActive: false
    };
};
const resolveGuestKeyByInput = async (params) => {
    if (params.guestKeyId) {
        const keyDoc = await db.collection('guest_keys').doc(params.guestKeyId).get();
        if (!keyDoc.exists) {
            throw new functions.https.HttpsError('not-found', `Guest key ${params.guestKeyId} could not be found.`);
        }
        return {
            id: keyDoc.id,
            ref: keyDoc.ref,
            data: keyDoc.data()
        };
    }
    if (!params.reservationId) {
        throw new functions.https.HttpsError('invalid-argument', 'reservationId or guestKeyId is required.');
    }
    const keys = await listReservationGuestKeys(params.reservationId);
    const latestActive = keys.find((key) => ACTIVE_GUEST_KEY_STATUSES.has(key.data.status)) || keys[0];
    if (!latestActive) {
        throw new functions.https.HttpsError('not-found', `No guest key found for reservation ${params.reservationId}.`);
    }
    return latestActive;
};
const resolveOrIssueGuestKeyForReservation = async (params) => {
    const keys = await listReservationGuestKeys(params.reservationId);
    const active = keys.find((key) => ACTIVE_GUEST_KEY_STATUSES.has(key.data.status));
    if (active) {
        return Object.assign(Object.assign({}, active), { autoIssued: false });
    }
    try {
        const issued = await issueWalletKeyForReservation({
            reservationId: params.reservationId,
            actor: params.actor,
            actorRole: params.actorRole,
            source: params.source
        });
        return {
            id: issued.keyId,
            ref: db.collection('guest_keys').doc(issued.keyId),
            data: issued.key,
            autoIssued: true
        };
    }
    catch (error) {
        const code = String((error === null || error === void 0 ? void 0 : error.code) || '');
        if (code !== 'failed-precondition')
            throw error;
    }
    // Fallback for local/mock flow: allow .pkpass download even before formal check-in/room assignment.
    const resolvedReservation = await resolveReservationRecord(params.reservationId);
    const reservationData = resolvedReservation.data || {};
    const reservationId = String(reservationData.id || params.reservationId || resolvedReservation.docId);
    const now = Date.now();
    const checkOutEpoch = toEpoch(reservationData.checkOut);
    const validUntil = checkOutEpoch && checkOutEpoch > now ? checkOutEpoch : now + (24 * 60 * 60 * 1000);
    const guestId = String(reservationData.guestId || `GUEST_MOCK_${sanitizeIdSegment(reservationId)}`);
    const roomId = String(reservationData.roomId || `MOCK_ROOM_${sanitizeIdSegment(reservationId)}`);
    const roomNumber = reservationData.roomId
        ? (await resolveRoomNumber(String(reservationData.roomId)) || String(reservationData.roomId))
        : 'Mock';
    const wallet = buildMockWalletLinks({
        reservationId,
        guestId,
        roomId,
        roomNumber,
        validUntil
    });
    const fallbackRef = db.collection('guest_keys').doc();
    const fallbackKey = {
        id: fallbackRef.id,
        reservationId,
        reservationDocId: resolvedReservation.docId,
        guestId,
        propertyId: String(reservationData.propertyId || 'H1'),
        roomId,
        roomNumber,
        status: 'active',
        channel: 'both',
        provider: 'mock',
        issuedAt: now,
        issuedBy: params.actor,
        validFrom: now,
        validUntil,
        source: `${params.source}_fallback`,
        appleWallet: {
            status: 'ready',
            walletId: `apple_${wallet.walletId}`,
            addUrl: wallet.appleUrl,
            lastSentAt: now
        },
        googleWallet: {
            status: 'ready',
            walletId: `google_${wallet.walletId}`,
            addUrl: wallet.googleUrl,
            lastSentAt: now
        },
        metadata: {
            simulatedProvider: true,
            fallbackBypassPreconditions: true,
            originalReservationStatus: String(reservationData.status || 'unknown')
        },
        createdAt: now,
        updatedAt: now
    };
    await fallbackRef.set(fallbackKey);
    await appendGuestKeyEvent({
        guestKeyId: fallbackRef.id,
        reservationId,
        eventType: 'key_issued',
        actor: params.actor,
        actorRole: params.actorRole || 'system',
        reason: 'Auto-issued fallback key for mock Apple pass download.',
        metadata: {
            fallbackBypassPreconditions: true,
            originalReservationStatus: String(reservationData.status || 'unknown')
        }
    });
    return {
        id: fallbackRef.id,
        ref: fallbackRef,
        data: fallbackKey,
        autoIssued: true
    };
};
const resendWalletLinksForGuestKey = async (params) => {
    const target = await resolveGuestKeyByInput({
        reservationId: params.reservationId,
        guestKeyId: params.guestKeyId
    });
    if (!ACTIVE_GUEST_KEY_STATUSES.has(target.data.status)) {
        throw new functions.https.HttpsError('failed-precondition', 'Wallet links can only be resent for active guest keys.');
    }
    const now = Date.now();
    const nextAppleWallet = target.data.appleWallet
        ? Object.assign(Object.assign({}, target.data.appleWallet), { lastSentAt: now }) : undefined;
    const nextGoogleWallet = target.data.googleWallet
        ? Object.assign(Object.assign({}, target.data.googleWallet), { lastSentAt: now }) : undefined;
    await target.ref.set({
        appleWallet: nextAppleWallet || null,
        googleWallet: nextGoogleWallet || null,
        updatedAt: now
    }, { merge: true });
    await appendGuestKeyEvent({
        guestKeyId: target.id,
        reservationId: target.data.reservationId,
        eventType: 'wallet_link_resent',
        actor: params.actor,
        actorRole: params.actorRole || 'system'
    });
    return {
        keyId: target.id,
        key: Object.assign(Object.assign({}, target.data), { id: target.id, appleWallet: nextAppleWallet, googleWallet: nextGoogleWallet, updatedAt: now })
    };
};
const hasConfiguredAppleSigningMaterial = () => {
    return !!(APPLE_PASS_CERT && APPLE_PASS_KEY && APPLE_WWDR_CERT);
};
const normalizePem = (value) => {
    return value.includes('\\n') ? value.replace(/\\n/g, '\n') : value;
};
const writePemMaterial = async (value, targetPath) => {
    const normalized = normalizePem(String(value || '').trim());
    if (!normalized) {
        throw new Error(`Missing PEM material for ${path.basename(targetPath)}.`);
    }
    if (normalized.includes('-----BEGIN')) {
        const content = normalized.endsWith('\n') ? normalized : `${normalized}\n`;
        await fs.writeFile(targetPath, content, 'utf8');
        return targetPath;
    }
    const sourcePath = path.isAbsolute(normalized) ? normalized : path.resolve(normalized);
    const content = await fs.readFile(sourcePath, 'utf8');
    const finalContent = content.endsWith('\n') ? content : `${content}\n`;
    await fs.writeFile(targetPath, finalContent, 'utf8');
    return targetPath;
};
const resolveGuestDisplayName = async (guestId) => {
    var _a, _b;
    if (!guestId)
        return 'Guest';
    const byDocId = await db.collection('guests').doc(guestId).get();
    if (byDocId.exists) {
        const fullName = (_a = byDocId.data()) === null || _a === void 0 ? void 0 : _a.fullName;
        if (typeof fullName === 'string' && fullName.trim())
            return fullName.trim();
    }
    const byPrincipal = await db.collection('guests')
        .where('principal', '==', guestId)
        .limit(1)
        .get();
    if (!byPrincipal.empty) {
        const fullName = (_b = byPrincipal.docs[0].data()) === null || _b === void 0 ? void 0 : _b.fullName;
        if (typeof fullName === 'string' && fullName.trim())
            return fullName.trim();
    }
    return guestId;
};
const buildAppleMockPassArchive = async (params) => {
    const now = Date.now();
    const workRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'hs-wallet-pass-'));
    const bundleDir = path.join(workRoot, 'bundle');
    await fs.mkdir(bundleDir, { recursive: true });
    const guestName = await resolveGuestDisplayName(params.key.guestId);
    const reservationId = params.key.reservationId || 'RESERVATION';
    const roomLabel = params.key.roomNumber || params.key.roomId || 'Room';
    const validUntilIso = new Date(params.key.validUntil || now + 86400000).toISOString();
    const validFromIso = new Date(params.key.validFrom || now).toISOString();
    const passJson = {
        formatVersion: 1,
        passTypeIdentifier: APPLE_MOCK_PASS_TYPE_ID,
        serialNumber: `${params.keyId}-${now}`,
        teamIdentifier: APPLE_MOCK_TEAM_ID,
        organizationName: APPLE_MOCK_ORGANIZATION,
        description: 'Hotel Singularity Mobile Room Key (Mock)',
        logoText: 'Hotel Singularity',
        foregroundColor: 'rgb(255,255,255)',
        backgroundColor: 'rgb(15,23,42)',
        labelColor: 'rgb(148,163,184)',
        relevantDate: validFromIso,
        expirationDate: validUntilIso,
        generic: {
            primaryFields: [
                { key: 'room', label: 'ROOM', value: String(roomLabel) }
            ],
            secondaryFields: [
                { key: 'guest', label: 'GUEST', value: guestName },
                { key: 'status', label: 'KEY STATUS', value: String(params.key.status || 'active').toUpperCase() }
            ],
            auxiliaryFields: [
                { key: 'reservation', label: 'RESERVATION', value: reservationId },
                { key: 'expires', label: 'VALID UNTIL', value: validUntilIso.replace('T', ' ').slice(0, 16) }
            ]
        },
        barcodes: [
            {
                format: 'PKBarcodeFormatQR',
                message: JSON.stringify({
                    keyId: params.keyId,
                    reservationId,
                    roomId: params.key.roomId,
                    issuedAt: params.key.issuedAt
                }),
                messageEncoding: 'iso-8859-1',
                altText: params.keyId
            }
        ]
    };
    const pngBuffer = Buffer.from(MOCK_PASS_ICON_PNG_BASE64, 'base64');
    const fileMap = {
        'pass.json': Buffer.from(JSON.stringify(passJson, null, 2), 'utf8'),
        'icon.png': pngBuffer,
        'icon@2x.png': pngBuffer,
        'logo.png': pngBuffer,
        'logo@2x.png': pngBuffer
    };
    for (const [fileName, content] of Object.entries(fileMap)) {
        await fs.writeFile(path.join(bundleDir, fileName), content);
    }
    const manifest = {};
    for (const [fileName, content] of Object.entries(fileMap)) {
        manifest[fileName] = (0, crypto_1.createHash)('sha1').update(content).digest('hex');
    }
    const manifestPath = path.join(bundleDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    const signaturePath = path.join(bundleDir, 'signature');
    const passCertPath = path.join(workRoot, 'pass-cert.pem');
    const passKeyPath = path.join(workRoot, 'pass-key.pem');
    const wwdrPath = path.join(workRoot, 'wwdr.pem');
    const selfCertPath = path.join(workRoot, 'self-cert.pem');
    const selfKeyPath = path.join(workRoot, 'self-key.pem');
    let installable = false;
    try {
        if (hasConfiguredAppleSigningMaterial()) {
            await writePemMaterial(APPLE_PASS_CERT, passCertPath);
            await writePemMaterial(APPLE_PASS_KEY, passKeyPath);
            await writePemMaterial(APPLE_WWDR_CERT, wwdrPath);
            await execFileAsync(OPENSSL_BIN, [
                'smime',
                '-binary',
                '-sign',
                '-signer',
                passCertPath,
                '-inkey',
                passKeyPath,
                '-certfile',
                wwdrPath,
                '-in',
                manifestPath,
                '-out',
                signaturePath,
                '-outform',
                'DER'
            ]);
            installable = true;
        }
        else {
            await execFileAsync(OPENSSL_BIN, [
                'req',
                '-newkey',
                'rsa:2048',
                '-nodes',
                '-x509',
                '-days',
                '30',
                '-subj',
                '/CN=Hotel Singularity Mock Wallet Pass/',
                '-keyout',
                selfKeyPath,
                '-out',
                selfCertPath
            ]);
            await execFileAsync(OPENSSL_BIN, [
                'smime',
                '-binary',
                '-sign',
                '-signer',
                selfCertPath,
                '-inkey',
                selfKeyPath,
                '-in',
                manifestPath,
                '-out',
                signaturePath,
                '-outform',
                'DER'
            ]);
        }
        const filename = `guest-key-${sanitizeIdSegment(params.keyId)}.pkpass`;
        const outputPath = path.join(workRoot, filename);
        await execFileAsync(ZIP_BIN, ['-q', '-r', outputPath, '.'], { cwd: bundleDir });
        const pkpassBuffer = await fs.readFile(outputPath);
        return {
            filename,
            pkpassBase64: pkpassBuffer.toString('base64'),
            installable
        };
    }
    finally {
        await fs.rm(workRoot, { recursive: true, force: true });
    }
};
exports.backendHealth = functions.https.onCall(async () => {
    return {
        ok: true,
        timestamp: Date.now(),
        projectId: process.env.GCLOUD_PROJECT || null
    };
});
exports.issueOperatorSession = functions.https.onCall(async (data) => {
    const employeeId = typeof (data === null || data === void 0 ? void 0 : data.employeeId) === 'string' ? data.employeeId.trim() : '';
    const pin = typeof (data === null || data === void 0 ? void 0 : data.pin) === 'string' ? data.pin.trim() : '';
    if (!employeeId || !pin) {
        throw new functions.https.HttpsError('invalid-argument', 'Employee ID and PIN are required.');
    }
    const resolved = await resolveOperator(employeeId);
    if (!resolved) {
        throw new functions.https.HttpsError('not-found', 'Employee not found. Check your ID and try again.');
    }
    const { record, sourceDocId } = resolved;
    const hashedInput = hashPin(pin);
    const storedPin = record.pin || '';
    const storedHash = record.pinHash || '';
    const isValidPin = storedHash === hashedInput || (!storedHash && storedPin === pin);
    if (!isValidPin) {
        throw new functions.https.HttpsError('permission-denied', 'Incorrect PIN. Please try again.');
    }
    const role = VALID_ROLES.has(record.role) ? record.role : 'Staff';
    const principal = record.principal || record.employeeId || sourceDocId || employeeId;
    const uid = sanitizeUid(principal);
    const sessionId = (0, crypto_1.randomUUID)();
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const token = await admin.auth().createCustomToken(uid, {
        role,
        hotelId: record.hotelId || 'H1',
        principal
    });
    await db.collection('auth_sessions').doc(sessionId).set({
        sessionId,
        userId: uid,
        principal,
        employeeId: record.employeeId || principal,
        role,
        hotelId: record.hotelId || 'H1',
        issuedAt: Date.now(),
        expiresAt
    });
    if (sourceDocId && !storedHash && storedPin) {
        await db.collection('users').doc(sourceDocId).set({
            pinHash: hashedInput,
            pinMigratedAt: Date.now(),
            pin: firestore_1.FieldValue.delete()
        }, { merge: true });
    }
    return {
        token,
        sessionId,
        expiresAt,
        user: {
            userId: uid,
            principal,
            fullName: record.fullName,
            role,
            hotelId: record.hotelId || 'H1'
        }
    };
});
/**
 * Singularity OS Backend Infrastructure
 * API Route: OTA Webhook Receiver
 *
 * This is a true backend Node.js function. It securely receives payloads
 * from external sources (like Booking.com or Expedia), validates them,
 * and writes directly to the local database, bypassing all frontend logic.
 */
exports.otaWebhookReceiver = functions.https.onRequest(async (req, res) => {
    // 1. Security Check
    const apiKey = req.headers["x-api-key"];
    if (!isInternalKey(apiKey)) {
        res.status(401).send("Unauthorized: Invalid API Key");
        return;
    }
    try {
        const payload = req.body || {};
        functions.logger.info("[Singularity Backend] Received OTA Webhook Payload", { payload });
        const errors = [];
        const asString = (value, name, required = true) => {
            if (typeof value === 'string' && value.trim())
                return value.trim();
            if (required)
                errors.push(`${name} is required and must be a string`);
            return '';
        };
        const asDateIso = (value, name) => {
            if (typeof value !== 'string') {
                errors.push(`${name} is required and must be an ISO date string`);
                return null;
            }
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) {
                errors.push(`${name} is invalid date`);
                return null;
            }
            return d.toISOString();
        };
        const asMoney = (value, name) => {
            const num = Number(value);
            if (!Number.isFinite(num) || num < 0) {
                errors.push(`${name} must be a non-negative number`);
                return null;
            }
            return num;
        };
        const otaName = asString(payload.otaName, 'otaName');
        const reservationId = asString(payload.reservationId, 'reservationId');
        const checkIn = asDateIso(payload.checkIn, 'checkIn');
        const checkOut = asDateIso(payload.checkOut, 'checkOut');
        const price = asMoney(payload.price, 'price');
        const assignedRoom = typeof payload.assignedRoom === 'string' && payload.assignedRoom.trim()
            ? payload.assignedRoom.trim()
            : null;
        if (errors.length > 0 || !checkIn || !checkOut || price === null) {
            res.status(400).send(`Bad Request: ${errors.join('; ')}`);
            return;
        }
        // 2. Heavy Backend Processing
        // Transform the external OTA payload into a Singularity OS Reservation
        const newReservation = {
            id: `EXT-${reservationId}`,
            guestId: "GUEST-UNKNOWN", // Would normally do guest matching here
            roomId: assignedRoom,
            status: "Confirmed",
            checkIn,
            checkOut,
            ratePlan: typeof payload.rateCode === 'string' && payload.rateCode.trim() ? payload.rateCode.trim() : "OTA_Standard",
            totalAmount: price,
            balance: price, // Payment not yet captured
            source: otaName,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        };
        // 3. Database Write (Admin Privileges)
        // This write happens with root backend privileges, instantly syncing down to the React frontend.
        await db.collection("reservations").doc(newReservation.id).set(newReservation);
        functions.logger.info(`[Singularity Backend] Successfully processed OTA reservation: ${newReservation.id}`);
        // 4. Respond to the OTA ensuring they know we got it
        res.status(200).send({
            success: true,
            message: "Reservation successfully ingested into Singularity OS.",
            singularityId: newReservation.id
        });
    }
    catch (error) {
        functions.logger.error("[Singularity Backend] Webhook Processing Failed:", error);
        res.status(500).send("Internal Server Error processing webhook.");
    }
});
/**
 * Singularity OS Backend Infrastructure
 * Background Process: Automated Night Audit
 *
 * This CRON job runs every day at 2:00 AM. It guarantees the hotel's
 * financial day rolls over, room charges are posted, and reports
 * are generated, even if no users are logged into the system.
 */
exports.runNightAudit = functions.pubsub.schedule('0 2 * * *')
    .timeZone('America/New_York') // Hardcoded to NY for MVP; would normally read from Hotel Config
    .onRun(async (context) => {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    functions.logger.info("🌙 [Singularity Backend] Starting Automated Night Audit", { context });
    try {
        // 1. Fetch current business date from Firestore
        const configDoc = await db.collection('systemConfig').doc('businessDate').get();
        const configData = configDoc.data();
        if (!configDoc.exists || !(configData === null || configData === void 0 ? void 0 : configData.date)) {
            throw new Error("Cannot run night audit: Business Date configuration not found.");
        }
        // In Firestore, dates are stored as Timestamps, so we convert to Date
        const currentBusinessDate = configData.date.toDate();
        functions.logger.info(`🌙 [Singularity Backend] Auditing for Business Date: ${currentBusinessDate.toISOString()}`);
        // 2. Setup the Audit Log Run Document
        const auditRunId = `audit_${Date.now()}`;
        const auditRef = db.collection('auditRuns').doc(auditRunId);
        await auditRef.set({
            id: auditRunId,
            businessDate: currentBusinessDate,
            startTime: timestamp,
            status: 'running',
            type: 'auto_cron',
            steps: []
        });
        // 3. (MVP placeholder) In a full production port, we would instantiate
        // the NightAuditEngine class here and pass it the admin `db` instance.
        // For now, we will simulate the heavy lifting and just roll the date.
        // Simulate the heavy lifting (Posting Room Revenue)
        await new Promise(resolve => setTimeout(resolve, 2000));
        functions.logger.info("🌙 [Singularity Backend] Room Revenues Posted.");
        // 4. Roll over the Business Date to tomorrow
        const nextBusinessDate = new Date(currentBusinessDate);
        nextBusinessDate.setDate(nextBusinessDate.getDate() + 1);
        await db.collection('systemConfig').doc('businessDate').update({
            date: nextBusinessDate,
            updatedAt: timestamp,
            updatedBy: 'system_cron_backend'
        });
        functions.logger.info(`🌙 [Singularity Backend] Rolled Business Date to: ${nextBusinessDate.toISOString()}`);
        // 5. Complete the Audit Log
        await auditRef.update({
            status: 'completed',
            endTime: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info("🌙 [Singularity Backend] Night Audit Completed Successfully.");
    }
    catch (error) {
        functions.logger.error("❌ [Singularity Backend] Night Audit FAILED:", error);
        // In production, trigger a PagerDuty/Slack alert here
    }
});
/**
 * Singularity OS Backend Infrastructure
 * Background Process: POS Transaction Delivery Queue
 *
 * This function acts as a guaranteed delivery outbox. Whenever a POS
 * rings up a room charge, it drops a message in the `pos_outbox` collection.
 * This backend function picks it up, finds the active folio for that room,
 * and securely posts the charge.
 */
exports.processPosTransaction = functions.firestore
    .document('pos_outbox/{transactionId}')
    .onCreate(async (snap, context) => {
    const transaction = snap.data();
    const transactionId = context.params.transactionId;
    functions.logger.info(`💳 [Singularity Backend] Processing POS Transaction: ${transactionId}`, { transaction });
    try {
        if (!transaction.roomId || !transaction.amount) {
            throw new Error("Invalid transaction payload. Missing roomId or amount.");
        }
        // 1. Find the active reservation attached to this room
        const reservationsSnapshot = await db.collection('reservations')
            .where('roomId', '==', transaction.roomId)
            .where('status', '==', 'Checked In')
            .limit(1)
            .get();
        if (reservationsSnapshot.empty) {
            // Depending on hotel policy, we might still post it to a "Lost & Found" folio,
            // but for now, we reject the charge if the room is empty.
            throw new Error(`Charge rejected: Room ${transaction.roomId} is currently vacant.`);
        }
        const reservation = reservationsSnapshot.docs[0].data();
        const reservationId = reservationsSnapshot.docs[0].id;
        // 2. Build the official Folio entry
        const folioCharge = {
            reservationId: reservationId,
            transactionCode: transaction.departmentCode || 'POS_F&B',
            description: transaction.description || 'Bar / Restaurant Charge',
            amount: transaction.amount,
            tax: transaction.tax || 0,
            businessDate: transaction.businessDate, // The POS terminal sends the date it knows
            postingDate: firestore_1.FieldValue.serverTimestamp(),
            type: 'debit',
            source: transaction.sourceTerminal || 'UNKNOWN_POS',
            posReferenceId: transactionId,
            folioWindow: 1
        };
        // 3. Use a Firestore Transaction to guarantee atomic delivery
        await db.runTransaction(async (t) => {
            // Create the transaction record
            const newTxRef = db.collection('transactions').doc();
            t.set(newTxRef, folioCharge);
            // Update the guest's master reservation balance
            const resRef = db.collection('reservations').doc(reservationId);
            const currentBalance = reservation.balance || 0;
            t.update(resRef, { balance: currentBalance + folioCharge.amount + folioCharge.tax });
            // Mark the outbox message as successfully processed
            t.update(snap.ref, {
                status: 'PROCESSED',
                processedAt: firestore_1.FieldValue.serverTimestamp(),
                appliedToReservationId: reservationId,
                result: 'Success'
            });
        });
        functions.logger.info(`💳 [Singularity Backend] POS Transaction ${transactionId} successfully posted to Folio ${reservationId}`);
    }
    catch (error) {
        functions.logger.error(`❌ [Singularity Backend] POS Transaction ${transactionId} FAILED:`, error);
        // Mark the outbox message as failed for manual review by the finance team
        await snap.ref.update({
            status: 'FAILED',
            processedAt: firestore_1.FieldValue.serverTimestamp(),
            result: error instanceof Error ? error.message : "Unknown Error"
        });
    }
});
/**
 * Singularity OS Backend Infrastructure
 * API Route: Verify OTA Connection
 *
 * This Callable Function allows the React frontend to pass an API key
 * to the backend safely. The backend will verify it against the real
 * OTA provider (Booking.com/Expedia) and return success/failure.
 * If successful, the backend automatically writes the connection status.
 */
exports.verifyOtaConnection = functions.https.onCall(async (data, context) => {
    // 1. Validate Input Data
    const { otaId, otaName, apiKey, icon } = data;
    if (!otaId || !otaName || !apiKey) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: otaId, otaName, apiKey');
    }
    functions.logger.info(`🌐 [Singularity Backend] Verifying API Key for ${otaName}...`);
    try {
        // 2. Perform Real HTTP Ping Verification
        // In a true production app, we would make a fetch() request to
        // https://api.booking.com/v1/ping using the provided apiKey.
        // For local simulation, only a configured demo key is accepted.
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network latency
        const validSimulatedOtaKey = ALLOW_SIMULATED_PROVIDER_KEYS && !!OTA_DEMO_KEY && apiKey === OTA_DEMO_KEY;
        if (!validSimulatedOtaKey) {
            throw new Error(`Authentication failed. The API Key provided for ${otaName} is invalid or expired.`);
        }
        // 3. Success! Save the connection securely from the backend.
        // The React frontend no longer has permission to write this itself.
        const connectionData = {
            id: otaId,
            name: otaName,
            icon: icon || '',
            status: 'Connected',
            connectedAt: firestore_1.FieldValue.serverTimestamp(),
            lastSync: Date.now(),
            // DO NOT SAVE RAW API KEYS IN PLAINTEXT (Simulating a Hash/Mask)
            apiKeyMasked: `****${apiKey.slice(-4)}`
        };
        await db.collection('otaConnections').doc(otaId).set(connectionData);
        functions.logger.info(`✅ [Singularity Backend] Successfully verified and connected ${otaName}.`);
        // 4. Respond to the Frontend
        return {
            success: true,
            message: `Successfully connected to ${otaName}`
        };
    }
    catch (error) {
        functions.logger.error(`❌ [Singularity Backend] API Verification Failed for ${otaName}:`, error);
        throw new functions.https.HttpsError('permission-denied', error instanceof Error ? error.message : "Integration verification failed.");
    }
});
/**
 * Singularity OS Backend Infrastructure
 * API Route: Verify Stripe Connection
 *
 * Securely receives a Stripe Secret Key from the frontend, verifies it
 * against the real Stripe API, and stores a masked version in Firestore
 * if valid.
 */
exports.verifyStripeConnection = functions.https.onCall(async (data, context) => {
    const { secretKey } = data;
    if (!secretKey) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing Stripe Secret Key');
    }
    functions.logger.info(`💳 [Singularity Backend] Verifying Stripe API Key...`);
    try {
        // 1. True Backend Verification
        // In reality we would do: await fetch('https://api.stripe.com/v1/account', { headers: { Authorization: `Bearer ${secretKey}` }})
        // For local simulation, key patterns are accepted only if explicitly enabled.
        await new Promise(resolve => setTimeout(resolve, 1800)); // Simulate network latency
        const validSimulatedStripeKey = ALLOW_SIMULATED_PROVIDER_KEYS && (secretKey === STRIPE_DEMO_KEY ||
            secretKey.startsWith('sk_test_') ||
            secretKey.startsWith('sk_live_'));
        if (!validSimulatedStripeKey) {
            throw new Error(`Authentication failed. The key provided is not a valid Stripe Secret Key.`);
        }
        const isLiveMode = secretKey.startsWith('sk_live_');
        // 2. Database Write (Root Privileges)
        // Store the encrypted/masked connection.
        const connectionData = {
            id: 'stripe_primary',
            status: 'CONNECTED',
            mode: isLiveMode ? 'live' : 'test',
            connectedAt: firestore_1.FieldValue.serverTimestamp(),
            apiKeyMasked: `****${secretKey.slice(-4)}`
        };
        // We store this in the core system configuration
        await db.collection('systemConfig').doc('paymentGateway').set(connectionData);
        functions.logger.info(`✅ [Singularity Backend] Successfully verified and connected Stripe in ${connectionData.mode} mode.`);
        // 3. Respond
        return {
            success: true,
            message: `Successfully connected Stripe (${connectionData.mode} mode)`
        };
    }
    catch (error) {
        functions.logger.error(`❌ [Singularity Backend] Stripe Verification Failed:`, error);
        throw new functions.https.HttpsError('permission-denied', error instanceof Error ? error.message : "Stripe verification failed.");
    }
});
/**
 * Guest Wallet Key — Manual issue endpoint
 * Uses the same issuance pipeline as automatic reservation status transitions.
 */
exports.issueGuestWalletKey = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Sign in is required.');
        }
        const reservationId = typeof (data === null || data === void 0 ? void 0 : data.reservationId) === 'string' ? data.reservationId.trim() : '';
        const forceReissue = !!(data === null || data === void 0 ? void 0 : data.forceReissue);
        if (!reservationId) {
            throw new functions.https.HttpsError('invalid-argument', 'reservationId is required.');
        }
        const actor = resolveActorFromCallableContext(context);
        const result = await issueWalletKeyForReservation({
            reservationId,
            actor: actor.actor,
            actorRole: actor.actorRole,
            source: 'manual_callable',
            forceReissue
        });
        return {
            success: true,
            keyId: result.keyId,
            key: result.key,
            alreadyActive: result.alreadyActive,
            message: result.alreadyActive
                ? 'An active wallet key already exists for this reservation.'
                : 'Guest wallet key issued successfully.'
        };
    }
    catch (error) {
        throw asHttpsError(error, 'Unable to issue guest wallet key.');
    }
});
/**
 * Guest Wallet Key — Manual revoke endpoint
 */
exports.revokeGuestWalletKey = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Sign in is required.');
    }
    const reservationId = typeof (data === null || data === void 0 ? void 0 : data.reservationId) === 'string' ? data.reservationId.trim() : '';
    const guestKeyId = typeof (data === null || data === void 0 ? void 0 : data.guestKeyId) === 'string' ? data.guestKeyId.trim() : '';
    const reason = typeof (data === null || data === void 0 ? void 0 : data.reason) === 'string' && data.reason.trim()
        ? data.reason.trim()
        : 'Revoked by operator.';
    const actor = resolveActorFromCallableContext(context);
    if (guestKeyId) {
        const target = await resolveGuestKeyByInput({ guestKeyId });
        const revoked = await revokeGuestKeyRef({
            keyId: target.id,
            keyRef: target.ref,
            keyData: target.data,
            actor: actor.actor,
            actorRole: actor.actorRole,
            reason
        });
        return {
            success: true,
            keyId: target.id,
            revoked: revoked ? 1 : 0,
            message: revoked ? 'Guest key revoked.' : 'Guest key was already inactive.'
        };
    }
    if (!reservationId) {
        throw new functions.https.HttpsError('invalid-argument', 'reservationId or guestKeyId is required.');
    }
    const revoked = await revokeActiveGuestKeysForReservation({
        reservationId,
        actor: actor.actor,
        actorRole: actor.actorRole,
        reason
    });
    return {
        success: true,
        revoked,
        message: revoked > 0
            ? `Revoked ${revoked} active guest key(s).`
            : 'No active guest keys found for this reservation.'
    };
});
/**
 * Guest Wallet Key — Resend wallet links endpoint
 */
exports.resendGuestWalletKey = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Sign in is required.');
    }
    const reservationId = typeof (data === null || data === void 0 ? void 0 : data.reservationId) === 'string' ? data.reservationId.trim() : '';
    const guestKeyId = typeof (data === null || data === void 0 ? void 0 : data.guestKeyId) === 'string' ? data.guestKeyId.trim() : '';
    if (!reservationId && !guestKeyId) {
        throw new functions.https.HttpsError('invalid-argument', 'reservationId or guestKeyId is required.');
    }
    const actor = resolveActorFromCallableContext(context);
    const result = await resendWalletLinksForGuestKey({
        reservationId: reservationId || undefined,
        guestKeyId: guestKeyId || undefined,
        actor: actor.actor,
        actorRole: actor.actorRole
    });
    return {
        success: true,
        keyId: result.keyId,
        key: result.key,
        message: 'Wallet links resent.'
    };
});
/**
 * Guest Wallet Key — Generate downloadable Apple .pkpass for local AirDrop.
 */
exports.generateMockAppleWalletPass = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Sign in is required.');
        }
        const reservationId = typeof (data === null || data === void 0 ? void 0 : data.reservationId) === 'string' ? data.reservationId.trim() : '';
        const guestKeyId = typeof (data === null || data === void 0 ? void 0 : data.guestKeyId) === 'string' ? data.guestKeyId.trim() : '';
        if (!reservationId && !guestKeyId) {
            throw new functions.https.HttpsError('invalid-argument', 'reservationId or guestKeyId is required.');
        }
        const actor = resolveActorFromCallableContext(context);
        const target = guestKeyId
            ? await resolveGuestKeyByInput({ guestKeyId })
            : await resolveOrIssueGuestKeyForReservation({
                reservationId,
                actor: actor.actor,
                actorRole: actor.actorRole,
                source: 'pkpass_download_auto_issue'
            });
        if (!ACTIVE_GUEST_KEY_STATUSES.has(target.data.status)) {
            throw new functions.https.HttpsError('failed-precondition', 'Apple Wallet pass generation is only available for active or issuing keys.');
        }
        const archive = await buildAppleMockPassArchive({
            keyId: target.id,
            key: target.data
        });
        await appendGuestKeyEvent({
            guestKeyId: target.id,
            reservationId: target.data.reservationId,
            eventType: 'wallet_link_resent',
            actor: actor.actor,
            actorRole: actor.actorRole,
            reason: 'Generated Apple .pkpass for local AirDrop.',
            metadata: {
                autoIssuedForDownload: target.autoIssued === true
            }
        });
        return {
            success: true,
            keyId: target.id,
            filename: archive.filename,
            pkpassBase64: archive.pkpassBase64,
            installable: archive.installable,
            message: archive.installable
                ? 'Apple Wallet pass generated with configured certificates.'
                : 'Mock Apple pass generated with self-signed certificate. AirDrop works, but Wallet may reject until Apple pass certificates are configured.'
        };
    }
    catch (error) {
        throw asHttpsError(error, 'Unable to generate Apple Wallet pass for this reservation.');
    }
});
/**
 * Reservation lifecycle hook for wallet key automation.
 * - Checked-in transition: issue key
 * - Exit checked-in state: revoke key
 * - In-house room move: revoke previous key + reissue
 */
exports.syncGuestWalletKeysOnReservationLifecycle = functions.firestore
    .document('reservations/{reservationDocId}')
    .onWrite(async (change, context) => {
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;
    const reservationDocId = context.params.reservationDocId;
    if (!afterData) {
        if (!beforeData)
            return;
        const reservationId = String(beforeData.id || reservationDocId);
        await revokeActiveGuestKeysForReservation({
            reservationId,
            actor: 'system_trigger',
            actorRole: 'system',
            reason: 'Reservation deleted.',
            eventType: 'status_sync'
        });
        return;
    }
    const reservationId = String(afterData.id || reservationDocId);
    const wasCheckedIn = isCheckedInStatus(beforeData === null || beforeData === void 0 ? void 0 : beforeData.status);
    const nowCheckedIn = isCheckedInStatus(afterData.status);
    const roomChangedWhileInHouse = wasCheckedIn && nowCheckedIn && ((beforeData === null || beforeData === void 0 ? void 0 : beforeData.roomId) || null) !== (afterData.roomId || null);
    if (!wasCheckedIn && nowCheckedIn) {
        try {
            await issueWalletKeyForReservation({
                reservationId,
                actor: 'system_trigger',
                actorRole: 'system',
                source: 'reservation_status_transition',
                reservationRecordOverride: {
                    docId: reservationDocId,
                    data: afterData
                }
            });
        }
        catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            await appendGuestKeyEvent({
                guestKeyId: `pending_${reservationId}`,
                reservationId,
                eventType: 'key_issue_failed',
                actor: 'system_trigger',
                actorRole: 'system',
                reason
            });
        }
        return;
    }
    if (roomChangedWhileInHouse) {
        await revokeActiveGuestKeysForReservation({
            reservationId,
            actor: 'system_trigger',
            actorRole: 'system',
            reason: 'Room changed during stay.',
            eventType: 'room_changed'
        });
        try {
            await issueWalletKeyForReservation({
                reservationId,
                actor: 'system_trigger',
                actorRole: 'system',
                source: 'room_change_reissue',
                forceReissue: true,
                reservationRecordOverride: {
                    docId: reservationDocId,
                    data: afterData
                }
            });
        }
        catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            await appendGuestKeyEvent({
                guestKeyId: `pending_${reservationId}`,
                reservationId,
                eventType: 'key_issue_failed',
                actor: 'system_trigger',
                actorRole: 'system',
                reason
            });
        }
        return;
    }
    if (wasCheckedIn && !nowCheckedIn) {
        await revokeActiveGuestKeysForReservation({
            reservationId,
            actor: 'system_trigger',
            actorRole: 'system',
            reason: `Reservation moved out of checked-in state (${String(afterData.status || 'unknown')}).`,
            eventType: 'status_sync'
        });
    }
});
/**
 * Demo Inquiry Notification Trigger
 * Sends an email to the commercial inbox when a potential client submits Contact Us.
 */
exports.notifyOnDemoInquiry = functions.firestore
    .document("demo_inquiries/{inquiryId}")
    .onCreate(async (snap, context) => {
    const inquiry = snap.data();
    const inquiryId = context.params.inquiryId;
    const fullName = sanitize(inquiry.fullName);
    const email = sanitize(inquiry.email);
    const contactNumber = sanitize(inquiry.contactNumber);
    const businessName = sanitize(inquiry.businessName);
    const requestedAt = sanitize(inquiry.requestedAt, new Date().toISOString());
    const source = sanitize(inquiry.source, "website_contact_form");
    if (!notificationTransport) {
        functions.logger.warn("[Lead Notify] SMTP not configured. Skipping email send.", {
            inquiryId,
            source
        });
        await snap.ref.set({
            notificationStatus: "skipped_missing_smtp_config",
            notificationUpdatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        return;
    }
    const subject = `New Demo Request • ${businessName} • ${fullName}`;
    const textBody = [
        "New Hotel Singularity OS demo request received.",
        "",
        `Inquiry ID: ${inquiryId}`,
        `Full Name: ${fullName}`,
        `Email: ${email}`,
        `Contact Number: ${contactNumber}`,
        `Business Name: ${businessName}`,
        `Requested At: ${requestedAt}`,
        `Source: ${source}`,
    ].join("\n");
    const htmlBody = `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2 style="margin:0 0 12px;color:#0f766e">New Demo Request</h2>
            <p style="margin:0 0 14px">A potential business owner submitted the Hotel Singularity OS contact form.</p>
            <table style="border-collapse:collapse;width:100%;max-width:640px">
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Inquiry ID</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${inquiryId}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Full Name</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${fullName}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Email</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${email}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Contact Number</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${contactNumber}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Business Name</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${businessName}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Requested At</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${requestedAt}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb"><strong>Source</strong></td><td style="padding:8px;border:1px solid #e5e7eb">${source}</td></tr>
            </table>
          </div>
        `;
    try {
        await notificationTransport.sendMail({
            from: EMAIL_FROM,
            to: EMAIL_TO,
            replyTo: email !== "N/A" ? email : undefined,
            subject,
            text: textBody,
            html: htmlBody,
        });
        await snap.ref.set({
            notificationStatus: "email_sent",
            notificationSentAt: firestore_1.FieldValue.serverTimestamp(),
            notificationUpdatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        functions.logger.info("[Lead Notify] Demo request email sent.", { inquiryId });
    }
    catch (error) {
        functions.logger.error("[Lead Notify] Failed to send demo request email.", {
            inquiryId,
            error: error instanceof Error ? error.message : String(error),
        });
        await snap.ref.set({
            notificationStatus: "email_failed",
            notificationError: error instanceof Error ? error.message : String(error),
            notificationUpdatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
});
/**
 * Singularity OS — Create Stripe Payment Intent
 *
 * Called by the frontend BookingModal when the guest reaches the payment step.
 * Uses the hotel pre-authorization pattern:
 *   capture_method: 'manual' → funds are held but NOT captured until check-out.
 *
 * The Stripe secret key never leaves this backend.
 * Funds are held but not captured until the guest checks out.
 */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
    var _a;
    const { amountInCents, currency, reservationId, guestName, propertyId, captureMethod } = data;
    if (!amountInCents || !currency || !reservationId || !propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: amountInCents, currency, reservationId, propertyId');
    }
    // Retrieve Stripe secret key from Firebase Functions config.
    // Deploy with: firebase functions:config:set stripe.secret_key="sk_live_..."
    const stripeSecretKey = (_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret_key;
    if (!stripeSecretKey) {
        functions.logger.error("❌ [Singularity Backend] Stripe secret key not configured. Run: firebase functions:config:set stripe.secret_key=sk_live_...");
        throw new functions.https.HttpsError('failed-precondition', 'Payment gateway is not configured. Please contact the hotel administrator.');
    }
    const stripe = new stripe_1.default(stripeSecretKey, { apiVersion: '2023-10-16' });
    functions.logger.info(`💳 [Singularity Backend] Creating Payment Intent for reservation ${reservationId} — ${amountInCents} ${currency.toUpperCase()} — property ${propertyId}`);
    try {
        // Create a PaymentIntent with manual capture (hotel pre-authorization pattern).
        // This holds the funds without charging the guest until check-out.
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency.toLowerCase(),
            capture_method: captureMethod === 'automatic' ? 'automatic' : 'manual',
            metadata: {
                reservationId,
                guestName: guestName || 'Unknown Guest',
                propertyId,
                platform: 'Hotel Singularity OS'
            },
            description: `Hotel Singularity OS — Reservation ${reservationId}`
        });
        functions.logger.info(`✅ [Singularity Backend] Payment Intent created: ${paymentIntent.id}`);
        // Record the intent in Firestore for audit trail
        await db.collection(`properties/${propertyId}/payment_intents`).doc(paymentIntent.id).set({
            id: paymentIntent.id,
            reservationId,
            propertyId,
            amountInCents,
            currency: currency.toLowerCase(),
            status: paymentIntent.status,
            captureMethod: paymentIntent.capture_method,
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        };
    }
    catch (error) {
        functions.logger.error(`❌ [Singularity Backend] Failed to create Payment Intent:`, error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Payment processing error.');
    }
});
exports.capturePaymentIntent = functions.https.onCall(async (data) => {
    var _a;
    const { paymentIntentId, propertyId, amountInCents } = data;
    if (!paymentIntentId || !propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'paymentIntentId and propertyId are required');
    }
    const stripeSecretKey = (_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret_key;
    if (!stripeSecretKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Stripe secret key not configured.');
    }
    const stripe = new stripe_1.default(stripeSecretKey, { apiVersion: '2023-10-16' });
    try {
        const params = {};
        if (amountInCents)
            params.amount_to_capture = amountInCents;
        const intent = await stripe.paymentIntents.capture(paymentIntentId, params);
        await db.collection(`properties/${propertyId}/payment_intents`).doc(paymentIntentId).set({
            status: intent.status,
            capturedAt: firestore_1.FieldValue.serverTimestamp(),
            amountCaptured: intent.amount_received,
            lastUpdate: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        return { status: intent.status, amountCaptured: intent.amount_received };
    }
    catch (error) {
        functions.logger.error('[Payments] Capture failed', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Capture failed');
    }
});
exports.refundPaymentIntent = functions.https.onCall(async (data) => {
    var _a;
    const { paymentIntentId, propertyId, amountInCents, reason } = data;
    if (!paymentIntentId || !propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'paymentIntentId and propertyId are required');
    }
    const stripeSecretKey = (_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret_key;
    if (!stripeSecretKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Stripe secret key not configured.');
    }
    const stripe = new stripe_1.default(stripeSecretKey, { apiVersion: '2023-10-16' });
    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amountInCents,
            reason: reason || undefined
        });
        await db.collection(`properties/${propertyId}/payment_refunds`).doc(refund.id).set({
            id: refund.id,
            paymentIntentId,
            propertyId,
            amountInCents: refund.amount,
            status: refund.status,
            reason: refund.reason,
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
        await db.collection(`properties/${propertyId}/payment_intents`).doc(paymentIntentId).set({
            lastRefundId: refund.id,
            lastUpdate: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        return { status: refund.status, refundId: refund.id };
    }
    catch (error) {
        functions.logger.error('[Payments] Refund failed', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Refund failed');
    }
});
exports.createSetupIntent = functions.https.onCall(async (data) => {
    var _a;
    const { propertyId, customerId } = data;
    if (!propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId is required');
    }
    const stripeSecretKey = (_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret_key;
    if (!stripeSecretKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Stripe secret key not configured.');
    }
    const stripe = new stripe_1.default(stripeSecretKey, { apiVersion: '2023-10-16' });
    try {
        // Create customer if not provided
        let customer = customerId;
        if (!customer) {
            const created = await stripe.customers.create({ description: `Hotel Singularity Guest (${propertyId})` });
            customer = created.id;
        }
        const setupIntent = await stripe.setupIntents.create({
            customer,
            payment_method_types: ['card'],
            metadata: { propertyId }
        });
        await db.collection(`properties/${propertyId}/payment_customers`).doc(customer).set({
            id: customer,
            createdAt: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        return { clientSecret: setupIntent.client_secret, customerId: customer, setupIntentId: setupIntent.id };
    }
    catch (error) {
        functions.logger.error('[Payments] SetupIntent failed', error);
        throw new functions.https.HttpsError('internal', error instanceof Error ? error.message : 'Setup intent failed');
    }
});
// ────────────────────────────────────────────────────────────────────────────
// OTA INTEGRATIONS (Booking.com / Expedia)
// ────────────────────────────────────────────────────────────────────────────
const getOtaKey = (keyName) => {
    const envKey = process.env[keyName];
    const cfgKey = (functions.config().ota || {})[keyName.toLowerCase()];
    return envKey || cfgKey || null;
};
const assertOtaKey = (req, keyName) => {
    const provided = req.header('x-ota-key');
    const expected = getOtaKey(keyName);
    if (!expected || provided !== expected) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid OTA key');
    }
};
const recordOtaEvent = async (propertyId, source, kind, payload) => {
    const ref = db.collection(`properties/${propertyId}/ota_events`).doc();
    await ref.set({
        id: ref.id,
        source,
        kind,
        payload,
        createdAt: firestore_1.FieldValue.serverTimestamp()
    });
    return ref.id;
};
exports.bookingComReservationWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    try {
        assertOtaKey(req, 'BOOKING_COM_PARTNER_KEY');
        const propertyId = String(req.query.propertyId || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.hotelId) || '').trim();
        if (!propertyId)
            throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
        const eventId = await recordOtaEvent(propertyId, 'booking_com', 'reservation', req.body);
        await db.collection(`properties/${propertyId}/ota_reservations`).doc(eventId).set({
            id: eventId,
            source: 'booking_com',
            payload: req.body,
            status: 'Pending',
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        functions.logger.error('[OTA] booking.com webhook failed', error);
        res.status(401).json({ error: error.message || 'unauthorized' });
    }
});
exports.expediaReservationWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    try {
        assertOtaKey(req, 'EXPEDIA_PARTNER_KEY');
        const propertyId = String(req.query.propertyId || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.hotelId) || '').trim();
        if (!propertyId)
            throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
        const eventId = await recordOtaEvent(propertyId, 'expedia', 'reservation', req.body);
        await db.collection(`properties/${propertyId}/ota_reservations`).doc(eventId).set({
            id: eventId,
            source: 'expedia',
            payload: req.body,
            status: 'Pending',
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        functions.logger.error('[OTA] expedia webhook failed', error);
        res.status(401).json({ error: error.message || 'unauthorized' });
    }
});
exports.pushOtaAvailability = functions.https.onCall(async (data) => {
    var _a, _b;
    const { propertyId, channel, rooms = [], rates = [] } = data;
    if (!propertyId || !channel) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId and channel required');
    }
    const base = channel === 'booking_com'
        ? (process.env.BOOKING_COM_API_BASE || ((_a = functions.config().ota) === null || _a === void 0 ? void 0 : _a.booking_com_base))
        : (process.env.EXPEDIA_API_BASE || ((_b = functions.config().ota) === null || _b === void 0 ? void 0 : _b.expedia_base));
    const apiKey = channel === 'booking_com'
        ? getOtaKey('BOOKING_COM_PARTNER_KEY')
        : getOtaKey('EXPEDIA_PARTNER_KEY');
    if (!base || !apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'OTA endpoints not configured');
    }
    const payload = { propertyId, rooms, rates, timestamp: Date.now() };
    const resp = await fetch(`${base}/ari/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ota-key': apiKey },
        body: JSON.stringify(payload)
    });
    if (!resp.ok) {
        const text = await resp.text();
        functions.logger.error('[OTA] push failed', resp.status, text);
        throw new functions.https.HttpsError('internal', `OTA push failed: ${resp.status}`);
    }
    await recordOtaEvent(propertyId, channel, 'ari_push', payload);
    return { status: 'ok' };
});
// Re-export messaging callable/webhook
exports.sendGuestMessage = messaging.sendGuestMessage;
exports.twilioWebhook = messaging.twilioWebhook;
exports.api = apiGateway.api;
exports.createApiClient = apiGateway.createApiClient;
exports.issueApiToken = apiGateway.issueApiToken;
exports.ingestReviewWebhook = reviews.ingestReviewWebhook;
exports.draftReviewResponse = reviews.draftReviewResponse;
exports.syncReviews = reviews.syncReviews;
exports.reviewSyncJob = reviews.reviewSyncJob;
exports.postStaySurveyJob = reviews.postStaySurveyJob;
exports.fetchCompsetRates = revenue.fetchCompsetRates;
exports.syncDemandEvents = revenue.syncDemandEvents;
exports.publishRecommendedRates = revenue.publishRecommendedRates;
exports.rateAutomationJob = revenue.rateAutomationJob;
exports.analyzeRoomQuality = vision.analyzeRoomQuality;
// ────────────────────────────────────────────────────────────────────────────
// GDS INTEGRATIONS (Amadeus / Sabre)
// ────────────────────────────────────────────────────────────────────────────
const getGdsKey = (keyName) => {
    const envKey = process.env[keyName];
    const cfgKey = (functions.config().gds || {})[keyName.toLowerCase()];
    return envKey || cfgKey || null;
};
const assertGdsKey = (req, keyName) => {
    const provided = req.header('x-gds-key');
    const expected = getGdsKey(keyName);
    if (!expected || provided !== expected) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid GDS key');
    }
};
const recordGdsEvent = async (propertyId, source, kind, payload) => {
    const ref = db.collection(`properties/${propertyId}/gds_events`).doc();
    await ref.set({
        id: ref.id,
        source,
        kind,
        payload,
        createdAt: firestore_1.FieldValue.serverTimestamp()
    });
    return ref.id;
};
exports.amadeusReservationWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    try {
        assertGdsKey(req, 'AMADEUS_KEY');
        const propertyId = String(req.query.propertyId || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.hotelId) || '').trim();
        if (!propertyId)
            throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
        const eventId = await recordGdsEvent(propertyId, 'amadeus', 'reservation', req.body);
        await db.collection(`properties/${propertyId}/gds_reservations`).doc(eventId).set({
            id: eventId,
            source: 'amadeus',
            payload: req.body,
            status: 'Pending',
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        functions.logger.error('[GDS] Amadeus webhook failed', error);
        res.status(401).json({ error: error.message || 'unauthorized' });
    }
});
exports.sabreReservationWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    try {
        assertGdsKey(req, 'SABRE_KEY');
        const propertyId = String(req.query.propertyId || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.hotelId) || '').trim();
        if (!propertyId)
            throw new functions.https.HttpsError('invalid-argument', 'propertyId required');
        const eventId = await recordGdsEvent(propertyId, 'sabre', 'reservation', req.body);
        await db.collection(`properties/${propertyId}/gds_reservations`).doc(eventId).set({
            id: eventId,
            source: 'sabre',
            payload: req.body,
            status: 'Pending',
            createdAt: firestore_1.FieldValue.serverTimestamp()
        });
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        functions.logger.error('[GDS] Sabre webhook failed', error);
        res.status(401).json({ error: error.message || 'unauthorized' });
    }
});
exports.pushGdsAvailability = functions.https.onCall(async (data) => {
    var _a, _b;
    const { propertyId, channel, rooms = [], rates = [] } = data;
    if (!propertyId || !channel) {
        throw new functions.https.HttpsError('invalid-argument', 'propertyId and channel required');
    }
    const base = channel === 'amadeus'
        ? (process.env.AMADEUS_API_BASE || ((_a = functions.config().gds) === null || _a === void 0 ? void 0 : _a.amadeus_base))
        : (process.env.SABRE_API_BASE || ((_b = functions.config().gds) === null || _b === void 0 ? void 0 : _b.sabre_base));
    const apiKey = channel === 'amadeus' ? getGdsKey('AMADEUS_KEY') : getGdsKey('SABRE_KEY');
    if (!base || !apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'GDS endpoints not configured');
    }
    const payload = { propertyId, rooms, rates, timestamp: Date.now() };
    const resp = await fetch(`${base}/ari/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gds-key': apiKey },
        body: JSON.stringify(payload)
    });
    if (!resp.ok) {
        const text = await resp.text();
        functions.logger.error('[GDS] push failed', resp.status, text);
        throw new functions.https.HttpsError('internal', `GDS push failed: ${resp.status}`);
    }
    await recordGdsEvent(propertyId, channel, 'ari_push', payload);
    return { status: 'ok' };
});
//# sourceMappingURL=index.js.map