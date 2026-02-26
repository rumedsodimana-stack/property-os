import { RoomType } from '../../types';
// Current Property Configuration (Generic Placeholder)
export const CURRENT_PROPERTY = {
    id: '',
    name: 'Setup Required',
    currency: 'USD',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    timezone: 'UTC',
    logoUrl: '',
    taxRate: 0.0
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
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80'
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
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
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
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4df85b?auto=format&fit=crop&w=800&q=80'
    }
];
