import { Reservation, ReservationStatus } from '../../types';
import { addItem } from '../kernel/firestoreService';
import { CURRENT_PROPERTY } from '../kernel/config';

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
}

export interface BookingResult {
    success: boolean;
    reservation?: Reservation;
    guestId?: string;
    error?: string;
}

/**
 * Calculate number of nights between check-in and check-out
 */
const calculateNights = (checkIn: Date, checkOut: Date): number => {
    const oneDay = 1000 * 60 * 60 * 24;
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / oneDay);
};

/**
 * Generate unique guest ID
 */
const generateGuestId = (): string => {
    return `GUEST${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

/**
 * Generate unique reservation ID
 */
const generateReservationId = (): string => {
    return `RES${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

/**
 * Generate unique folio ID
 */
const generateFolioId = (): string => {
    return `FOL${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

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
    guestId: string
): Promise<Reservation> => {
    const reservationId = generateReservationId();
    const nights = calculateNights(bookingRequest.checkIn, bookingRequest.checkOut);
    const total = nights * bookingRequest.ratePerNight;

    // Create folio first
    const folioId = await createFolio(reservationId);

    const reservation: Reservation = {
        id: reservationId,
        guestId,
        propertyId: CURRENT_PROPERTY.id,
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

        // Step 2: Create reservation
        const reservation = await createReservation(bookingRequest, guest.id);

        // Step 3: Send confirmation (mock)
        sendConfirmationEmail(reservation, guest, bookingRequest);

        const nights = calculateNights(bookingRequest.checkIn, bookingRequest.checkOut);
        const total = nights * bookingRequest.ratePerNight;

        console.log('[Booking] ✅ Booking completed successfully');
        console.log('[Booking] Guest:', guest.fullName);
        console.log('[Booking] Reservation:', reservation.id);
        console.log('[Booking] Check-in:', new Date(reservation.checkIn).toLocaleDateString());
        console.log('[Booking] Total:', `${CURRENT_PROPERTY.currency} ${total.toFixed(2)}`);

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
        errors.push('Guest name is required');
    }

    if (!request.guestEmail || !request.guestEmail.includes('@')) {
        errors.push('Valid email is required');
    }

    if (!request.guestPhone || request.guestPhone.length < 10) {
        errors.push('Valid phone number is required');
    }

    if (!request.checkIn || !request.checkOut) {
        errors.push('Check-in and check-out dates are required');
    }

    if (request.checkIn && request.checkOut && request.checkIn >= request.checkOut) {
        errors.push('Check-out must be after check-in');
    }

    if (!request.adults || request.adults < 1) {
        errors.push('At least one adult is required');
    }

    if (!request.roomTypeId) {
        errors.push('Room type must be selected');
    }

    return errors;
};
