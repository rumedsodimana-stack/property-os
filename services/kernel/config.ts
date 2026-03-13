import { RoomType } from '../../types';

// Unsplash image URLs (inlined to avoid import resolution issues in production)
const UNSPLASH = {
  superior: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  deluxe: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  executive: "https://images.unsplash.com/photo-1582719478250-c89cae4df85b?auto=format&fit=crop&w=800&q=80",
} as const;

// ─── Dynamic Property Config Reader ───────────────────────────────────────────
// Reads from the same `property_config` localStorage key that persistence.ts
// manages via savePropertyConfig / getPropertyConfig.  All getters are live so
// every access returns the most recently saved hotel values — no stale demo data.
const PROPERTY_CONFIG_LS_KEY = 'property_config';
function readPropConfig<T>(path: string[], fallback: T): T {
    try {
        const stored = typeof localStorage !== 'undefined'
            ? localStorage.getItem(PROPERTY_CONFIG_LS_KEY)
            : null;
        if (!stored) return fallback;
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = path.reduce((obj: any, key) => obj?.[key], parsed);
        return (value ?? fallback) as T;
    } catch {
        return fallback;
    }
}

/**
 * CURRENT_PROPERTY — all fields are ES5 getters so they return the enrolled
 * hotel's live values (hydrated into localStorage on login by AuthContext).
 * For demo properties the defaults below act as safe fallbacks.
 */
export const CURRENT_PROPERTY = {
    get id()       { return import.meta.env.VITE_DEFAULT_PROPERTY_ID || readPropConfig(['id'], ''); },
    get chainId()  { return import.meta.env.VITE_DEFAULT_CHAIN_ID || 'demo_chain_001'; },
    get name()     { return readPropConfig(['name'], 'Hotel Singularity'); },
    get currency() { return readPropConfig(['operations', 'currency'], 'USD'); },
    get address()  { return readPropConfig(['address', 'street'], ''); },
    get city()     { return readPropConfig(['address', 'city'], ''); },
    get country()  { return readPropConfig(['address', 'country'], ''); },
    get phone()    { return readPropConfig(['contact', 'phone'], ''); },
    get email()    { return readPropConfig(['contact', 'email'], ''); },
    get timezone() { return readPropConfig(['operations', 'timezone'], 'UTC'); },
    get logoUrl()  { return readPropConfig(['branding', 'logoUrl'], ''); },
    taxRate: 0.1,
};

// Utility Functions
export const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const ROOM_TYPES: RoomType[] = [
    {
        id: 'rt_superior',
        name: 'Superior Room',
        description: 'Elegant 35sqm room with city views, featuring a king bed and premium linens.',
        baseRate: 120,
        maxOccupancy: 2,
        sizeSqM: 35,
        defaultAttributes: [],
        amenities: ['High-speed Wi-Fi', 'Coffee Machine', 'Safe', 'Mini Bar'],
        image: UNSPLASH.superior
    },
    {
        id: 'rt_deluxe',
        name: 'Deluxe Suite',
        description: 'Spacious 55sqm suite with separate living area and harbor views.',
        baseRate: 250,
        maxOccupancy: 3,
        sizeSqM: 55,
        defaultAttributes: [],
        amenities: ['Harbor View', 'Bathtub', 'Smart Home Controls', 'Breakfast Included'],
        image: UNSPLASH.deluxe
    },
    {
        id: 'rt_executive',
        name: 'Executive Sanctuary',
        description: 'Our flagship 85sqm sanctuary with private balcony and personalized butler service.',
        baseRate: 500,
        maxOccupancy: 4,
        sizeSqM: 85,
        defaultAttributes: [],
        amenities: ['Private Balcony', 'Butler Service', 'Executive Lounge Access', 'Premium IoT'],
        image: UNSPLASH.executive
    }
];
