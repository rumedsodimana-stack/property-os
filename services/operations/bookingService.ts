import { Reservation, ReservationStatus } from '../../types';
import { addItem } from '../kernel/firestoreService';
import { CURRENT_PROPERTY } from '../kernel/config';
import { tenantService } from '../kernel/tenantService';
import { pipeline } from '../intelligence/smartDataPipeline';
import { validateEmail, validatePhone, calculateNights } from '../../src/utils/shared';
import { VALIDATION_MESSAGES } from '../../src/config/messages';

export interface BookingRequest {
    roomTypeId: string;
    roomTypeName: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children: number;
    specialRequests?: string;
    ratePerNight: number;
    paymentIntentId?: string;
    paymentCustomerId?: string;
}

export interface BookingResult {
    success: boolean;
    reservation?: Reservation;
    guestId?: string;
    error?: string;
}

/**
 * Generate a collision-resistant ID using crypto.randomUUID() with a prefix.
 * Falls back to a longer random string if crypto is unavailable.
 */
const generateId = (prefix: string): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${prefix}${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
    }
    // Fallback: timestamp + 9 random chars (safe in environments without SubtleCrypto)
    const rand = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `${prefix}${Date.now()}${rand}`;
};

/**
 * Generate unique guest ID
 */
const generateGuestId = (): string => generateId('GUEST');

/**
 * Generate unique reservation ID
 */
const generateReservationId = (): string => generateId('RES');

/**
 * Generate unique folio ID
 */
const generateFolioId = (): string => generateId('FOL');

/**
 * Create guest profile
 */
export const createGuestProfile = async (bookingRequest: BookingRequest) => {
    const guestId = generateGuestId();

    const guestData = {
        fullName: bookingRequest.guestName,
        email: bookingRequest.guestEmail,
        phone: bookingRequest.guestPhone,
        createdAt: new Date().toISOString(),
        notes: bookingRequest.specialRequests || ''
    };

    try {
        await addItem('guests', guestData);
        console.log('[Booking] Guest profile created:', guestId);
        return { id: guestId, ...guestData };
    } catch (error) {
        console.error('[Booking] Error creating guest:', error);
        throw error;
    }
};

/**
 * Create folio for reservation
 */
const createFolio = async (reservationId: string) => {
    const folioId = generateFolioId();

    const folioData = {
        id: folioId,
        reservationId,
        charges: [],
        balance: 0,
        status: 'Open' as const
    };

    try {
        await addItem('folios', folioData);
        console.log('[Booking] Folio created:', folioId);
        return folioId;
    } catch (error) {
        console.error('[Booking] Error creating folio:', error);
        throw error;
    }
};

/**
 * Create reservation
 */
export const createReservation = async (
    bookingRequest: BookingRequest,
    guestId: string,
    paymentIntentId?: string
): Promise<Reservation> => {
    const propertyId = tenantService.getActivePropertyId();
    const reservationId = generateReservationId();
    const nights = calculateNights(bookingRequest.checkIn, bookingRequest.checkOut);

    // Create folio first
    const folioId = await createFolio(reservationId);

    const reservation: Reservation = {
        id: reservationId,
        guestId,
        propertyId,
        roomId: '', // Assigned at check-in by front desk
        roomTypeId: bookingRequest.roomTypeId,
        checkIn: bookingRequest.checkIn.toISOString(),
        checkOut: bookingRequest.checkOut.toISOString(),
        status: ReservationStatus.CONFIRMED,
        adults: bookingRequest.adults,
        children: bookingRequest.children || 0,
        folioId,
        rateApplied: bookingRequest.ratePerNight,
        noShowProbability: 0.1,
        paymentMethod: 'Credit Card',
        paymentIntentId: paymentIntentId || bookingRequest.paymentIntentId || null,
        paymentCustomerId: bookingRequest.paymentCustomerId || null,
        accompanyingGuests: []
    };

    try {
        await addItem('reservations', reservation);
        console.log('[Booking] Reservation created:', reservationId);
        return reservation;
    } catch (error) {
        console.error('[Booking] Error creating reservation:', error);
        throw error;
    }
};

/**
 * Complete booking process
 */
