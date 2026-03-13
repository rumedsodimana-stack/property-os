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

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

// ─── Types (mirror frontend types) ────────────────────────────────────────────

interface RoomType {
  id: string;
  name: string;
  code: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  bedType: string;
  count: number;
  amenities: string[];
}

interface RatePlan {
  id: string;
  name: string;
  code: string;
  description: string;
  modifier: number;
  isPublic: boolean;
}

interface HotelSetupPayload {
  hotelName: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  starRating: number;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  serviceChargeRate: number;
  brandColor: string;
  tagline: string;
  logoUrl: string;
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  enabledModules: string[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validatePayload(p: Partial<HotelSetupPayload>): asserts p is HotelSetupPayload {
  if (!p.hotelName?.trim()) throw new functions.https.HttpsError('invalid-argument', 'hotelName is required');
  if (!p.address?.trim())   throw new functions.https.HttpsError('invalid-argument', 'address is required');
  if (!p.city?.trim())      throw new functions.https.HttpsError('invalid-argument', 'city is required');
  if (!p.phone?.trim())     throw new functions.https.HttpsError('invalid-argument', 'phone is required');
  if (!Array.isArray(p.roomTypes) || p.roomTypes.length === 0)
    throw new functions.https.HttpsError('invalid-argument', 'At least one room type is required');
  if (!Array.isArray(p.ratePlans))
    throw new functions.https.HttpsError('invalid-argument', 'ratePlans must be an array');
  if (!Array.isArray(p.enabledModules))
    throw new functions.https.HttpsError('invalid-argument', 'enabledModules must be an array');
}

// ─── Cloud Function ───────────────────────────────────────────────────────────

export const completeHotelSetup = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (data: { hotelId: string; payload: Partial<HotelSetupPayload> }, context) => {

    // Auth check — must be signed in as GM for this hotel
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
    }

    const claims  = context.auth.token as Record<string, unknown>;
    const role    = String(claims.role    ?? '');
    const hotelId = String(claims.hotelId ?? '');

    const { hotelId: targetHotelId, payload } = data;

    if (!targetHotelId) throw new functions.https.HttpsError('invalid-argument', 'hotelId is required');

    // Only GMs can complete setup, and only for their own hotel
    if (role !== 'GM') {
      throw new functions.https.HttpsError('permission-denied', 'Only the General Manager can complete hotel setup');
    }
    if (hotelId !== targetHotelId) {
      throw new functions.https.HttpsError('permission-denied', 'Cross-hotel setup not permitted');
    }

    validatePayload(payload);

    const now     = FieldValue.serverTimestamp();
    const batch   = db.batch();

    // ── 1. Update settings/general ───────────────────────────────────────────
    const settingsRef = db.doc(`hotels/${targetHotelId}/settings/general`);
    batch.set(settingsRef, {
      // Property profile
      hotelName:         payload.hotelName.trim(),
      address:           payload.address.trim(),
      city:              payload.city.trim(),
      phone:             payload.phone.trim(),
      website:           payload.website?.trim() ?? '',
      starRating:        payload.starRating ?? 4,
      checkInTime:       payload.checkInTime  ?? '14:00',
      checkOutTime:      payload.checkOutTime ?? '12:00',
      taxRate:           payload.taxRate ?? 0,
      serviceChargeRate: payload.serviceChargeRate ?? 0,

      // Branding
      brandColor: payload.brandColor ?? '#6366f1',
      tagline:    payload.tagline?.trim() ?? '',
      logoUrl:    payload.logoUrl ?? '',

      // Setup completion flags
      setupComplete:    true,
      setupCompletedAt: now,
      updatedAt:        now,
    }, { merge: true });

    // ── 2. Write room types ──────────────────────────────────────────────────
    // Write to both hotels/ (legacy/admin) AND properties/ (ops app reads from here).
    const existingRooms = await db.collection(`hotels/${targetHotelId}/room_types`).get();
    existingRooms.docs.forEach(d => {
      if (d.id !== '_meta') batch.delete(d.ref);
    });
    const existingPropRooms = await db.collection(`properties/${targetHotelId}/room_types`).get();
    existingPropRooms.docs.forEach(d => {
      if (d.id !== '_meta') batch.delete(d.ref);
    });

    payload.roomTypes.forEach(rt => {
      if (!rt.name?.trim()) return;
      const roomData = {
        id:           rt.id,
        name:         rt.name.trim(),
        code:         rt.code.trim().toUpperCase(),
        description:  rt.description?.trim() ?? '',
        baseRate:     rt.baseRate ?? 0,
        maxOccupancy: rt.maxOccupancy ?? 2,
        bedType:      rt.bedType ?? 'Double',
        count:        rt.count ?? 1,
        amenities:    rt.amenities ?? [],
        createdAt:    now,
        updatedAt:    now,
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
      if (!rp.name?.trim()) return;
      const ratePlanData = {
        id:          rp.id,
        name:        rp.name.trim(),
        code:        rp.code.trim().toUpperCase(),
        description: rp.description?.trim() ?? '',
        modifier:    rp.modifier ?? 0,
        isPublic:    rp.isPublic ?? true,
        createdAt:   now,
        updatedAt:   now,
      };
      batch.set(db.collection(`hotels/${targetHotelId}/rate_plans`).doc(rp.id), ratePlanData);
      batch.set(db.collection(`properties/${targetHotelId}/rate_plans`).doc(rp.id), ratePlanData);
    });

    // ── 4. Write module config ───────────────────────────────────────────────
    const modulesRef = db.doc(`hotels/${targetHotelId}/settings/modules`);
    const moduleMap: Record<string, boolean> = {};
    payload.enabledModules.forEach(id => { moduleMap[id] = true; });
    batch.set(modulesRef, { ...moduleMap, updatedAt: now }, { merge: true });

    // ── 5. Update hotel_registry AND properties/{hotelId} root doc ───────────
    const registryRef = db.collection('hotel_registry').doc(targetHotelId);
    batch.set(registryRef, {
      name:      payload.hotelName.trim(),
      city:      payload.city.trim(),
      phone:     payload.phone.trim(),
      setupComplete: true,
      updatedAt: now,
    }, { merge: true });

    // Keep the properties/ root doc in sync so the ops app (and CURRENT_PROPERTY
    // getters) always reflect the latest hotel name / contact / operational settings.
    const propRootRef = db.collection('properties').doc(targetHotelId);
    batch.set(propRootRef, {
      name:          payload.hotelName.trim(),
      address:       payload.address.trim(),
      city:          payload.city.trim(),
      phone:         payload.phone.trim(),
      website:       payload.website?.trim() ?? '',
      taxRate:       payload.taxRate ?? 0,
      checkInTime:   payload.checkInTime  ?? '14:00',
      checkOutTime:  payload.checkOutTime ?? '12:00',
      setupComplete: true,
      updatedAt:     now,
    }, { merge: true });

    // ── 6. Commit ─────────────────────────────────────────────────────────────
    await batch.commit();

    // ── 7. Log activity ───────────────────────────────────────────────────────
    await db.collection(`hotels/${targetHotelId}/activity`).add({
      type:        'hotel_setup_completed',
      actorUid:    context.auth.uid,
      description: `Hotel setup wizard completed by GM. ${payload.roomTypes.length} room type(s), ${payload.ratePlans.length} rate plan(s), ${payload.enabledModules.length} module(s) enabled.`,
      createdAt:   now,
    });

    functions.logger.info('[SetupWizard] Hotel setup completed', {
      hotelId: targetHotelId,
      roomTypes: payload.roomTypes.length,
      ratePlans: payload.ratePlans.length,
      enabledModules: payload.enabledModules.length,
    });

    return { success: true, message: 'Hotel setup completed successfully.' };
  });
