/**
 * OTA Integration Service (Booking.com / Expedia)
 *
 * Triggers OTA ARI push via Cloud Functions. Tenant is resolved client-side.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from '../kernel/firebase';
import { tenantService } from '../kernel/tenantService';

export type OtaChannel = 'booking_com' | 'expedia';

export interface OtaRoomAvailability {
  roomId: string;
  date: string; // YYYY-MM-DD
  available: number;
}

export interface OtaRatePrice {
  ratePlanId: string;
  date: string;
  amount: number;
  currency: string;
}

export const otaService = {
  async pushAvailabilityAndRates(channel: OtaChannel, rooms: OtaRoomAvailability[], rates: OtaRatePrice[]) {
    const propertyId = tenantService.getActivePropertyId();
    const callable = httpsCallable(functions, 'pushOtaAvailability');
    const result: any = await callable({ propertyId, channel, rooms, rates });
    return result.data;
  }
};
