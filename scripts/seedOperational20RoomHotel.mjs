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

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const firebaseConfig = {
  apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  appId: requiredEnv('VITE_FIREBASE_APP_ID'),
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const useEmulator = (process.env.USE_FIRESTORE_EMULATOR || 'false').toLowerCase() === 'true';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOSTNAME || '127.0.0.1';
const emulatorPort = Number(process.env.FIRESTORE_EMULATOR_PORT || '8085');

if (useEmulator) {
  connectFirestoreEmulator(db, emulatorHost, emulatorPort);
  console.log(`[seed] Using Firestore emulator at ${emulatorHost}:${emulatorPort}`);
} else {
  console.log('[seed] Using cloud Firestore');
}

const PROPERTY_ID = process.env.VITE_DEFAULT_PROPERTY_ID || 'demo_property_h1';
const SEED_SCOPE = (process.env.SEED_SCOPE || 'top-level').toLowerCase();

const ROOM_TOTAL = 20;
const CHECKED_IN_COUNT = 16;
const GUEST_TOTAL = 35;
const EMPLOYEE_TOTAL = 20;
const POS_ORDER_TOTAL = 54;
const TASK_TOTAL = 22;
const MAINTENANCE_TOTAL = 10;

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const firstNames = [
  'Alexander', 'Victoria', 'Sebastian', 'Aisha', 'Miguel', 'Sara', 'Nadia',
  'Omar', 'Priya', 'Yuki', 'Raphael', 'Mei', 'Lucas', 'Isabella', 'Arjun',
  'Leila', 'Karim', 'Fatima', 'Noah', 'Emma', 'Liam', 'Amelia', 'James',
  'Sophia', 'Benjamin', 'Charlotte', 'Dmitri', 'Elena', 'Marcus', 'Aiko',
  'Daniel', 'Layla', 'Hassan', 'Maya', 'Ethan', 'Grace', 'Adam', 'Jasmine',
];

const lastNames = [
  'Rahman', 'Santos', 'Lee', 'Al-Khalifa', 'Patel', 'Nakamura', 'Montenegro',
  'Ashford', 'Khan', 'Miller', 'Johnson', 'Brown', 'Garcia', 'Martinez',
  'Smith', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Moore', 'Jackson',
  'White', 'Harris', 'Clark', 'Lewis', 'Young', 'Hall', 'King',
];

const roomTypes = [
  { id: 'rt_superior', weight: 0.38, rate: 170, name: 'Superior Room' },
  { id: 'rt_deluxe', weight: 0.34, rate: 245, name: 'Deluxe Room' },
  { id: 'rt_junior_suite', weight: 0.2, rate: 360, name: 'Junior Suite' },
  { id: 'rt_executive_suite', weight: 0.08, rate: 520, name: 'Executive Suite' },
];

const outletDefs = [
  {
    id: 'outlet_azure',
    name: 'Azure All Day Dining',
    type: 'Restaurant',
    seatingCapacity: 72,
    description: 'Main restaurant serving breakfast, lunch, and dinner.',
    operatingHours: { open: '06:30', close: '23:00' },
    taxRate: 0.1,
    gratuityRate: 0.1,
    kdsEnabled: true,
    color: '#22c55e',
    isActive: true,
  },
  {
    id: 'outlet_lounge',
    name: 'The Atrium Lounge',
    type: 'Bar',
    seatingCapacity: 48,
    description: 'Lobby lounge for coffees, mocktails, and evening bites.',
    operatingHours: { open: '10:00', close: '00:30' },
    taxRate: 0.1,
    gratuityRate: 0.1,
    kdsEnabled: true,
    color: '#06b6d4',
    isActive: true,
  },
  {
    id: 'outlet_ird',
    name: 'In-Room Dining (IRD)',
    type: 'RoomService',
    seatingCapacity: 20,
    description: '24-hour in-room dining operations.',
    operatingHours: { open: '00:00', close: '23:59' },
    taxRate: 0.1,
    gratuityRate: 0.12,
    kdsEnabled: true,
    color: '#8b5cf6',
    isActive: true,
  },
  {
    id: 'outlet_minibar',
    name: 'Mini Bar',
    type: 'Retail',
    seatingCapacity: 0,
    description: 'In-room minibar catalog and replenishment operations.',
    operatingHours: { open: '00:00', close: '23:59' },
    taxRate: 0.1,
    gratuityRate: 0,
    kdsEnabled: false,
    color: '#f59e0b',
    isActive: true,
  },
];

const menuCatalogs = [
  {
    outletId: 'outlet_azure',
    items: [
      { name: 'Continental Breakfast Plate', category: 'Breakfast', price: 18, department: 'Food', isHalal: true, isVegan: false, allergens: ['Gluten', 'Dairy'] },
      { name: 'Shakshuka', category: 'Breakfast', price: 14, department: 'Food', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Classic Caesar Salad', category: 'Lunch', price: 12, department: 'Food', isHalal: true, isVegan: false, allergens: ['Dairy'] },
      { name: 'Chicken Tikka Bowl', category: 'Lunch', price: 16, department: 'Food', isHalal: true, isVegan: false, allergens: [] },
      { name: 'Grilled Salmon', category: 'Dinner', price: 24, department: 'Food', isHalal: true, isVegan: false, allergens: ['Fish'] },
      { name: 'Beef Tenderloin', category: 'Dinner', price: 29, department: 'Food', isHalal: true, isVegan: false, allergens: [] },
      { name: 'Fresh Orange Juice', category: 'Beverages', price: 6, department: 'Beverage', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Turkish Coffee', category: 'Beverages', price: 5, department: 'Beverage', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Chocolate Mousse', category: 'Dessert', price: 8, department: 'Food', isHalal: true, isVegan: false, allergens: ['Dairy', 'Egg'] },
    ],
  },
  {
    outletId: 'outlet_lounge',
    items: [
      { name: 'Club Sandwich', category: 'Snacks', price: 14, department: 'Food', isHalal: true, isVegan: false, allergens: ['Gluten'] },
      { name: 'Mezze Platter', category: 'Snacks', price: 16, department: 'Food', isHalal: true, isVegan: true, allergens: ['Sesame'] },
      { name: 'Cheese Board', category: 'Snacks', price: 18, department: 'Food', isHalal: true, isVegan: false, allergens: ['Dairy'] },
      { name: 'Date and Pistachio Cake', category: 'Dessert', price: 9, department: 'Food', isHalal: true, isVegan: false, allergens: ['Nuts', 'Gluten'] },
      { name: 'Signature Mocktail', category: 'Beverages', price: 7, department: 'Beverage', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Cold Brew Coffee', category: 'Beverages', price: 6, department: 'Beverage', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Sparkling Mineral Water', category: 'Beverages', price: 4, department: 'Beverage', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Fresh Mint Lemonade', category: 'Beverages', price: 6, department: 'Beverage', isHalal: true, isVegan: true, allergens: [] },
    ],
  },
  {
    outletId: 'outlet_ird',
    items: [
      { name: 'IRD Breakfast Tray', category: 'Breakfast', price: 22, department: 'Food', isHalal: true, isVegan: false, allergens: ['Gluten', 'Dairy'] },
      { name: 'Margherita Pizza', category: 'Main', price: 15, department: 'Food', isHalal: true, isVegan: false, allergens: ['Gluten', 'Dairy'] },
      { name: 'Grilled Chicken Panini', category: 'Main', price: 14, department: 'Food', isHalal: true, isVegan: false, allergens: ['Gluten'] },
      { name: 'Lentil Soup', category: 'Main', price: 10, department: 'Food', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Penne Arrabbiata', category: 'Main', price: 13, department: 'Food', isHalal: true, isVegan: true, allergens: ['Gluten'] },
      { name: 'Cheeseburger', category: 'Main', price: 16, department: 'Food', isHalal: true, isVegan: false, allergens: ['Gluten', 'Dairy'] },
      { name: 'Fruit Platter', category: 'Dessert', price: 9, department: 'Food', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Soft Drink Can', category: 'Beverages', price: 4, department: 'Beverage', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Espresso', category: 'Beverages', price: 5, department: 'Beverage', isHalal: true, isVegan: true, allergens: [] },
    ],
  },
  {
    outletId: 'outlet_minibar',
    items: [
      { name: 'Still Water 330ml', category: 'Hydration', price: 3, department: 'Amenity', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Sparkling Water 330ml', category: 'Hydration', price: 3, department: 'Amenity', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Energy Drink', category: 'Beverages', price: 4, department: 'Amenity', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Salted Almonds', category: 'Snacks', price: 4, department: 'Amenity', isHalal: true, isVegan: true, allergens: ['Nuts'] },
      { name: 'Dark Chocolate Bar', category: 'Snacks', price: 5, department: 'Amenity', isHalal: true, isVegan: false, allergens: ['Soy'] },
      { name: 'Potato Chips', category: 'Snacks', price: 3, department: 'Amenity', isHalal: true, isVegan: true, allergens: [] },
      { name: 'Instant Noodles Cup', category: 'Snacks', price: 4, department: 'Amenity', isHalal: true, isVegan: false, allergens: ['Gluten'] },
      { name: 'Electrolyte Drink', category: 'Beverages', price: 4, department: 'Amenity', isHalal: true, isVegan: true, allergens: [] },
    ],
  },
];

const inventoryCatalog = [
  { sku: 'INV-001', name: 'Fresh Eggs', category: 'Food', unit: 'tray', costPerUnit: 6.5, totalStock: 48, parLevel: 28, reorderPoint: 20 },
  { sku: 'INV-002', name: 'Chicken Breast', category: 'Food', unit: 'kg', costPerUnit: 4.8, totalStock: 76, parLevel: 45, reorderPoint: 30 },
  { sku: 'INV-003', name: 'Salmon Fillet', category: 'Food', unit: 'kg', costPerUnit: 12.2, totalStock: 34, parLevel: 24, reorderPoint: 18 },
  { sku: 'INV-004', name: 'Beef Tenderloin', category: 'Food', unit: 'kg', costPerUnit: 16.4, totalStock: 29, parLevel: 20, reorderPoint: 15 },
  { sku: 'INV-005', name: 'Fresh Lettuce', category: 'Food', unit: 'kg', costPerUnit: 2.3, totalStock: 44, parLevel: 26, reorderPoint: 18 },
  { sku: 'INV-006', name: 'Penne Pasta', category: 'Food', unit: 'kg', costPerUnit: 3.2, totalStock: 60, parLevel: 35, reorderPoint: 25 },
  { sku: 'INV-007', name: 'Arabic Bread', category: 'Food', unit: 'pack', costPerUnit: 2.8, totalStock: 52, parLevel: 30, reorderPoint: 20 },
  { sku: 'INV-008', name: 'Coffee Beans', category: 'Beverage', unit: 'kg', costPerUnit: 11.3, totalStock: 22, parLevel: 14, reorderPoint: 10 },
  { sku: 'INV-009', name: 'Orange Juice Concentrate', category: 'Beverage', unit: 'liter', costPerUnit: 3.9, totalStock: 38, parLevel: 24, reorderPoint: 16 },
  { sku: 'INV-010', name: 'Mineral Water Bottles', category: 'Amenity', unit: 'case', costPerUnit: 7.5, totalStock: 96, parLevel: 52, reorderPoint: 40 },
  { sku: 'INV-011', name: 'Sparkling Water Bottles', category: 'Amenity', unit: 'case', costPerUnit: 8.1, totalStock: 74, parLevel: 44, reorderPoint: 34 },
  { sku: 'INV-012', name: 'Chocolate Bars', category: 'Amenity', unit: 'box', costPerUnit: 15.0, totalStock: 24, parLevel: 14, reorderPoint: 10 },
  { sku: 'INV-013', name: 'Mixed Nuts', category: 'Amenity', unit: 'box', costPerUnit: 12.4, totalStock: 20, parLevel: 12, reorderPoint: 8 },
  { sku: 'INV-014', name: 'Soft Drink Cans', category: 'Amenity', unit: 'case', costPerUnit: 10.9, totalStock: 46, parLevel: 26, reorderPoint: 20 },
  { sku: 'INV-015', name: 'Housekeeping Amenities Kit', category: 'Operating Supplies', unit: 'box', costPerUnit: 18.5, totalStock: 30, parLevel: 18, reorderPoint: 12 },
];

const roles = [
  { id: 'gm', name: 'General Manager', description: 'Property-level oversight and approvals', permissions: ['*'] },
  { id: 'frontdesk_agent', name: 'Front Desk Agent', description: 'Reservations, check-in, check-out', permissions: ['pms.read', 'pms.write'] },
  { id: 'housekeeping_supervisor', name: 'Housekeeping Supervisor', description: 'Room status and task routing', permissions: ['housekeeping.read', 'housekeeping.write'] },
  { id: 'fnb_manager', name: 'F&B Manager', description: 'POS operations and menu governance', permissions: ['pos.read', 'pos.write'] },
  { id: 'hr_manager', name: 'HR Manager', description: 'Workforce and payroll operations', permissions: ['hr.read', 'hr.write'] },
];

const weightedRoomType = () => {
  const r = Math.random();
  let acc = 0;
  for (const t of roomTypes) {
    acc += t.weight;
    if (r <= acc) return t;
  }
  return roomTypes[0];
};

const roomNumber = (index) => {
  const floor = Math.floor(index / 8) + 1;
  const number = (index % 8) + 1;
  return `${floor}${String(number).padStart(2, '0')}`;
};

const checkInOut = (offsetDays, lengthDays) => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + offsetDays);
  checkIn.setHours(15, rand(0, 59), 0, 0);

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + lengthDays);
  checkOut.setHours(11, rand(0, 30), 0, 0);

  return {
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString(),
  };
};

const fullNameAt = (index) => `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`;

const targetsFor = (collectionName) => {
  const scoped = `properties/${PROPERTY_ID}/${collectionName}`;
  if (SEED_SCOPE === 'scoped') return [scoped];
  if (SEED_SCOPE === 'both') return [scoped, collectionName];
  return [collectionName];
};

const clearCollections = async (collectionNames) => {
  for (const name of collectionNames) {
    for (const path of targetsFor(name)) {
      const colRef = path.includes('/') ? collection(db, ...path.split('/')) : collection(db, path);
      const snap = await getDocs(colRef);
      if (snap.empty) continue;

      let batch = writeBatch(db);
      let ops = 0;
      let deleted = 0;

      for (const d of snap.docs) {
        batch.delete(d.ref);
        ops += 1;
        deleted += 1;

        if (ops >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      }
      if (ops > 0) await batch.commit();
      console.log(`[seed] Cleared ${deleted} docs from ${path}`);
    }
  }
};

const buildMenuItems = () => {
  const items = [];
  let idx = 1;
  for (const catalog of menuCatalogs) {
    for (const item of catalog.items) {
      items.push({
        id: `menu_${String(idx).padStart(3, '0')}`,
        outletId: catalog.outletId,
        name: item.name,
        price: item.price,
        category: item.category,
        isHalal: item.isHalal,
        isVegan: item.isVegan,
        allergens: item.allergens,
        department: item.department,
      });
      idx += 1;
    }
  }
  return items;
};

const buildRooms = () => {
  const rooms = [];
  for (let i = 0; i < ROOM_TOTAL; i += 1) {
    const type = weightedRoomType();
    const number = roomNumber(i);
    const occupied = i < CHECKED_IN_COUNT;
    rooms.push({
      id: `room_${number}`,
      number,
      typeId: type.id,
      status: occupied ? 'Occupied' : pick(['Clean/Ready', 'Clean/Inspected', 'Maintenance']),
      attributes: [
        { id: `view_${number}`, name: pick(['Sea View', 'City View', 'Garden View']), type: 'View', priceModifier: 0 },
        { id: `bed_${number}`, name: pick(['King Bed', 'Twin Beds']), type: 'Bed', priceModifier: 0 },
      ],
      connectsTo: [],
      isVirtual: false,
      componentRoomIds: [],
      maintenanceProfile: {
        lastRenovated: now - rand(120, 840) * dayMs,
        conditionScore: rand(86, 99),
        noiseLevel: pick(['Low', 'Low', 'Medium']),
        features: ['Smart TV', 'Rain Shower', 'Nespresso Machine'],
        openTickets: 0,
      },
      iotStatus: {
        temp: rand(20, 24),
        lights: occupied ? rand(20, 85) : 0,
        doorLocked: true,
        carbonFootprint: Number((Math.random() * 2 + 0.8).toFixed(2)),
        humidity: rand(38, 56),
        occupancyDetected: occupied,
      },
    });
  }
  return rooms;
};

const buildGuestsReservationsFolios = (rooms) => {
  const guests = [];
  const reservations = [];
  const folios = [];
  const occupiedRoomIds = rooms.slice(0, CHECKED_IN_COUNT).map((room) => room.id);
  const availableRoomIds = rooms.slice(CHECKED_IN_COUNT).map((room) => room.id);

  for (let i = 0; i < GUEST_TOTAL; i += 1) {
    const guestId = `guest_${String(i + 1).padStart(3, '0')}`;
    const reservationId = `res_${String(i + 1).padStart(3, '0')}`;
    const folioId = `folio_${String(i + 1).padStart(3, '0')}`;
    const guestName = fullNameAt(i);

    const guest = {
      id: guestId,
      principal: guestId,
      fullName: guestName,
      role: 'Guest',
      hotelId: PROPERTY_ID,
      loyaltyTier: pick(['Silver', 'Gold', 'Gold', 'Platinum', 'Diamond']),
      preferences: {
        language: pick(['en', 'en', 'ar', 'fr']),
        temperature: rand(20, 24),
        dietary: pick([[], ['Vegan'], ['Halal'], ['Gluten-Free']]),
      },
      valenceHistory: [],
      nationality: pick(['Bahrain', 'UAE', 'Saudi Arabia', 'India', 'UK', 'USA', 'Japan']),
      email: `${guestName.toLowerCase().replace(/\s+/g, '.')}@guestmail.test`,
    };
    guests.push(guest);

    let status = 'Confirmed';
    let roomId;
    let type = weightedRoomType();
    let checkWindow;

    if (i < CHECKED_IN_COUNT) {
      status = 'Checked In';
      roomId = occupiedRoomIds[i];
      const matchedRoom = rooms.find((r) => r.id === roomId);
      if (matchedRoom) {
        type = roomTypes.find((t) => t.id === matchedRoom.typeId) || type;
      }
      checkWindow = checkInOut(-rand(0, 3), rand(2, 6));
      const assignedRoom = rooms.find((r) => r.id === roomId);
      if (assignedRoom) {
        assignedRoom.currentGuestId = guestId;
        assignedRoom.assignedReservationId = reservationId;
        assignedRoom.status = 'Occupied';
        assignedRoom.iotStatus.occupancyDetected = true;
      }
    } else if (i < 26) {
      status = 'Confirmed';
      roomId = pick(availableRoomIds);
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        type = roomTypes.find((t) => t.id === room.typeId) || type;
      }
      checkWindow = checkInOut(rand(0, 3), rand(2, 5));
    } else {
      status = 'Confirmed';
      roomId = undefined;
      checkWindow = checkInOut(rand(4, 18), rand(2, 6));
    }

    const reservation = {
      id: reservationId,
      guestId,
      guestName,
      propertyId: PROPERTY_ID,
      ...(roomId ? { roomId } : {}),
      roomTypeId: type.id,
      checkIn: checkWindow.checkIn,
      checkOut: checkWindow.checkOut,
      adults: rand(1, 3),
      children: rand(0, 2),
      status,
      folioId,
      rateApplied: type.rate,
      noShowProbability: status === 'Checked In' ? 0 : Number((Math.random() * 0.12).toFixed(2)),
      paymentMethod: pick(['Credit Card', 'Corporate', 'OTA Virtual Card']),
      accompanyingGuests: [],
      channel: pick(['Direct', 'Booking.com', 'Expedia', 'Corporate']),
      specialRequests: pick([
        '',
        'Late check-in expected',
        'High floor requested',
        'Extra pillows',
        'Quiet room',
        'Airport pickup',
      ]),
    };
    reservations.push(reservation);

    const roomNights = Math.max(1, Math.ceil((new Date(checkWindow.checkOut).getTime() - new Date(checkWindow.checkIn).getTime()) / dayMs));
    const incidental = status === 'Checked In' ? rand(12, 180) : 0;
    folios.push({
      id: folioId,
      reservationId,
      guestId,
      guestName,
      charges: status === 'Checked In'
        ? [
          {
            id: `charge_${folioId}_room`,
            category: 'Room',
            description: `Room Nightly Rate x${roomNights}`,
            amount: type.rate * roomNights,
            timestamp: now - rand(1, 36) * 60 * 60 * 1000,
            businessDate: new Date().toISOString().slice(0, 10),
          },
          {
            id: `charge_${folioId}_incidentals`,
            category: 'Incidentals',
            description: 'Current incidental charges',
            amount: incidental,
            timestamp: now - rand(1, 12) * 60 * 60 * 1000,
            businessDate: new Date().toISOString().slice(0, 10),
          },
        ]
        : [],
      balance: status === 'Checked In' ? (type.rate * roomNights) + incidental : 0,
      status: 'Open',
      currency: 'USD',
    });
  }

  return { guests, reservations, folios };
};

const buildEmployees = () => {
  const jobBank = [
    ['General Manager', 'Management'],
    ['Front Office Manager', 'Front Office'],
    ['Front Desk Agent', 'Front Office'],
    ['Front Desk Agent', 'Front Office'],
    ['Guest Relations Executive', 'Front Office'],
    ['Executive Housekeeper', 'Housekeeping'],
    ['Room Attendant', 'Housekeeping'],
    ['Room Attendant', 'Housekeeping'],
    ['Laundry Supervisor', 'Housekeeping'],
    ['F&B Director', 'F&B'],
    ['Restaurant Manager', 'F&B'],
    ['IRD Supervisor', 'F&B'],
    ['Mini Bar Attendant', 'F&B'],
    ['Chef de Partie', 'Kitchen'],
    ['Commis Chef', 'Kitchen'],
    ['Chief Engineer', 'Engineering'],
    ['Maintenance Technician', 'Engineering'],
    ['Finance Manager', 'Finance'],
    ['HR Manager', 'HR'],
    ['Security Supervisor', 'Security'],
  ];

  const employees = [];

  for (let i = 0; i < EMPLOYEE_TOTAL; i += 1) {
    const [jobTitle, departmentName] = jobBank[i % jobBank.length];
    const id = `emp_${String(i + 1).padStart(3, '0')}`;
    const fullName = fullNameAt(i + 40);
    const basicSalary = rand(450, 2200);
    const hireDate = now - rand(140, 2200) * dayMs;
    const contractType = pick(['Full-time', 'Full-time', 'Full-time', 'Part-time']);
    const status = i === 6 || i === 18 ? 'OnLeave' : 'Active';
    const skills = [
      { name: pick(['Service', 'Leadership', 'Compliance', 'Systems', 'Guest Handling']), score: rand(72, 96) },
      { name: pick(['Communication', 'Operations', 'Upselling', 'Training', 'Safety']), score: rand(70, 95) },
    ];

    employees.push({
      id,
      principal: id,
      employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
      fullName,
      role: jobTitle,
      nationality: pick(['Bahrain', 'India', 'Philippines', 'Jordan', 'Egypt', 'UK', 'Nepal']),
      phone: `+9733${rand(1000000, 9999999)}`,
      email: `${fullName.toLowerCase().replace(/\s+/g, '.')}@hotel-singularity.test`,
      jobDescriptionId: `jd_${departmentName.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`,
      jobTitle,
      departmentId: departmentName.toLowerCase().replace(/\s+/g, '_'),
      departmentName,
      costCenterId: `cc_${departmentName.toLowerCase().replace(/\s+/g, '_')}`,
      payGradeId: `pg_${rand(1, 8)}`,
      systemRoleId: departmentName === 'Management' ? 'gm' : departmentName === 'HR' ? 'hr_manager' : 'frontdesk_agent',
      contractType,
      hireDate,
      probationEndDate: hireDate + 90 * dayMs,
      confirmationDate: hireDate + 120 * dayMs,
      reportingManagerId: i === 0 ? null : 'emp_001',
      basicSalary,
      currency: 'BHD',
      hourlyRate: Number((basicSalary / 180).toFixed(2)),
      overtimeRate: Number((basicSalary / 180 * 1.4).toFixed(2)),
      allowances: [{ name: 'Transport', amount: rand(20, 100) }],
      status,
      performanceScore: rand(74, 95),
      aiPerformanceScore: rand(76, 97),
      performanceFeedback: ['Consistent service performance and team contribution'],
      lastReviewDate: now - rand(15, 180) * dayMs,
      nextReviewDate: now + rand(60, 180) * dayMs,
      skills,
      crossTrainedRoleIds: pick([[], ['frontdesk_agent'], ['housekeeping_supervisor'], ['fnb_manager']]),
      certifications: [
        {
          name: pick(['Fire Safety', 'Food Safety', 'Guest Experience', 'Data Privacy']),
          issuedAt: now - rand(60, 360) * dayMs,
        },
      ],
      trainingProgress: [
        { moduleId: 'orientation', status: 'Completed', score: rand(80, 98) },
        { moduleId: 'service-recovery', status: pick(['Completed', 'In Progress']), score: rand(75, 96) },
      ],
      gratuityStartDate: hireDate,
      accruedGratuity: rand(9000, 86000),
      promotionHistory: [],
      salaryHistory: [],
      transferHistory: [],
      auditLog: [],
      workPermitExpiry: now + rand(60, 480) * dayMs,
    });
  }

  return employees;
};

const buildShifts = (employees) => {
  const businessDate = new Date().toISOString().slice(0, 10);
  const shiftTemplates = [
    ['07:00', '15:00', 'Scheduled'],
    ['15:00', '23:00', 'ClockedIn'],
    ['23:00', '07:00', 'Scheduled'],
  ];
  return employees.map((emp, index) => {
    const [startTime, endTime, status] = shiftTemplates[index % shiftTemplates.length];
    return {
      id: `shift_${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.departmentName,
      type: index % 3 === 0 ? 'Morning' : index % 3 === 1 ? 'Afternoon' : 'Night',
      date: businessDate,
      startTime,
      endTime,
      start: `${businessDate}T${startTime}:00.000Z`,
      end: `${businessDate}T${endTime === '07:00' ? '23:59' : endTime}:00.000Z`,
      status,
      outletId: pick(['outlet_azure', 'outlet_lounge', 'outlet_ird', 'outlet_minibar']),
    };
  });
};

const buildTables = () => {
  const tables = [];
  let counter = 1;
  for (let i = 0; i < 12; i += 1) {
    tables.push({
      id: `table_az_${counter}`,
      number: `${counter}`,
      seats: pick([2, 2, 4, 4, 6]),
      status: pick(['Available', 'Occupied', 'Reserved']),
      outletId: 'outlet_azure',
      section: i < 6 ? 'Main' : 'Terrace',
    });
    counter += 1;
  }
  for (let i = 0; i < 8; i += 1) {
    tables.push({
      id: `table_lg_${i + 1}`,
      number: `${i + 1}`,
      seats: pick([2, 2, 4, 4]),
      status: pick(['Available', 'Occupied', 'Reserved']),
      outletId: 'outlet_lounge',
      section: i < 4 ? 'Atrium' : 'Window',
    });
  }
  return tables;
};

const buildTasks = () => {
  const departments = ['Housekeeping', 'MiniBar', 'IRD', 'Maintenance', 'General', 'Kitchen', 'Bar'];
  const titles = [
    'Turndown service request',
    'Minibar replenishment',
    'IRD delivery follow-up',
    'Luggage delivery to room',
    'VIP arrival setup',
    'Amenity request - extra towels',
    'Late checkout room planning',
    'Guest complaint follow-up',
  ];

  const tasks = [];
  for (let i = 0; i < TASK_TOTAL; i += 1) {
    tasks.push({
      id: `task_${String(i + 1).padStart(3, '0')}`,
      title: pick(titles),
      description: 'Operational task generated for active shift management.',
      department: pick(departments),
      assigneeId: `emp_${String(rand(1, EMPLOYEE_TOTAL)).padStart(3, '0')}`,
      delegatorId: 'emp_001',
      acceptedBy: pick([null, `emp_${String(rand(1, EMPLOYEE_TOTAL)).padStart(3, '0')}`]),
      priority: pick(['Low', 'Medium', 'High']),
      status: pick(['Open', 'In Progress', 'Done']),
      dueDate: now + rand(-30, 240) * 60 * 1000,
      aiSuggested: Math.random() > 0.45,
    });
  }
  return tasks;
};

const buildMaintenanceTasks = () => {
  const descriptions = [
    'AC cooling calibration in guest room',
    'Bathroom shower pressure check',
    'TV HDMI port intermittent signal',
    'Door lock battery replacement',
    'Mini bar cooling variance inspection',
    'Corridor lighting replacement',
  ];
  const tasks = [];
  for (let i = 0; i < MAINTENANCE_TOTAL; i += 1) {
    tasks.push({
      id: `mnt_${String(i + 1).padStart(3, '0')}`,
      assetId: `asset_${String(rand(1, 40)).padStart(3, '0')}`,
      type: pick(['Preventive', 'Corrective']),
      description: pick(descriptions),
      priority: pick(['Low', 'Medium', 'High']),
      status: pick(['Open', 'In Progress', 'Completed']),
      technicianId: `emp_${String(rand(15, 20)).padStart(3, '0')}`,
    });
  }
  return tasks;
};

const buildPosOrders = (tables, rooms, menuItems) => {
  const menuByOutlet = menuItems.reduce((acc, item) => {
    if (!acc[item.outletId]) acc[item.outletId] = [];
    acc[item.outletId].push(item);
    return acc;
  }, {});

  const outletWeights = [
    ['outlet_azure', 0.42],
    ['outlet_lounge', 0.28],
    ['outlet_ird', 0.2],
    ['outlet_minibar', 0.1],
  ];

  const pickOutlet = () => {
    const r = Math.random();
    let acc = 0;
    for (const [outletId, weight] of outletWeights) {
      acc += weight;
      if (r <= acc) return outletId;
    }
    return 'outlet_azure';
  };

  const paidMethods = ['Card', 'Cash', 'RoomPost'];
  const occupiedRooms = rooms.filter((room) => room.status === 'Occupied');
  const dineInTables = tables.filter((table) => table.outletId === 'outlet_azure' || table.outletId === 'outlet_lounge');

  const orders = [];
  for (let i = 0; i < POS_ORDER_TOTAL; i += 1) {
    const outletId = pickOutlet();
    const pool = menuByOutlet[outletId] || [];
    const itemCount = rand(1, 4);
    const items = [];
    let subtotal = 0;

    for (let j = 0; j < itemCount; j += 1) {
      const item = pick(pool);
      const qty = rand(1, 3);
      const total = item.price * qty;
      subtotal += total;
      items.push({
        menuItemId: item.id,
        name: item.name,
        qty,
        price: item.price,
        department: item.department,
        status: pick(['Sent', 'New', 'Sent']),
        firedAt: now - rand(5, 420) * 60 * 1000,
      });
    }

    const discountAmount = Math.random() > 0.85 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discountAmount;
    const status = pick(['Sent', 'Ready', 'Served', 'Paid', 'Paid']);

    const order = {
      id: `pos_${String(i + 1).padStart(3, '0')}`,
      outletId,
      items,
      status,
      total,
      subtotal,
      discountAmount,
      timestamp: now - rand(0, 18) * 60 * 60 * 1000,
      tips: status === 'Paid' ? rand(0, 12) : 0,
      paymentMethod: pick(paidMethods),
      orderType: outletId === 'outlet_ird'
        ? 'RoomService'
        : outletId === 'outlet_minibar'
          ? pick(['RoomService', 'TakeAway'])
          : pick(['DineIn', 'DineIn', 'TakeAway']),
      connectSection: outletId === 'outlet_ird' ? 'IRD' : 'Standard',
      guestCount: rand(1, 4),
      serverId: `emp_${String(rand(9, 14)).padStart(3, '0')}`,
      shiftId: `shift_emp_${String(rand(1, EMPLOYEE_TOTAL)).padStart(3, '0')}`,
      openedBy: pick(['Sarah M', 'Ahmed K', 'Priya S', 'Miguel S']),
      auditLog: [],
    };

    if (order.orderType === 'DineIn') {
      order.tableId = pick(dineInTables).id;
    } else {
      order.roomId = pick(occupiedRooms).id;
    }

    orders.push(order);
  }
  return orders;
};


const buildEvents = () => {
  const today = new Date();
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  };
  const events = [
    { id: 'evt_001', name: 'Tech Summit 2026', clientName: 'Bahrain Tech Council', type: 'Conference', startDate: addDays(today, 7), endDate: addDays(today, 8), pax: 120, venueId: 'ven_conf_a', status: 'Definite', totalValue: 4500, setupStyle: 'Classroom' },
    { id: 'evt_002', name: 'Corporate Gala Dinner', clientName: 'Al-Khalifa Holdings', type: 'Gala', startDate: addDays(today, 14), endDate: addDays(today, 14), pax: 80, venueId: 'ven_ballroom', status: 'Definite', totalValue: 8200, setupStyle: 'Banquet' },
    { id: 'evt_003', name: 'Wedding Reception - Al-Hassan', clientName: 'Al-Hassan Family', type: 'Wedding', startDate: addDays(today, 21), endDate: addDays(today, 21), pax: 200, venueId: 'ven_ballroom', status: 'Tentative', totalValue: 15600, setupStyle: 'Banquet' },
    { id: 'evt_004', name: 'Board Strategy Retreat', clientName: 'Gulf Finance Co', type: 'Meeting', startDate: addDays(today, 3), endDate: addDays(today, 4), pax: 24, venueId: 'ven_conf_b', status: 'Definite', totalValue: 2100, setupStyle: 'U-Shape' },
    { id: 'evt_005', name: 'Product Launch Evening', clientName: 'Innovate Gulf', type: 'Conference', startDate: addDays(today, 10), endDate: addDays(today, 10), pax: 60, venueId: 'ven_conf_a', status: 'Tentative', totalValue: 3800, setupStyle: 'Theater' },
  ];
  return events;
};

const buildLedgerEntries = (posOrders) => {
  const entries = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const dayStamp = now - dayOffset * dayMs;
    const businessDate = new Date(dayStamp).toISOString().slice(0, 10);
    const roomsRevenue = rand(2200, 4600);
    const fnbRevenue = rand(1400, 3600);
    const payrollExpense = rand(980, 1850);
    const maintenanceExpense = rand(220, 680);

    entries.push({
      id: `led_rooms_${businessDate}`,
      transactionId: `txn_rooms_${businessDate}`,
      date: dayStamp,
      businessDate,
      accountId: '4001',
      accountCode: '4001',
      debit: 0,
      credit: roomsRevenue,
      departmentId: 'FrontDesk',
      description: 'Rooms revenue posting',
      moduleSource: 'PMS',
    });
    entries.push({
      id: `led_fnb_${businessDate}`,
      transactionId: `txn_fnb_${businessDate}`,
      date: dayStamp,
      businessDate,
      accountId: '4101',
      accountCode: '4101',
      debit: 0,
      credit: fnbRevenue,
      departmentId: 'F&B',
      outletId: pick(['outlet_azure', 'outlet_lounge', 'outlet_ird', 'outlet_minibar']),
      posOrderId: pick(posOrders).id,
      description: 'F&B daily revenue posting',
      moduleSource: 'POS',
    });
    entries.push({
      id: `led_payroll_${businessDate}`,
      transactionId: `txn_payroll_${businessDate}`,
      date: dayStamp,
      businessDate,
      accountId: '5101',
      accountCode: '5101',
      debit: payrollExpense,
      credit: 0,
      departmentId: 'HR',
      description: 'Payroll accrual',
      moduleSource: 'Payroll',
    });
    entries.push({
      id: `led_maintenance_${businessDate}`,
      transactionId: `txn_maintenance_${businessDate}`,
      date: dayStamp,
      businessDate,
      accountId: '5201',
      accountCode: '5201',
      debit: maintenanceExpense,
      credit: 0,
      departmentId: 'Engineering',
      description: 'Maintenance expense posting',
      moduleSource: 'PMS',
    });
  }
  return entries;
};

const run = async () => {
  console.log('==================================================');
  console.log('Hotel Singularity Operational Seeder');
  console.log('Target: 20 rooms / 35 guests / 20 employees / 4 F&B outlets');
  console.log(`Property scope: ${PROPERTY_ID}`);
  console.log(`Seed scope: ${SEED_SCOPE}`);
  console.log('==================================================');

  const collectionsToReplace = [
    'rooms',
    'guests',
    'reservations',
    'folios',
    'tables',
    'outlets',
    'menuItems',
    'master_inventory',
    'posOrders',
    'tasks',
    'maintenanceTasks',
    'employees',
    'shifts',
    'ledgerEntries',
    'events',
    'systemRoles',
    'systemConfig',
  ];

  await clearCollections(collectionsToReplace);

  // Clear events from tenant-scoped path (app reads from properties/xxx/events)
  try {
    const eventsCol = collection(db, 'properties', PROPERTY_ID, 'events');
    const eventsSnap = await getDocs(eventsCol);
    if (!eventsSnap.empty) {
      const clearBatch = writeBatch(db);
      eventsSnap.docs.forEach((d) => clearBatch.delete(d.ref));
      await clearBatch.commit();
      console.log('[seed] Cleared', eventsSnap.size, 'events from properties/' + PROPERTY_ID + '/events');
    }
  } catch (e) {
    console.warn('[seed] Events clear (optional):', e.message);
  }

  const menuItems = buildMenuItems();
  const rooms = buildRooms();
  const { guests, reservations, folios } = buildGuestsReservationsFolios(rooms);
  const employees = buildEmployees();
  const shifts = buildShifts(employees);
  const tables = buildTables();
  const tasks = buildTasks();
  const maintenanceTasks = buildMaintenanceTasks();
  const posOrders = buildPosOrders(tables, rooms, menuItems);
  const ledgerEntries = buildLedgerEntries(posOrders);
  const events = buildEvents();

  const inventoryItems = inventoryCatalog.map((item, index) => ({
    id: `inv_${String(index + 1).padStart(3, '0')}`,
    ...item,
    locations: [
      { locationId: 'loc_main_store', locationName: 'Main Store', stock: Math.round(item.totalStock * 0.65) },
      { locationId: 'loc_fnb_store', locationName: 'F&B Store', stock: Math.round(item.totalStock * 0.35) },
    ],
  }));

  let batch = writeBatch(db);
  let opCount = 0;
  const writeDoc = async (collectionName, id, payload) => {
    for (const p of targetsFor(collectionName)) {
      const pathSegments = p.includes('/') ? p.split('/') : [p];
      const docRef = pathSegments.length > 1 ? doc(db, ...pathSegments, id) : doc(db, p, id);
      batch.set(docRef, payload);
      opCount += 1;
      if (opCount >= 420) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }
  };

  for (const outlet of outletDefs) await writeDoc('outlets', outlet.id, { ...outlet, createdAt: now });
  for (const role of roles) await writeDoc('systemRoles', role.id, { ...role, isSystemDefault: true, createdAt: now, updatedAt: now });
  for (const item of menuItems) await writeDoc('menuItems', item.id, item);
  for (const item of inventoryItems) await writeDoc('master_inventory', item.id, item);
  for (const room of rooms) await writeDoc('rooms', room.id, room);
  for (const guest of guests) await writeDoc('guests', guest.id, guest);
  for (const reservation of reservations) await writeDoc('reservations', reservation.id, reservation);
  for (const folio of folios) await writeDoc('folios', folio.id, folio);
  for (const employee of employees) await writeDoc('employees', employee.id, employee);
  for (const shift of shifts) await writeDoc('shifts', shift.id, shift);
  for (const table of tables) await writeDoc('tables', table.id, table);
  for (const order of posOrders) await writeDoc('posOrders', order.id, order);
  for (const task of tasks) await writeDoc('tasks', task.id, task);
  for (const task of maintenanceTasks) await writeDoc('maintenanceTasks', task.id, task);
  for (const entry of ledgerEntries) await writeDoc('ledgerEntries', entry.id, entry);
  for (const evt of events) {
    
    const docRef = doc(db, 'properties', PROPERTY_ID, 'events', evt.id);
    batch.set(docRef, evt);
    opCount += 1;
    if (opCount >= 420) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  await writeDoc('systemConfig', 'settings', {
    hotelName: 'Hotel Singularity - Operational Demo',
    propertyId: PROPERTY_ID,
    category: 'Urban Hotel',
    totalRooms: ROOM_TOTAL,
    totalGuests: GUEST_TOTAL,
    totalEmployees: EMPLOYEE_TOTAL,
    fnbOutlets: outletDefs.length,
    mode: 'operational_20_room_demo',
    currency: 'USD',
    arrivalsToday: reservations.filter((r) => r.status === 'Confirmed').length,
    inHouseGuests: reservations.filter((r) => r.status === 'Checked In').length,
    updatedAt: serverTimestamp(),
  });

  if (opCount > 0) {
    await batch.commit();
  }

  console.log('--------------------------------------------------');
  console.log('Seed complete.');
  console.log(`Rooms: ${rooms.length}`);
  console.log(`Guests: ${guests.length}`);
  console.log(`Reservations: ${reservations.length}`);
  console.log(`Employees: ${employees.length}`);
  console.log(`Outlets: ${outletDefs.length}`);
  console.log(`Menu Items: ${menuItems.length}`);
  console.log(`POS Orders: ${posOrders.length}`);
  console.log(`Operational Tasks: ${tasks.length}`);
  console.log(`Maintenance Tasks: ${maintenanceTasks.length}`);
  console.log(`Events: ${events.length}`);
  console.log('--------------------------------------------------');
};

run().catch((error) => {
  console.error('[seed] Failed:', error);
  process.exit(1);
});
