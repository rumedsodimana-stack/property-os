/**
 * GDS Integration Service (Amadeus / Sabre)
 *
 * Triggers ARI push to GDS adapters via Cloud Functions. Tenant is resolved client-side.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from '../kernel/firebase';
import { tenantService } from '../kernel/tenantService';

export type GdsChannel = 'amadeus' | 'sabre';

export interface GdsAvailabilityPayload {
  roomTypeId: string;
  date: string; // YYYY-MM-DD
  available: number;
}

export interface GdsRatePayload {
  ratePlanId: string;
  date: string;
  amount: number;
  currency: string;
}

export const gdsService = {
  async pushAvailabilityAndRates(channel: GdsChannel, rooms: GdsAvailabilityPayload[], rates: GdsRatePayload[]) {
    const propertyId = tenantService.getActivePropertyId();
    const callable = httpsCallable(functions, 'pushGdsAvailability');
    const result: any = await callable({ propertyId, channel, rooms, rates });
    return result.data;
  }
};
