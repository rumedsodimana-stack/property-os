import { Reservation, ReservationStatus } from '../../types';

export interface OTAChannel {
    id: string;
    name: string;
    icon: string;
    status: 'Connected' | 'Disconnected' | 'Syncing';
    lastSync?: number;
}

export interface OTAReservationPayload {
    externalId: string;
    channelId: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    totalPrice: number;
    currency: string;
}

class OTAAdapter {
    /**
     * Simulates pulling a reservation from an OTA (e.g. Booking.com)
     * and translating it into a Hotel Singularity Reservation object.
     */
    translatePayloadToReservation(payload: OTAReservationPayload): Reservation {
        const checkInTime = new Date(payload.checkIn).getTime();
        const checkOutTime = new Date(payload.checkOut).getTime();

        return {
            id: `res_ota_${payload.externalId}`,
            guestId: `guest_ext_${payload.externalId}`, // Mock guest ID
            propertyId: 'prop_01', // Default property
            roomId: '', // Unassigned initially
            roomTypeId: payload.roomType || 'rt_standard',
            checkIn: payload.checkIn,
            checkOut: payload.checkOut,
            adults: 2, // Mock default
            children: 0, // Mock default
            status: ReservationStatus.CONFIRMED,
            rateApplied: payload.totalPrice / Math.ceil((checkOutTime - checkInTime) / (1000 * 60 * 60 * 24)),
            noShowProbability: 0.05,
            paymentMethod: 'OTA Virtual Card',
            accompanyingGuests: [],
            folioId: `fol_ota_${payload.externalId}`,
            channel: payload.channelId,
            guaranteeType: 'CC',
            history: [{
                date: new Date().toISOString(),
                action: 'OTA Reservation Received',
                user: payload.channelId,
                details: `Imported from ${payload.channelId} via Channel Manager`
            }] as any // Cast to any until we fix the interface
        };
    }

    /**
     * Simulates pushing availability to an OTA.
     */
    async pushAvailability(channelId: string, roomTypeId: string, availability: number): Promise<boolean> {
        console.log(`[OTAAdapter] Pushing availability to ${channelId}: Room ${roomTypeId} => ${availability}`);
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 800));
        return true;
    }
}

export const otaAdapter = new OTAAdapter();
export default OTAAdapter;
