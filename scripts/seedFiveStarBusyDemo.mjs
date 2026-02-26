import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: process.env.VITE_FIREBASE_APP_ID,
});

const db = getFirestore(app);
const useEmulator = (process.env.USE_FIRESTORE_EMULATOR || 'true').toLowerCase() === 'true';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOSTNAME || '127.0.0.1';
const emulatorPort = Number(process.env.FIRESTORE_EMULATOR_PORT || '8085');

if (useEmulator) {
  connectFirestoreEmulator(db, emulatorHost, emulatorPort);
  console.log(`Using Firestore emulator at ${emulatorHost}:${emulatorPort}`);
}

const ROOM_TOTAL = 200;
const OCCUPANCY_RATE = 0.92;
const OCCUPIED_ROOMS = Math.floor(ROOM_TOTAL * OCCUPANCY_RATE);
const ARRIVALS_TODAY = 22;
const DEPARTURES_TODAY = 18;

const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const firstNames = ['James', 'Emma', 'Oliver', 'Sophia', 'William', 'Isabella', 'Charlotte', 'Benjamin', 'Amelia', 'Liam', 'Noah', 'Mia', 'Elijah', 'Ava', 'Lucas', 'Evelyn'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Harris', 'Clark', 'Lewis', 'Walker', 'Young'];
const roomTypes = [
  { id: 'DELUXE_CITY', weight: 0.4, rate: 420 },
  { id: 'DELUXE_OCEAN', weight: 0.28, rate: 560 },
  { id: 'PREMIER_SUITE', weight: 0.2, rate: 900 },
  { id: 'SIGNATURE_SUITE', weight: 0.1, rate: 1450 },
  { id: 'PRESIDENTIAL', weight: 0.02, rate: 3200 },
];

function weightedRoomType() {
  const r = Math.random();
  let acc = 0;
  for (const item of roomTypes) {
    acc += item.weight;
    if (r <= acc) return item;
  }
  return roomTypes[0];
}

function roomNumber(index) {
  const floor = Math.floor(index / 25) + 1;
  const num = (index % 25) + 1;
  return `${floor}${String(num).padStart(2, '0')}`;
}

async function clearCollections(collections) {
  for (const name of collections) {
    try {
      const snap = await getDocs(collection(db, name));
      let batch = writeBatch(db);
      let count = 0;
      let deleted = 0;
      for (const d of snap.docs) {
        batch.delete(d.ref);
        count += 1;
        deleted += 1;
        if (count === 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
      console.log(`Cleared ${deleted} docs from ${name}`);
    } catch (err) {
      console.log(`Skipping clear for ${name}: ${err.message}`);
    }
  }
}

function newGuest(index) {
  const first = randomPick(firstNames);
  const last = randomPick(lastNames);
  const id = `guest_${Date.now()}_${index}`;
  return {
    id,
    doc: {
      principal: id,
      fullName: `${first} ${last}`,
      role: 'Guest',
      hotelId: 'H1',
      loyaltyTier: randomPick(['Silver', 'Gold', 'Platinum', 'Diamond']),
      preferences: {
        temperature: rand(20, 24),
        language: randomPick(['en', 'en', 'en', 'ar', 'fr']),
        dietary: randomPick([[], ['Vegan'], ['Halal'], ['Gluten-Free']]),
      },
      valenceHistory: [],
    },
  };
}

function checkInOut(offsetInDays, stayLength) {
  const inDate = new Date();
  inDate.setDate(inDate.getDate() + offsetInDays);
  inDate.setHours(15, rand(0, 59), 0, 0);

  const outDate = new Date(inDate);
  outDate.setDate(outDate.getDate() + stayLength);
  outDate.setHours(11, rand(0, 30), 0, 0);

  return {
    checkInIso: inDate.toISOString(),
    checkOutIso: outDate.toISOString(),
  };
}

async function seed() {
  console.log('Starting five-star busy-day seeding (200 rooms)...');

  await clearCollections([
    'rooms',
    'guests',
    'reservations',
    'folios',
    'posOrders',
    'tasks',
    'maintenanceTasks',
    'incidents',
    'shifts',
    'employees',
    'ledgerEntries',
    'outlets',
    'menuItems',
    'master_inventory',
  ]);

  const outlets = [
    { id: 'outlet_al_dining', name: 'Signature All Day Dining', type: 'Restaurant', seatingCapacity: 180 },
    { id: 'outlet_lobby', name: 'Lobby Lounge', type: 'Bar', seatingCapacity: 90 },
    { id: 'outlet_pool', name: 'Pool Bar', type: 'PoolBar', seatingCapacity: 70 },
    { id: 'outlet_ird', name: 'In-Room Dining', type: 'RoomService', seatingCapacity: 200 },
    { id: 'outlet_sky', name: 'Skyline Fine Dining', type: 'Restaurant', seatingCapacity: 110 },
  ];

  const now = Date.now();

  let batch = writeBatch(db);
  let count = 0;
  const write = async (collectionName, id, payload) => {
    batch.set(doc(db, collectionName, id), payload);
    count += 1;
    if (count >= 430) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  };

  for (const outlet of outlets) {
    await write('outlets', outlet.id, { ...outlet, isActive: true, createdAt: now });
  }

  for (let i = 0; i < ROOM_TOTAL; i += 1) {
    const number = roomNumber(i);
    const roomType = weightedRoomType();
    const occupied = i < OCCUPIED_ROOMS;

    await write('rooms', `room_${number}`, {
      id: `room_${number}`,
      number,
      typeId: roomType.id,
      status: occupied ? 'Occupied' : randomPick(['Clean/Ready', 'Clean/Ready', 'Maintenance']),
      attributes: [
        { id: `view_${number}`, name: randomPick(['Ocean View', 'City Skyline', 'Garden']), type: 'View', priceModifier: 0 },
        { id: `bed_${number}`, name: randomPick(['King Bed', 'Twin Bed']), type: 'Bed', priceModifier: 0 },
      ],
      connectsTo: [],
      isVirtual: false,
      componentRoomIds: [],
      maintenanceProfile: {
        lastRenovated: now - rand(180, 1200) * 86400000,
        conditionScore: rand(85, 99),
        noiseLevel: randomPick(['Low', 'Medium']),
        features: ['Smart TV', 'Rain Shower', 'Nespresso'],
        openTickets: 0,
      },
      iotStatus: {
        temp: rand(20, 24),
        lights: occupied ? rand(30, 80) : 0,
        doorLocked: true,
        carbonFootprint: Number((Math.random() * 3 + 1).toFixed(2)),
        humidity: rand(40, 55),
        occupancyDetected: occupied,
      },
    });

    if (occupied) {
      const guest = newGuest(i);
      const stayLength = rand(2, 6);
      const offset = randomPick([-2, -1, 0]);
      const { checkInIso, checkOutIso } = checkInOut(offset, stayLength);
      const reservationId = `res_${number}`;
      const folioId = `folio_${number}`;

      await write('guests', guest.id, guest.doc);
      await write('reservations', reservationId, {
        id: reservationId,
        guestId: guest.id,
        propertyId: 'H1',
        roomId: `room_${number}`,
        roomTypeId: roomType.id,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        adults: rand(1, 3),
        children: rand(0, 2),
        status: 'Checked In',
        folioId,
        rateApplied: roomType.rate,
        noShowProbability: Number((Math.random() * 0.08).toFixed(2)),
        paymentMethod: randomPick(['Credit Card', 'Corporate', 'OTA Virtual Card']),
        accompanyingGuests: [],
        channel: randomPick(['Direct', 'Booking.com', 'Expedia', 'Corporate']),
      });

      await write('folios', folioId, {
        id: folioId,
        reservationId,
        charges: [],
        balance: roomType.rate * rand(1, 3),
        status: 'Open',
      });
    }
  }

  for (let i = 0; i < ARRIVALS_TODAY; i += 1) {
    const guest = newGuest(ROOM_TOTAL + i);
    const roomType = weightedRoomType();
    const { checkInIso, checkOutIso } = checkInOut(0, rand(2, 5));
    const reservationId = `arr_${i}_${Date.now()}`;
    const folioId = `folio_arr_${i}_${Date.now()}`;

    await write('guests', guest.id, guest.doc);
    await write('reservations', reservationId, {
      id: reservationId,
      guestId: guest.id,
      propertyId: 'H1',
      roomTypeId: roomType.id,
      checkIn: checkInIso,
      checkOut: checkOutIso,
      adults: rand(1, 2),
      children: rand(0, 1),
      status: 'Confirmed',
      folioId,
      rateApplied: roomType.rate,
      noShowProbability: Number((Math.random() * 0.15).toFixed(2)),
      paymentMethod: 'Credit Card',
      accompanyingGuests: [],
      channel: randomPick(['Direct', 'Booking.com', 'Expedia']),
    });

    await write('folios', folioId, {
      id: folioId,
      reservationId,
      charges: [],
      balance: 0,
      status: 'Open',
    });
  }

  for (let i = 0; i < DEPARTURES_TODAY; i += 1) {
    await write('tasks', `dep_task_${i}`, {
      id: `dep_task_${i}`,
      title: `Departure readiness follow-up #${i + 1}`,
      description: 'Express checkout confirmation and transport coordination.',
      department: 'FrontDesk',
      delegatorId: 'system',
      priority: randomPick(['High', 'Critical']),
      status: randomPick(['Open', 'In Progress']),
      dueDate: now + rand(15, 240) * 60000,
      aiSuggested: true,
    });
  }

  for (let i = 0; i < 75; i += 1) {
    await write('posOrders', `pos_${i}`, {
      id: `pos_${i}`,
      outletId: randomPick(outlets).id,
      roomId: Math.random() > 0.45 ? `room_${roomNumber(rand(0, OCCUPIED_ROOMS - 1))}` : undefined,
      items: [],
      status: randomPick(['Sent', 'Ready', 'Served', 'Paid']),
      total: rand(35, 420),
      subtotal: rand(30, 390),
      discountAmount: 0,
      timestamp: now - rand(0, 12) * 3600000,
      paymentMethod: randomPick(['Card', 'Cash', 'RoomPost']),
      orderType: randomPick(['DineIn', 'RoomService', 'TakeAway']),
    });
  }

  for (let i = 0; i < 26; i += 1) {
    await write('maintenanceTasks', `mnt_${i}`, {
      id: `mnt_${i}`,
      assetId: `asset_${rand(1, 80)}`,
      type: randomPick(['Preventive', 'Corrective']),
      description: randomPick([
        'AC airflow below threshold',
        'Bathroom pressure variance',
        'TV casting module reset',
        'Minibar cooling diagnostics',
      ]),
      priority: randomPick(['Low', 'Medium', 'High']),
      status: randomPick(['Open', 'In Progress', 'Completed']),
      technicianId: randomPick(['eng_01', 'eng_02', 'eng_03']),
    });
  }

  if (count > 0) {
    await batch.commit();
  }

  const configBatch = writeBatch(db);
  configBatch.set(doc(db, 'systemConfig', 'settings'), {
    hotelName: 'Hotel Singularity Grand Demo',
    category: 'Five Star',
    totalRooms: ROOM_TOTAL,
    occupancyTarget: OCCUPANCY_RATE,
    mode: 'demo-busy-day',
    arrivalsToday: ARRIVALS_TODAY,
    departuresToday: DEPARTURES_TODAY,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await configBatch.commit();

  console.log('Done. Demo data seeded:');
  console.log(`- Rooms: ${ROOM_TOTAL}`);
  console.log(`- Checked-in reservations: ${OCCUPIED_ROOMS}`);
  console.log(`- Arrivals today: ${ARRIVALS_TODAY}`);
  console.log(`- Departures workload tasks: ${DEPARTURES_TODAY}`);
  console.log('- POS orders: 75');
  console.log('- Maintenance tasks: 26');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
