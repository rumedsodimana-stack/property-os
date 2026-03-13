"use strict";
/**
 * Hotel Singularity OS — Hotel Setup Wizard Cloud Function
 *
 * completeHotelSetup — Callable
 *
 * Called when the GM finishes the first-run setup wizard.
 * Atomically writes all configuration into Firestore and marks the hotel as configured.
 *
 * Writes:
 *   hotels/{hotelId}/settings/general        — property profile + branding + flags
 *   hotels/{hotelId}/room_types/{id}          — one doc per room type
 *   hotels/{hotelId}/rate_plans/{id}          — one doc per rate plan
 *   hotels/{hotelId}/settings/modules         — enabled/disabled module map
 *   hotel_registry/{hotelId}                  — updates hotel name / status
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeHotelSetup = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const db = admin.firestore();
// ─── Validation ───────────────────────────────────────────────────────────────
function validatePayload(p) {
    var _a, _b, _c, _d;
    if (!((_a = p.hotelName) === null || _a === void 0 ? void 0 : _a.trim()))
        throw new functions.https.HttpsError('invalid-argument', 'hotelName is required');
    if (!((_b = p.address) === null || _b === void 0 ? void 0 : _b.trim()))
        throw new functions.https.HttpsError('invalid-argument', 'address is required');
    if (!((_c = p.city) === null || _c === void 0 ? void 0 : _c.trim()))
        throw new functions.https.HttpsError('invalid-argument', 'city is required');
    if (!((_d = p.phone) === null || _d === void 0 ? void 0 : _d.trim()))
        throw new functions.https.HttpsError('invalid-argument', 'phone is required');
    if (!Array.isArray(p.roomTypes) || p.roomTypes.length === 0)
        throw new functions.https.HttpsError('invalid-argument', 'At least one room type is required');
    if (!Array.isArray(p.ratePlans))
        throw new functions.https.HttpsError('invalid-argument', 'ratePlans must be an array');
    if (!Array.isArray(p.enabledModules))
        throw new functions.https.HttpsError('invalid-argument', 'enabledModules must be an array');
}
// ─── Cloud Function ───────────────────────────────────────────────────────────
exports.completeHotelSetup = functions
    .runWith({ timeoutSeconds: 60, memory: '256MB' })
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    // Auth check — must be signed in as GM for this hotel
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }
    const claims = context.auth.token;
    const role = String((_a = claims.role) !== null && _a !== void 0 ? _a : '');
    const hotelId = String((_b = claims.hotelId) !== null && _b !== void 0 ? _b : '');
    const { hotelId: targetHotelId, payload } = data;
    if (!targetHotelId)
        throw new functions.https.HttpsError('invalid-argument', 'hotelId is required');
    // Only GMs can complete setup, and only for their own hotel
    if (role !== 'GM') {
        throw new functions.https.HttpsError('permission-denied', 'Only the General Manager can complete hotel setup');
    }
    if (hotelId !== targetHotelId) {
        throw new functions.https.HttpsError('permission-denied', 'Cross-hotel setup not permitted');
    }
    validatePayload(payload);
    const now = firestore_1.FieldValue.serverTimestamp();
    const batch = db.batch();
    // ── 1. Update settings/general ───────────────────────────────────────────
    const settingsRef = db.doc(`hotels/${targetHotelId}/settings/general`);
    batch.set(settingsRef, {
        // Property profile
        hotelName: payload.hotelName.trim(),
        address: payload.address.trim(),
        city: payload.city.trim(),
        phone: payload.phone.trim(),
        website: (_d = (_c = payload.website) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : '',
        starRating: (_e = payload.starRating) !== null && _e !== void 0 ? _e : 4,
        checkInTime: (_f = payload.checkInTime) !== null && _f !== void 0 ? _f : '14:00',
        checkOutTime: (_g = payload.checkOutTime) !== null && _g !== void 0 ? _g : '12:00',
        taxRate: (_h = payload.taxRate) !== null && _h !== void 0 ? _h : 0,
        serviceChargeRate: (_j = payload.serviceChargeRate) !== null && _j !== void 0 ? _j : 0,
        // Branding
        brandColor: (_k = payload.brandColor) !== null && _k !== void 0 ? _k : '#6366f1',
        tagline: (_m = (_l = payload.tagline) === null || _l === void 0 ? void 0 : _l.trim()) !== null && _m !== void 0 ? _m : '',
        logoUrl: (_o = payload.logoUrl) !== null && _o !== void 0 ? _o : '',
        // Setup completion flags
        setupComplete: true,
        setupCompletedAt: now,
        updatedAt: now,
    }, { merge: true });
    // ── 2. Write room types ──────────────────────────────────────────────────
    // Write to both hotels/ (legacy/admin) AND properties/ (ops app reads from here).
    const existingRooms = await db.collection(`hotels/${targetHotelId}/room_types`).get();
    existingRooms.docs.forEach(d => {
        if (d.id !== '_meta')
            batch.delete(d.ref);
    });
    const existingPropRooms = await db.collection(`properties/${targetHotelId}/room_types`).get();
    existingPropRooms.docs.forEach(d => {
        if (d.id !== '_meta')
            batch.delete(d.ref);
    });
    payload.roomTypes.forEach(rt => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!((_a = rt.name) === null || _a === void 0 ? void 0 : _a.trim()))
            return;
        const roomData = {
            id: rt.id,
            name: rt.name.trim(),
            code: rt.code.trim().toUpperCase(),
            description: (_c = (_b = rt.description) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '',
            baseRate: (_d = rt.baseRate) !== null && _d !== void 0 ? _d : 0,
            maxOccupancy: (_e = rt.maxOccupancy) !== null && _e !== void 0 ? _e : 2,
            bedType: (_f = rt.bedType) !== null && _f !== void 0 ? _f : 'Double',
            count: (_g = rt.count) !== null && _g !== void 0 ? _g : 1,
            amenities: (_h = rt.amenities) !== null && _h !== void 0 ? _h : [],
            createdAt: now,
            updatedAt: now,
        };
        batch.set(db.collection(`hotels/${targetHotelId}/room_types`).doc(rt.id), roomData);
        batch.set(db.collection(`properties/${targetHotelId}/room_types`).doc(rt.id), roomData);
    });
    // ── 3. Write rate plans ──────────────────────────────────────────────────
    // Write to both hotels/ (legacy/admin) AND properties/ (ops app reads from here).
    const existingRates = await db.collection(`hotels/${targetHotelId}/rate_plans`).get();
    existingRates.docs.forEach(d => batch.delete(d.ref));
    const existingPropRates = await db.collection(`properties/${targetHotelId}/rate_plans`).get();
    existingPropRates.docs.forEach(d => batch.delete(d.ref));
    payload.ratePlans.forEach(rp => {
        var _a, _b, _c, _d, _e;
        if (!((_a = rp.name) === null || _a === void 0 ? void 0 : _a.trim()))
            return;
        const ratePlanData = {
            id: rp.id,
            name: rp.name.trim(),
            code: rp.code.trim().toUpperCase(),
            description: (_c = (_b = rp.description) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '',
            modifier: (_d = rp.modifier) !== null && _d !== void 0 ? _d : 0,
            isPublic: (_e = rp.isPublic) !== null && _e !== void 0 ? _e : true,
            createdAt: now,
            updatedAt: now,
        };
        batch.set(db.collection(`hotels/${targetHotelId}/rate_plans`).doc(rp.id), ratePlanData);
        batch.set(db.collection(`properties/${targetHotelId}/rate_plans`).doc(rp.id), ratePlanData);
    });
    // ── 4. Write module config ───────────────────────────────────────────────
    const modulesRef = db.doc(`hotels/${targetHotelId}/settings/modules`);
    const moduleMap = {};
    payload.enabledModules.forEach(id => { moduleMap[id] = true; });
    batch.set(modulesRef, Object.assign(Object.assign({}, moduleMap), { updatedAt: now }), { merge: true });
    // ── 5. Update hotel_registry AND properties/{hotelId} root doc ───────────
    const registryRef = db.collection('hotel_registry').doc(targetHotelId);
    batch.set(registryRef, {
        name: payload.hotelName.trim(),
        city: payload.city.trim(),
        phone: payload.phone.trim(),
        setupComplete: true,
        updatedAt: now,
    }, { merge: true });
    // Keep the properties/ root doc in sync so the ops app (and CURRENT_PROPERTY
    // getters) always reflect the latest hotel name / contact / operational settings.
    const propRootRef = db.collection('properties').doc(targetHotelId);
    batch.set(propRootRef, {
        name: payload.hotelName.trim(),
        address: payload.address.trim(),
        city: payload.city.trim(),
        phone: payload.phone.trim(),
        website: (_q = (_p = payload.website) === null || _p === void 0 ? void 0 : _p.trim()) !== null && _q !== void 0 ? _q : '',
        taxRate: (_r = payload.taxRate) !== null && _r !== void 0 ? _r : 0,
        checkInTime: (_s = payload.checkInTime) !== null && _s !== void 0 ? _s : '14:00',
        checkOutTime: (_t = payload.checkOutTime) !== null && _t !== void 0 ? _t : '12:00',
        setupComplete: true,
        updatedAt: now,
    }, { merge: true });
    // ── 6. Commit ─────────────────────────────────────────────────────────────
    await batch.commit();
    // ── 7. Log activity ───────────────────────────────────────────────────────
    await db.collection(`hotels/${targetHotelId}/activity`).add({
        type: 'hotel_setup_completed',
        actorUid: context.auth.uid,
        description: `Hotel setup wizard completed by GM. ${payload.roomTypes.length} room type(s), ${payload.ratePlans.length} rate plan(s), ${payload.enabledModules.length} module(s) enabled.`,
        createdAt: now,
    });
    functions.logger.info('[SetupWizard] Hotel setup completed', {
        hotelId: targetHotelId,
        roomTypes: payload.roomTypes.length,
        ratePlans: payload.ratePlans.length,
        enabledModules: payload.enabledModules.length,
    });
    return { success: true, message: 'Hotel setup completed successfully.' };
});
//# sourceMappingURL=setupWizard.js.map