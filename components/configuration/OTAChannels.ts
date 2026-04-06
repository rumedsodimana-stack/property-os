import { OTAChannel } from '../../services/operations/otaAdapter';

/**
 * Central configuration for OTA channel integrations.
 * Add, remove, or modify entries here – no code changes required elsewhere.
 */
export const OTA_CHANNELS: OTAChannel[] = [
    {
        id: 'travelbook',
        name: 'TravelBook ✦ Native',
        icon: 'https://raw.githubusercontent.com/rumedsodimana-stack/travelbook/master/public/favicon.ico',
        status: 'Connected',
        lastSync: Date.now(),
    },
    {
        id: 'booking',
        name: 'Booking.com',
        icon: 'https://cdn.worldvectorlogo.com/logos/bookingcom-1.svg',
        status: 'Connected',
        lastSync: Date.now(),
    },
    {
        id: 'expedia',
        name: 'Expedia',
        icon: 'https://cdn.worldvectorlogo.com/logos/expedia-2.svg',
        status: 'Connected',
        lastSync: Date.now(),
    },
    {
        id: 'airbnb',
        name: 'Airbnb',
        icon: 'https://cdn.worldvectorlogo.com/logos/airbnb-2.svg',
        status: 'Disconnected',
    },
];
