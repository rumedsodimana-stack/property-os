/**
 * Hotel Singularity OS — Setup Wizard Service
 *
 * Reads and writes the hotel's first-run setup progress from Firestore.
 * Consumed by HotelSetupWizard.tsx and OpsApp.tsx (to detect first-run state).
 */

import { getDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../kernel/firebase';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RoomType {
  id: string;
  name: string;             // e.g. "Standard King"
  code: string;             // short code e.g. "STK"
  description: string;
  baseRate: number;         // nightly rack rate in hotel currency
  maxOccupancy: number;
  bedType: string;          // e.g. "King", "Twin", "Double"
  count: number;            // number of rooms of this type
  amenities: string[];      // e.g. ["WiFi", "Sea View", "Balcony"]
}

export interface RatePlan {
  id: string;
  name: string;             // e.g. "Rack Rate", "Corporate", "OTA"
  code: string;             // short code
  description: string;
  modifier: number;         // % off rack rate: 0 = rack, -20 = 20% discount, +10 = 10% premium
  isPublic: boolean;        // visible to OTA channels
}

export interface ModuleToggle {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  icon: string;
}

export interface HotelSetupPayload {
  // Step 1 — Property Profile
  hotelName: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  starRating: number;        // 1–5
  checkInTime: string;       // "HH:MM"
  checkOutTime: string;
  taxRate: number;           // percentage
  serviceChargeRate: number; // percentage

  // Step 2 — Branding
  brandColor: string;        // hex
  tagline: string;
  logoUrl: string;           // URL (uploaded separately)

  // Step 3 — Room Types
  roomTypes: RoomType[];

  // Step 4 — Rate Plans
  ratePlans: RatePlan[];

  // Step 5 — Modules
  enabledModules: string[];  // array of module IDs that are ON
}

export interface SetupStatus {
  setupComplete: boolean;
  setupStep?: number;        // last saved step (for resume)
  setupStartedAt?: string;
  setupCompletedAt?: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_ROOM_TYPES: Omit<RoomType, 'id'>[] = [
  { name: 'Standard Room',   code: 'STD',   description: 'Comfortable standard room', baseRate: 150, maxOccupancy: 2, bedType: 'Double', count: 10, amenities: ['WiFi', 'TV', 'Air Conditioning'] },
  { name: 'Deluxe Room',     code: 'DLX',   description: 'Spacious deluxe room',       baseRate: 220, maxOccupancy: 2, bedType: 'King',   count: 8,  amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'] },
  { name: 'Junior Suite',    code: 'JSUI',  description: 'Junior suite with seating',  baseRate: 350, maxOccupancy: 3, bedType: 'King',   count: 4,  amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Sofa'] },
];

export const DEFAULT_RATE_PLANS: Omit<RatePlan, 'id'>[] = [
  { name: 'Rack Rate',    code: 'RACK',  description: 'Standard published rate',   modifier: 0,   isPublic: true  },
  { name: 'Corporate',    code: 'CORP',  description: 'Corporate contracted rate', modifier: -15, isPublic: false },
  { name: 'OTA Rate',     code: 'OTA',   description: 'Online travel agency rate', modifier: -10, isPublic: true  },
  { name: 'Package Deal', code: 'PKG',   description: 'Inclusive package rate',    modifier: 5,   isPublic: true  },
];

export const ALL_MODULES_TOGGLEABLE: ModuleToggle[] = [
  { id: 'pms',           name: 'Property Management (PMS)', enabled: true,  icon: '🏨', description: 'Reservations, front desk, housekeeping' },
  { id: 'pos',           name: 'Point of Sale (POS)',       enabled: true,  icon: '🍽️', description: 'Restaurant, bar, room service billing' },
  { id: 'crm',           name: 'CRM & Guest Profiles',      enabled: true,  icon: '👥', description: 'Guest history, loyalty, preferences' },
  { id: 'finance',       name: 'Finance & Accounting',      enabled: true,  icon: '💰', description: 'P&L, ledgers, night audit' },
  { id: 'hr',            name: 'Human Resources (HCM)',     enabled: true,  icon: '🧑‍💼', description: 'Staff, shifts, payroll, leave' },
  { id: 'procurement',   name: 'Procurement',               enabled: true,  icon: '📦', description: 'Purchase orders, inventory, suppliers' },
  { id: 'engineering',   name: 'Engineering & Maintenance', enabled: true,  icon: '🔧', description: 'Work orders, preventive maintenance' },
  { id: 'security',      name: 'Security Console',          enabled: true,  icon: '🔒', description: 'Incident logs, key management' },
  { id: 'events',        name: 'Events & Banqueting',       enabled: true,  icon: '🎪', description: 'Event bookings, BEO management' },
  { id: 'recreation',    name: 'Recreation & Wellness',     enabled: false, icon: '🏊', description: 'Spa, gym, activities booking' },
  { id: 'reputation',    name: 'Reputation Management',     enabled: true,  icon: '⭐', description: 'Reviews, ratings, response management' },
  { id: 'communication', name: 'Communication Hub',         enabled: true,  icon: '💬', description: 'Internal messaging, guest WhatsApp' },
  { id: 'iot',           name: 'IoT Control Center',        enabled: false, icon: '📡', description: 'Smart room controls, energy management' },
  { id: 'ai',            name: 'AI Command Center',         enabled: true,  icon: '🤖', description: 'AI insights, forecasting, automation' },
  { id: 'channel',       name: 'Channel Manager',           enabled: true,  icon: '🌐', description: 'OTA distribution, rate parity' },
  { id: 'brand',         name: 'Brand Standards',           enabled: false, icon: '🎨', description: 'Brand documents, SOPs, compliance' },
];

// ─── Service ──────────────────────────────────────────────────────────────────

/** Check if a hotel has completed its initial setup wizard. */
export async function getSetupStatus(hotelId: string): Promise<SetupStatus> {
  try {
    const snap = await getDoc(doc(db, `hotels/${hotelId}/settings/general`));
    if (!snap.exists()) return { setupComplete: false };
    const data = snap.data();
    return {
      setupComplete:    data.setupComplete === true,
      setupStep:        data.setupStep     ?? 1,
      setupStartedAt:   data.setupStartedAt?.toDate?.()?.toISOString(),
      setupCompletedAt: data.setupCompletedAt?.toDate?.()?.toISOString(),
    };
  } catch {
    // If we can't read Firestore, don't block the app — assume setup is complete
    return { setupComplete: true };
  }
}

/** Save in-progress wizard state so the GM can resume later. */
export async function saveSetupProgress(hotelId: string, step: number): Promise<void> {
  await setDoc(
    doc(db, `hotels/${hotelId}/settings/general`),
    { setupStep: step, setupStartedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Called when the GM submits the final step — writes all config and marks complete. */
export async function completeSetupWizard(
  hotelId: string,
  payload: HotelSetupPayload,
): Promise<void> {
  const _complete = httpsCallable<{ hotelId: string; payload: HotelSetupPayload }, { success: boolean }>(
    functions, 'completeHotelSetup',
  );
  await _complete({ hotelId, payload });
}

/** Generate a short ID for room types / rate plans */
export function makeId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Seed fresh room types from defaults */
export function seedRoomTypes(): RoomType[] {
  return DEFAULT_ROOM_TYPES.map(rt => ({ ...rt, id: makeId('rt') }));
}

/** Seed fresh rate plans from defaults */
export function seedRatePlans(): RatePlan[] {
  return DEFAULT_RATE_PLANS.map(rp => ({ ...rp, id: makeId('rp') }));
}