export const completeBooking = async (bookingRequest: BookingRequest): Promise<BookingResult> => {
    try {
        // Step 1: Create guest profile
        const guest = await createGuestProfile(bookingRequest);

        // Step 2: Create reservation (include paymentIntentId for audit trail)
        const reservation = await createReservation(bookingRequest, guest.id, bookingRequest.paymentIntentId);

        // Step 3: Send confirmation (mock)
        sendConfirmationEmail(reservation, guest, bookingRequest);

        const nights = calculateNights(bookingRequest.checkIn, bookingRequest.checkOut);
        const total = nights * bookingRequest.ratePerNight;

        console.log('[Booking] ✅ Booking completed successfully');
        console.log('[Booking] Guest:', guest.fullName);
        console.log('[Booking] Reservation:', reservation.id);
        console.log('[Booking] Check-in:', new Date(reservation.checkIn).toLocaleDateString());
        console.log('[Booking] Total:', `${CURRENT_PROPERTY.currency} ${total.toFixed(2)}`);

        // Emit pipeline event — triggers AI analysis asynchronously (non-blocking)
        pipeline.emit({
            type: 'reservation',
            payload: {
                reservationId: reservation.id,
                guestName: guest.fullName,
                roomType: bookingRequest.roomTypeName,
                amount: total,
                checkIn: reservation.checkIn,
                checkOut: reservation.checkOut,
            },
            module: 'front_desk',
            timestamp: Date.now(),
        });

        return {
            success: true,
            reservation,
            guestId: guest.id
        };
    } catch (error: any) {
        console.error('[Booking] ❌ Booking failed:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred'
        };
    }
};

/**
 * Send confirmation email (mock)
 */
export const sendConfirmationEmail = (reservation: Reservation, guest: any, bookingRequest: BookingRequest): void => {
    const nights = calculateNights(new Date(reservation.checkIn), new Date(reservation.checkOut));
    const total = nights * reservation.rateApplied;

    console.log('\n📧 CONFIRMATION EMAIL');
    console.log('════════════════════════════════════════');
    console.log(`To: ${guest.email}`);
    console.log(`Subject: Reservation Confirmed - ${reservation.id}`);
    console.log('────────────────────────────────────────');
    console.log(`Dear ${guest.fullName},`);
    console.log('');
    console.log('Thank you for your booking at Hotel Singularity!');
    console.log('');
    console.log('RESERVATION DETAILS:');
    console.log(`  Confirmation #: ${reservation.id}`);
    console.log(`  Check-in: ${new Date(reservation.checkIn).toLocaleDateString()}`);
    console.log(`  Check-out: ${new Date(reservation.checkOut).toLocaleDateString()}`);
    console.log(`  Room Type: ${bookingRequest.roomTypeName}`);
    console.log(`  Guests: ${reservation.adults} adult(s), ${reservation.children} child(ren)`);
    console.log(`  Rate: ${CURRENT_PROPERTY.currency} ${reservation.rateApplied}/night`);
    console.log(`  Total: ${CURRENT_PROPERTY.currency} ${total.toFixed(2)}`);
    if (bookingRequest.specialRequests) {
        console.log(`  Special Requests: ${bookingRequest.specialRequests}`);
    }
    console.log('');
    console.log('We look forward to welcoming you!');
    console.log('════════════════════════════════════════\n');
};

/**
 * Validate booking request
 */
export const validateBookingRequest = (request: Partial<BookingRequest>): string[] => {
    const errors: string[] = [];

    if (!request.guestName || request.guestName.trim().length < 2) {
        errors.push(VALIDATION_MESSAGES.guestNameRequired);
    }

    if (!request.guestEmail || !validateEmail(request.guestEmail)) {
        errors.push(VALIDATION_MESSAGES.validEmailRequired);
    }

    if (!request.guestPhone || !validatePhone(request.guestPhone)) {
        errors.push(VALIDATION_MESSAGES.validPhoneRequired);
    }

    if (!request.checkIn || !request.checkOut) {
        errors.push(VALIDATION_MESSAGES.checkInCheckOutRequired);
    }

    if (request.checkIn && request.checkOut && request.checkIn >= request.checkOut) {
        errors.push(VALIDATION_MESSAGES.checkOutAfterCheckIn);
    }

    if (!request.adults || request.adults < 1) {
        errors.push(VALIDATION_MESSAGES.adultsRequired);
    }

    if (!request.roomTypeId) {
        errors.push(VALIDATION_MESSAGES.roomTypeRequired);
    }

    return errors;
};
