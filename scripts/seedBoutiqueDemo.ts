import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    writeBatch,
    doc,
    deleteDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Setup Firebase exactly as the app does
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data structure definitions
const ROOMS = Array.from({ length: 18 }, (_, i) => ({
    id: `1${(i + 1).toString().padStart(2, '0')}`,
    number: `1${(i + 1).toString().padStart(2, '0')}`,
    typeId: i < 10 ? 'DELUXE' : i < 16 ? 'SUITE' : 'PRESIDENTIAL',
    status: 'Clean/Ready',
    floor: 1,
    hkStatus: 'Clean',
    hkAttendant: '',
    attributes: [
        { id: 'view_1', name: i < 10 ? 'Resort View' : 'Ocean View', type: 'View', priceModifier: 0 },
        { id: 'bed_1', name: 'King Bed', type: 'Bed', priceModifier: 0 }
    ],
    connectsTo: [],
    isVirtual: false,
    componentRoomIds: [],
    maintenanceProfile: {
        lastRenovated: Date.now() - 31536000000,
        conditionScore: 98,
        noiseLevel: 'Low',
        features: ['Smart TV 2026', 'Rain Shower'],
        openTickets: 0
    },
    iotStatus: {
        temp: 22.5,
        lights: 0,
        doorLocked: true,
        carbonFootprint: 1.2,
        humidity: 45,
        occupancyDetected: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
}));

const OUTLETS = [
    { id: 'ird', name: 'In-Room Dining (IRD)', type: 'In-Room', status: 'Open', capacity: 18, operatingHours: '24/7', currentOccupancy: 0, revenueToday: 0, waitTimeMin: 30, managerId: 'sys-ird' },
    { id: 'minibar', name: 'Mini Bar', type: 'Grab & Go', status: 'Open', capacity: 18, operatingHours: '24/7', currentOccupancy: 0, revenueToday: 0, waitTimeMin: 0, managerId: 'sys-mb' },
    { id: 'allday', name: 'All Day Dining', type: 'Restaurant', status: 'Open', capacity: 60, operatingHours: '06:30 - 23:00', currentOccupancy: 0, revenueToday: 0, waitTimeMin: 0, managerId: 'sys-ad' },
    { id: 'lobbybar', name: 'Lobby Bar', type: 'Bar', status: 'Open', capacity: 40, operatingHours: '11:00 - 01:00', currentOccupancy: 0, revenueToday: 0, waitTimeMin: 0, managerId: 'sys-lb' },
    { id: 'poolbar', name: 'Pool Bar', type: 'Bar', status: 'Open', capacity: 30, operatingHours: '10:00 - 19:00', currentOccupancy: 0, revenueToday: 0, waitTimeMin: 0, managerId: 'sys-pb' },
    { id: 'beach', name: 'The Beach', type: 'Restaurant', status: 'Open', capacity: 80, operatingHours: '12:00 - 22:00', currentOccupancy: 0, revenueToday: 0, waitTimeMin: 15, managerId: 'sys-bc' }
];

const MENUS = [
    {
        outletId: 'ird', items: [
            { id: 'ird_b1', name: 'Boutique Breakfast', price: 45, category: 'Breakfast', desc: 'Eggs, toast, bacon, coffee, fresh juice' },
            { id: 'ird_d1', name: 'Wagyu Burger', price: 32, category: 'All Day', desc: 'Caramelized onions, truffle fries' },
            { id: 'ird_d2', name: 'Club Sandwich', price: 28, category: 'All Day', desc: 'Roasted chicken, bacon, avocado' }
        ]
    },
    {
        outletId: 'minibar', items: [
            { id: 'mb_1', name: 'Artisan Chocolate', price: 12, category: 'Snacks' },
            { id: 'mb_2', name: 'Sparkling Water', price: 8, category: 'Beverage' },
            { id: 'mb_3', name: 'Champagne (Half Btl)', price: 65, category: 'Alcohol' },
            { id: 'mb_4', name: 'Local Craft Beer', price: 10, category: 'Alcohol' }
        ]
    },
    {
        outletId: 'allday', items: [
            { id: 'ad_1', name: 'Avocado Toast', price: 22, category: 'Breakfast' },
            { id: 'ad_2', name: 'Seafood Linguine', price: 42, category: 'Dinner' },
            { id: 'ad_3', name: 'Grilled Branzino', price: 48, category: 'Dinner' },
            { id: 'ad_4', name: 'Artisan Burrata', price: 24, category: 'Lunch' }
        ]
    },
    {
        outletId: 'lobbybar', items: [
            { id: 'lb_1', name: 'Singularity Martini', price: 24, category: 'Cocktails', desc: 'Gin, dry vermouth, molecular olive sphere' },
            { id: 'lb_2', name: 'Aged Negroni', price: 26, category: 'Cocktails' },
            { id: 'lb_3', name: 'Truffle Nuts', price: 14, category: 'Bar Bites' }
        ]
    },
    {
        outletId: 'poolbar', items: [
            { id: 'pb_1', name: 'Frozen Margarita', price: 18, category: 'Cocktails' },
            { id: 'pb_2', name: 'Fresh Coconut', price: 12, category: 'Refreshments' },
            { id: 'pb_3', name: 'Ceviche', price: 22, category: 'Bites' },
            { id: 'pb_4', name: 'Fish Tacos', price: 24, category: 'Bites' }
        ]
    },
    {
        outletId: 'beach', items: [
            { id: 'bc_1', name: 'Oysters (Half Dozen)', price: 36, category: 'Raw Bar' },
            { id: 'bc_2', name: 'Lobster Roll', price: 45, category: 'Mains' },
            { id: 'bc_3', name: 'Rosé (Bottle)', price: 75, category: 'Wine' },
            { id: 'bc_4', name: 'Sunset Spritz', price: 20, category: 'Cocktails' }
        ]
    }
];

async function clearCollection(collectionName: string) {
    const snapshot = await getDocs(collection(db, collectionName));
    const batches = [];
    let currentBatch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((d) => {
        currentBatch.delete(d.ref);
        count++;
        if (count % 500 === 0) {
            batches.push(currentBatch.commit());
            currentBatch = writeBatch(db);
        }
    });

    if (count % 500 !== 0) {
        batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    console.log(`Cleared ${count} docs from ${collectionName}`);
}

async function runSeeder() {
    console.log('🚀 Starting Boutique Hotel Demo Fork...');

    // 1. Clear operational data (Empty hotel)
    const collectionsToClear = [
        'reservations',
        'guests',
        'folios',
        'transactions',
        'tasks',
        'pos_orders',
        'rooms',
        'outlets',
        'menu_items'
    ];

    for (const coll of collectionsToClear) {
        try {
            await clearCollection(coll);
        } catch (e) {
            console.log(`Note: collection ${coll} may not exist yet or error:`, e.message);
        }
    }

    // 2. Set Boutique Configuration
    console.log('\n🏨 Setting up 18-Room Boutique Hotel...');
    const configRef = doc(db, 'system_config', 'settings');
    await setDoc(configRef, {
        hotelName: "Singularity Boutique",
        totalRooms: 18,
        currency: "USD",
        timeZone: "America/New_York",
        lastUpdated: serverTimestamp()
    }, { merge: true });

    // 3. Seed Rooms (18 units)
    console.log(`🛏️  Seeding ${ROOMS.length} rooms...`);
    const roomBatch = writeBatch(db);
    ROOMS.forEach(room => {
        const ref = doc(db, 'rooms', room.id);
        roomBatch.set(ref, room);
    });
    await roomBatch.commit();

    // 4. Seed Outlets
    console.log(`🍽️  Seeding ${OUTLETS.length} F&B Outlets...`);
    const outletBatch = writeBatch(db);
    OUTLETS.forEach(outlet => {
        const ref = doc(db, 'outlets', outlet.id);
        outletBatch.set(ref, outlet);
    });
    await outletBatch.commit();

    // 5. Seed Menus
    console.log(`📋 Seeding Menus...`);
    const menuBatch = writeBatch(db);
    let menuCount = 0;
    MENUS.forEach(menuGroup => {
        menuGroup.items.forEach(item => {
            const ref = doc(db, 'menu_items', item.id);
            menuBatch.set(ref, {
                ...item,
                outletId: menuGroup.outletId,
                available: true,
                createdAt: Date.now()
            });
            menuCount++;
        });
    });
    await menuBatch.commit();

    console.log(`\n✅ Demo Fork Complete!`);
    console.log(`- 18 Rooms Created`);
    console.log(`- 6 Outlets Created`);
    console.log(`- ${menuCount} Menu Items Created`);
    console.log(`- Reservations/Guests/Orders wiped`);
    process.exit(0);
}

runSeeder().catch(console.error);
