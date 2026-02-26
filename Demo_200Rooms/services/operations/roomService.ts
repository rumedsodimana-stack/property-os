import { Room, RoomType, RoomStatus, RoomAttribute, MaintenanceProfile } from '../../types';

// Storage Keys
const ROOM_TYPES_KEY = 'hotel_room_types';
const ROOMS_KEY = 'hotel_rooms';
const ATTRIBUTES_KEY = 'hotel_room_attributes';

// --- Default Attributes ---
const defaultAttributes: RoomAttribute[] = [
    { id: 'attr_ocean', name: 'Ocean View', type: 'View', priceModifier: 50, icon: 'Waves' },
    { id: 'attr_city', name: 'City View', type: 'View', priceModifier: 20, icon: 'Building' },
    { id: 'attr_king', name: 'King Bed', type: 'Bed', priceModifier: 0, icon: 'Bed' },
    { id: 'attr_twin', name: 'Twin Beds', type: 'Bed', priceModifier: 0, icon: 'Users' },
    { id: 'attr_balcony', name: 'Balcony', type: 'Feature', priceModifier: 30, icon: 'Sun' },
    { id: 'attr_high_floor', name: 'High Floor', type: 'Location', priceModifier: 15, icon: 'ArrowUp' },
    { id: 'attr_accessible', name: 'Wheelchair Accessible', type: 'Accessibility', priceModifier: 0, icon: 'Accessibility' },
];

// --- Default Data ---
const defaultRoomTypes: RoomType[] = [
    {
        id: 'rt_1',
        name: 'Deluxe King',
        description: 'Standard luxury with a King bed.',
        baseRate: 250,
        maxOccupancy: 2,
        defaultAttributes: [
            defaultAttributes.find(a => a.id === 'attr_king')!,
            defaultAttributes.find(a => a.id === 'attr_city')!
        ],
        amenities: ['Wifi', 'TV', 'MiniBar'],
        image: '',
        sizeSqM: 35
    },
    {
        id: 'rt_2',
        name: 'Executive Twin',
        description: 'Spacious room with two beds.',
        baseRate: 300,
        maxOccupancy: 4,
        defaultAttributes: [
            defaultAttributes.find(a => a.id === 'attr_twin')!,
            defaultAttributes.find(a => a.id === 'attr_city')!
        ],
        amenities: ['Wifi', 'TV', 'MiniBar', 'Desk'],
        image: '',
        sizeSqM: 45
    }
];

const defaultMaintenance: MaintenanceProfile = {
    lastRenovated: Date.now() - 1000 * 60 * 60 * 24 * 365, // 1 year ago
    conditionScore: 95,
    noiseLevel: 'Low',
    features: ['Standard Config'],
    openTickets: 0
};

const defaultRooms: Room[] = [
    {
        id: 'r_101',
        typeId: 'rt_1',
        number: '101',
        status: RoomStatus.CLEAN_READY,
        attributes: [{ ...defaultAttributes.find(a => a.id === 'attr_ocean')!, priceModifier: 60 }], // Overridden view price
        connectsTo: ['r_102'],
        isVirtual: false,
        componentRoomIds: [],
        maintenanceProfile: { ...defaultMaintenance, noiseLevel: 'Low' },
        iotStatus: { temp: 21, lights: 0, doorLocked: true, carbonFootprint: 0, humidity: 40, occupancyDetected: false }
    },
    {
        id: 'r_102',
        typeId: 'rt_2',
        number: '102',
        status: RoomStatus.DIRTY_DEPARTURE,
        attributes: [defaultAttributes.find(a => a.id === 'attr_high_floor')!],
        connectsTo: ['r_101'],
        isVirtual: false,
        componentRoomIds: [],
        maintenanceProfile: { ...defaultMaintenance, conditionScore: 80 },
        iotStatus: { temp: 22, lights: 0, doorLocked: true, carbonFootprint: 0, humidity: 45, occupancyDetected: false }
    },
    // Virtual Suite
    {
        id: 'v_100',
        typeId: 'rt_suite_family', // Would need to exist in types, illustrative
        number: '100 (Family Suite)',
        status: RoomStatus.CLEAN_READY,
        attributes: [],
        connectsTo: [],
        isVirtual: true,
        componentRoomIds: ['r_101', 'r_102'],
        maintenanceProfile: defaultMaintenance,
        iotStatus: { temp: 21, lights: 0, doorLocked: true, carbonFootprint: 0, humidity: 40, occupancyDetected: false }
    }
];

// --- ATTRIBUTES ---
export const getAttributes = (): RoomAttribute[] => {
    try {
        const stored = localStorage.getItem(ATTRIBUTES_KEY);
        if (stored) return JSON.parse(stored);
        localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(defaultAttributes));
        return defaultAttributes;
    } catch { return defaultAttributes; }
};

export const saveAttributes = (attrs: RoomAttribute[]) => localStorage.setItem(ATTRIBUTES_KEY, JSON.stringify(attrs));

// --- ROOM TYPES ---

export const getRoomTypes = (): RoomType[] => {
    try {
        const stored = localStorage.getItem(ROOM_TYPES_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Seed default if empty
        saveRoomTypes(defaultRoomTypes);
        return defaultRoomTypes;
    } catch (e) {
        console.error("Error loading room types", e);
        return defaultRoomTypes;
    }
};

export const saveRoomTypes = (types: RoomType[]): void => {
    localStorage.setItem(ROOM_TYPES_KEY, JSON.stringify(types));
};

export const addRoomType = (type: RoomType): void => {
    const list = getRoomTypes();
    list.push(type);
    saveRoomTypes(list);
};

export const updateRoomType = (type: RoomType): void => {
    const list = getRoomTypes();
    const index = list.findIndex(t => t.id === type.id);
    if (index !== -1) {
        list[index] = type;
        saveRoomTypes(list);
    }
};

export const deleteRoomType = (id: string): void => {
    const list = getRoomTypes();
    const newList = list.filter(t => t.id !== id);
    saveRoomTypes(newList);
};

// --- ROOMS ---

export const getRooms = (): Room[] => {
    try {
        const stored = localStorage.getItem(ROOMS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Seed
        saveRooms(defaultRooms);
        return defaultRooms;
    } catch (e) {
        console.error("Error loading rooms", e);
        return defaultRooms;
    }
};

export const saveRooms = (rooms: Room[]): void => {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
};

export const addRoom = (room: Room): void => {
    const list = getRooms();
    list.push(room);
    saveRooms(list);
};

export const updateRoom = (room: Room): void => {
    const list = getRooms();
    const index = list.findIndex(r => r.id === room.id);
    if (index !== -1) {
        list[index] = room;
        saveRooms(list);
    }
};

export const deleteRoom = (id: string): void => {
    const list = getRooms();
    const newList = list.filter(r => r.id !== id);
    saveRooms(newList);
};
