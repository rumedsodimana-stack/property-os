import { initializeApp } from 'firebase/app';
import {
  getFirestore,
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

const PROPERTY_ID = process.env.PROPERTY_ID || 'demo_property_h2';
const CHAIN_ID = process.env.CHAIN_ID || 'demo_chain_001';

const ROOM_TOTAL = 10;
const GUEST_TOTAL = 20;
const EMPLOYEE_TOTAL = 20;
const OUTLET_TOTAL = 2;
const CHECKED_IN_TOTAL = 8;

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const firstNames = [
  'Nora', 'Adam', 'Mona', 'Karim', 'Lina', 'Hassan', 'Ava', 'Owen', 'Maya', 'Elias',
  'Farah', 'Yousef', 'Sara', 'Noah', 'Layla', 'Daniel', 'Rana', 'Ibrahim', 'Emma', 'Liam',
  'Amal', 'Khalid', 'Sofia', 'Lucas', 'Mariam', 'Zaid', 'Yara', 'Tariq', 'Aiden', 'Leen',
];
const lastNames = [
  'Haddad', 'Rahman', 'Mansoor', 'Iqbal', 'Nasser', 'Khan', 'Shaikh', 'Yusuf', 'Ali',
  'Malik', 'Saleh', 'Morsi', 'Farid', 'Mahmoud', 'Anwar', 'Hamdan', 'Darwish', 'Jabri',
];

const roomTypes = [
  { id: 'rt_superior', rate: 140, weight: 0.5 },
  { id: 'rt_deluxe', rate: 210, weight: 0.35 },
  { id: 'rt_junior_suite', rate: 320, weight: 0.15 },
];

const outlets = [
  {
    id: 'outlet_bistro_h2',
    name: 'Cedar Bistro',
    type: 'Restaurant',
    seatingCapacity: 44,
    description: 'All-day bistro for breakfast to dinner',
    operatingHours: { open: '06:30', close: '22:30' },
    taxRate: 0.1,
    gratuityRate: 0.1,
    kdsEnabled: true,
    color: '#16a34a',
    isActive: true,
  },
  {
    id: 'outlet_ird_h2',
    name: 'In-Room Dining',
    type: 'RoomService',
    seatingCapacity: 10,
    description: '24-hour room dining service',
    operatingHours: { open: '00:00', close: '23:59' },
    taxRate: 0.1,
    gratuityRate: 0.12,
    kdsEnabled: true,
    color: '#0ea5e9',
    isActive: true,
  },
];

const menuItems = [
  { id: 'h2_menu_001', outletId: 'outlet_bistro_h2', name: 'Arabic Breakfast Set', price: 15, category: 'Breakfast', isHalal: true, isVegan: false, allergens: ['Dairy'], department: 'Food' },
  { id: 'h2_menu_002', outletId: 'outlet_bistro_h2', name: 'Labneh & Zaatar Flatbread', price: 9, category: 'Breakfast', isHalal: true, isVegan: false, allergens: ['Gluten', 'Dairy'], department: 'Food' },
  { id: 'h2_menu_003', outletId: 'outlet_bistro_h2', name: 'Chicken Shawarma Bowl', price: 14, category: 'Lunch', isHalal: true, isVegan: false, allergens: [], department: 'Food' },
  { id: 'h2_menu_004', outletId: 'outlet_bistro_h2', name: 'Grilled Halloumi Salad', price: 12, category: 'Lunch', isHalal: true, isVegan: false, allergens: ['Dairy'], department: 'Food' },
  { id: 'h2_menu_005', outletId: 'outlet_bistro_h2', name: 'Lamb Kofta Platter', price: 18, category: 'Dinner', isHalal: true, isVegan: false, allergens: [], department: 'Food' },
  { id: 'h2_menu_006', outletId: 'outlet_bistro_h2', name: 'Vegetable Tagine', price: 13, category: 'Dinner', isHalal: true, isVegan: true, allergens: [], department: 'Food' },
  { id: 'h2_menu_007', outletId: 'outlet_bistro_h2', name: 'Date Pudding', price: 7, category: 'Dessert', isHalal: true, isVegan: false, allergens: ['Gluten', 'Dairy'], department: 'Food' },
  { id: 'h2_menu_008', outletId: 'outlet_bistro_h2', name: 'Mint Lemonade', price: 5, category: 'Beverage', isHalal: true, isVegan: true, allergens: [], department: 'Beverage' },
  { id: 'h2_menu_009', outletId: 'outlet_ird_h2', name: 'IRD Breakfast Tray', price: 17, category: 'Breakfast', isHalal: true, isVegan: false, allergens: ['Gluten', 'Dairy'], department: 'Food' },
  { id: 'h2_menu_010', outletId: 'outlet_ird_h2', name: 'Club Sandwich', price: 12, category: 'Main', isHalal: true, isVegan: false, allergens: ['Gluten'], department: 'Food' },
  { id: 'h2_menu_011', outletId: 'outlet_ird_h2', name: 'Chicken Biryani', price: 16, category: 'Main', isHalal: true, isVegan: false, allergens: [], department: 'Food' },
  { id: 'h2_menu_012', outletId: 'outlet_ird_h2', name: 'Pasta Pomodoro', price: 11, category: 'Main', isHalal: true, isVegan: true, allergens: ['Gluten'], department: 'Food' },
  { id: 'h2_menu_013', outletId: 'outlet_ird_h2', name: 'Fresh Fruit Plate', price: 8, category: 'Dessert', isHalal: true, isVegan: true, allergens: [], department: 'Food' },
  { id: 'h2_menu_014', outletId: 'outlet_ird_h2', name: 'Soft Drink', price: 4, category: 'Beverage', isHalal: true, isVegan: true, allergens: [], department: 'Beverage' },
];

const suppliers = [
  {
    id: 'h2_sup_001',
    name: 'Bahrain Fresh Produce Co',
    category: 'Food',
    rating: 4.6,
    paymentTerms: 'Net 30',
    currency: 'BHD',
    contactEmail: 'ops@freshproduce.bh',
    contactName: 'Nabil Kareem',
    contactPhone: '+97333001122',
    taxId: 'VAT-BH-88110',
    address: 'Sitra Industrial Zone, Bahrain',
    complianceFlags: { halal: true, zatca: false, sustainable: true, isoCertified: true },
    historicalPerformance: [],
  },
  {
    id: 'h2_sup_002',
    name: 'Gulf Hospitality Supplies',
    category: 'Operating Supplies',
    rating: 4.3,
    paymentTerms: 'Net 45',
    currency: 'BHD',
    contactEmail: 'sales@gulfhs.com',
    contactName: 'Reem Adel',
    contactPhone: '+97333992211',
    taxId: 'VAT-BH-77410',
    address: 'Manama Trade District, Bahrain',
    complianceFlags: { halal: true, zatca: false, sustainable: false, isoCertified: true },
    historicalPerformance: [],
  },
  {
    id: 'h2_sup_003',
    name: 'Arabian Beverages Distribution',
    category: 'Beverage',
    rating: 4.4,
    paymentTerms: 'Net 30',
    currency: 'BHD',
    contactEmail: 'procurement@abdistro.bh',
    contactName: 'Fares Naji',
    contactPhone: '+97333114455',
    taxId: 'VAT-BH-66220',
    address: 'Hidd Logistics Park, Bahrain',
    complianceFlags: { halal: true, zatca: false, sustainable: true, isoCertified: false },
    historicalPerformance: [],
  },
];

const procurementRequests = [
  {
    id: 'h2_req_001',
    requesterId: 'emp_h2_010',
    department: 'F&B',
    items: [
      { description: 'Chicken breast fresh', qty: 40, unit: 'kg', estimatedCost: 120 },
      { description: 'Seasonal vegetables', qty: 60, unit: 'kg', estimatedCost: 90 },
    ],
    status: 'Pending Approval',
    dateRequested: now - 2 * dayMs,
    priority: 'High',
    notes: 'Weekly replenishment for bistro operations',
    aiSuggested: true,
  },
  {
    id: 'h2_req_002',
    requesterId: 'emp_h2_006',
    department: 'Housekeeping',
    items: [
      { description: 'Guest amenity kits', qty: 100, unit: 'pcs', estimatedCost: 180 },
    ],
    status: 'Approved',
    dateRequested: now - dayMs,
    priority: 'Medium',
    notes: 'Room turnover stock',
    aiSuggested: false,
  },
  {
    id: 'h2_req_003',
    requesterId: 'emp_h2_017',
    department: 'Engineering',
    items: [
      { description: 'HVAC air filters', qty: 20, unit: 'pcs', estimatedCost: 140 },
      { description: 'LED lamp sets', qty: 30, unit: 'pcs', estimatedCost: 95 },
    ],
    status: 'Pending Approval',
    dateRequested: now - 3 * dayMs,
    priority: 'Emergency',
    notes: 'Preventive maintenance sprint',
    aiSuggested: true,
  },
];

const rfqs = [
  {
    id: 'h2_rfq_001',
    requestId: 'h2_req_001',
    items: [
      { description: 'Chicken breast fresh', qty: 40, unit: 'kg' },
      { description: 'Seasonal vegetables', qty: 60, unit: 'kg' },
    ],
    invitedSuppliers: ['h2_sup_001', 'h2_sup_003'],
    bids: [
      { supplierId: 'h2_sup_001', amount: 198, date: now - dayMs },
      { supplierId: 'h2_sup_003', amount: 214, date: now - dayMs },
    ],
    status: 'Open',
    deadline: now + 2 * dayMs,
    dateIssued: now - dayMs,
  },
  {
    id: 'h2_rfq_002',
    requestId: 'h2_req_003',
    items: [
      { description: 'HVAC air filters', qty: 20, unit: 'pcs' },
      { description: 'LED lamp sets', qty: 30, unit: 'pcs' },
    ],
    invitedSuppliers: ['h2_sup_002'],
    bids: [
      { supplierId: 'h2_sup_002', amount: 252, date: now - 2 * dayMs },
    ],
    status: 'Open',
    deadline: now + dayMs,
    dateIssued: now - 2 * dayMs,
  },
];

const purchaseOrders = [
  {
    id: 'h2_po_001',
    rfqId: 'h2_rfq_001',
    supplierId: 'h2_sup_001',
    items: [
      { description: 'Chicken breast fresh', qty: 40, unit: 'kg', cost: 2.4, total: 96 },
      { description: 'Seasonal vegetables', qty: 60, unit: 'kg', cost: 1.7, total: 102 },
    ],
    total: 198,
    currency: 'BHD',
    status: 'Sent',
    dateIssued: now - 12 * 60 * 60 * 1000,
    expectedDelivery: now + 36 * 60 * 60 * 1000,
    complianceChecked: true,
    ePoFlag: true,
  },
  {
    id: 'h2_po_002',
    rfqId: 'h2_rfq_002',
    supplierId: 'h2_sup_002',
    items: [
      { description: 'HVAC air filters', qty: 20, unit: 'pcs', cost: 6.5, total: 130 },
      { description: 'LED lamp sets', qty: 30, unit: 'pcs', cost: 4.1, total: 123 },
    ],
    total: 253,
    currency: 'BHD',
    status: 'Partially Received',
    dateIssued: now - 2 * dayMs,
    expectedDelivery: now + dayMs,
    complianceChecked: true,
    ePoFlag: true,
  },
  {
    id: 'h2_po_003',
    supplierId: 'h2_sup_003',
    items: [
      { description: 'Soft drinks assortment', qty: 24, unit: 'case', cost: 3.7, total: 88.8 },
      { description: 'Mineral water 330ml', qty: 30, unit: 'case', cost: 2.6, total: 78 },
    ],
    total: 166.8,
    currency: 'BHD',
    status: 'Received',
    dateIssued: now - 5 * dayMs,
    expectedDelivery: now - 3 * dayMs,
    complianceChecked: true,
    ePoFlag: false,
  },
];

const invoices = [
  {
    id: 'h2_inv_001',
    supplierId: 'h2_sup_003',
    poId: 'h2_po_003',
    amount: 166.8,
    status: 'Approved',
    issueDate: now - 4 * dayMs,
    dueDate: now + 26 * dayMs,
    vatAmount: 16.68,
    totalWithVat: 183.48,
  },
  {
    id: 'h2_inv_002',
    supplierId: 'h2_sup_001',
    poId: 'h2_po_001',
    amount: 198,
    status: 'Pending',
    issueDate: now - 6 * 60 * 60 * 1000,
    dueDate: now + 30 * dayMs,
    vatAmount: 19.8,
    totalWithVat: 217.8,
  },
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

const roomNumber = (i) => `2${String(i + 1).padStart(2, '0')}`;
const fullName = (i) => `${firstNames[i % firstNames.length]} ${lastNames[(i * 2) % lastNames.length]}`;

const checkInOut = (offset, stay) => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + offset);
  checkIn.setHours(15, rand(0, 45), 0, 0);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + stay);
  checkOut.setHours(11, rand(0, 30), 0, 0);
  return { checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString() };
};

const scoped = (name) => `properties/${PROPERTY_ID}/${name}`;

const clearCollections = async (names) => {
  for (const name of names) {
    const path = scoped(name);
    const snap = await getDocs(collection(db, path));
    if (snap.empty) continue;
    let batch = writeBatch(db);
    let count = 0;
    for (const d of snap.docs) {
      batch.delete(d.ref);
      count += 1;
      if (count >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
    console.log(`[seed-h2] Cleared ${snap.size} docs from ${path}`);
  }
};

const buildRooms = () => {
  const rooms = [];
  for (let i = 0; i < ROOM_TOTAL; i += 1) {
    const t = weightedRoomType();
    const occupied = i < CHECKED_IN_TOTAL;
    const number = roomNumber(i);
    rooms.push({
      id: `h2_room_${number}`,
      number,
      typeId: t.id,
      status: occupied ? 'Occupied' : pick(['Clean/Ready', 'Clean/Inspected']),
      attributes: [
        { id: `view_${number}`, name: pick(['City View', 'Garden View']), type: 'View', priceModifier: 0 },
        { id: `bed_${number}`, name: pick(['King Bed', 'Twin Beds']), type: 'Bed', priceModifier: 0 },
      ],
      connectsTo: [],
      isVirtual: false,
      componentRoomIds: [],
      maintenanceProfile: {
        lastRenovated: now - rand(180, 900) * dayMs,
        conditionScore: rand(85, 98),
        noiseLevel: pick(['Low', 'Medium']),
        features: ['Smart TV', 'Rain Shower', 'Desk'],
        openTickets: 0,
      },
      iotStatus: {
        temp: rand(20, 24),
        lights: occupied ? rand(20, 80) : 0,
        doorLocked: true,
        carbonFootprint: Number((Math.random() * 1.8 + 0.8).toFixed(2)),
        humidity: rand(38, 54),
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
  const occupiedRooms = rooms.slice(0, CHECKED_IN_TOTAL);
  const futureRoomPool = rooms.slice(CHECKED_IN_TOTAL);

  for (let i = 0; i < GUEST_TOTAL; i += 1) {
    const guestId = `h2_guest_${String(i + 1).padStart(3, '0')}`;
    const reservationId = `h2_res_${String(i + 1).padStart(3, '0')}`;
    const folioId = `h2_folio_${String(i + 1).padStart(3, '0')}`;
    const name = fullName(i + 50);

    guests.push({
      id: guestId,
      principal: guestId,
      fullName: name,
      role: 'Guest',
      hotelId: PROPERTY_ID,
      loyaltyTier: pick(['Silver', 'Gold', 'Platinum']),
      preferences: {
        language: pick(['en', 'ar']),
        temperature: rand(20, 24),
        dietary: pick([[], ['Halal'], ['Vegetarian']]),
      },
      valenceHistory: [],
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@property2.test`,
      nationality: pick(['Bahrain', 'Saudi Arabia', 'UAE', 'India']),
    });

    let status = 'Confirmed';
    let roomId = null;
    let roomType = weightedRoomType();
    let window;

    if (i < CHECKED_IN_TOTAL) {
      status = 'Checked In';
      const room = occupiedRooms[i];
      roomId = room.id;
      room.currentGuestId = guestId;
      room.assignedReservationId = reservationId;
      roomType = roomTypes.find((t) => t.id === room.typeId) || roomType;
      window = checkInOut(-rand(0, 2), rand(2, 5));
    } else {
      const room = pick(futureRoomPool);
      roomId = room?.id || null;
      if (room) roomType = roomTypes.find((t) => t.id === room.typeId) || roomType;
      window = checkInOut(rand(0, 12), rand(2, 5));
    }

    reservations.push({
      id: reservationId,
      guestId,
      guestName: name,
      propertyId: PROPERTY_ID,
      ...(roomId ? { roomId } : {}),
      roomTypeId: roomType.id,
      checkIn: window.checkIn,
      checkOut: window.checkOut,
      adults: rand(1, 3),
      children: rand(0, 2),
      status,
      folioId,
      rateApplied: roomType.rate,
      noShowProbability: status === 'Checked In' ? 0 : Number((Math.random() * 0.1).toFixed(2)),
      paymentMethod: pick(['Credit Card', 'Corporate']),
      accompanyingGuests: [],
      channel: pick(['Direct', 'Booking.com', 'Corporate']),
    });

    folios.push({
      id: folioId,
      reservationId,
      guestId,
      guestName: name,
      charges: status === 'Checked In'
        ? [{
          id: `h2_chg_${i + 1}`,
          category: 'Room',
          description: 'Room stay charges',
          amount: roomType.rate * rand(1, 2),
          timestamp: now - rand(2, 24) * 60 * 60 * 1000,
          businessDate: new Date().toISOString().slice(0, 10),
        }]
        : [],
      balance: status === 'Checked In' ? roomType.rate * rand(1, 2) : 0,
      status: 'Open',
    });
  }
  return { guests, reservations, folios };
};

const buildEmployees = () => {
  const positions = [
    ['General Manager', 'Management'],
    ['Front Office Supervisor', 'Front Office'],
    ['Front Desk Agent', 'Front Office'],
    ['Front Desk Agent', 'Front Office'],
    ['Concierge', 'Front Office'],
    ['Housekeeping Supervisor', 'Housekeeping'],
    ['Room Attendant', 'Housekeeping'],
    ['Room Attendant', 'Housekeeping'],
    ['Laundry Attendant', 'Housekeeping'],
    ['F&B Supervisor', 'F&B'],
    ['Waiter', 'F&B'],
    ['Waiter', 'F&B'],
    ['IRD Agent', 'F&B'],
    ['Commis Chef', 'Kitchen'],
    ['Chef de Partie', 'Kitchen'],
    ['Chief Engineer', 'Engineering'],
    ['Technician', 'Engineering'],
    ['Procurement Officer', 'Procurement'],
    ['HR Officer', 'HR'],
    ['Night Auditor', 'Finance'],
  ];

  const employees = [];
  for (let i = 0; i < EMPLOYEE_TOTAL; i += 1) {
    const [jobTitle, departmentName] = positions[i];
    const id = `emp_h2_${String(i + 1).padStart(3, '0')}`;
    const salary = rand(420, 1900);
    const hireDate = now - rand(120, 1900) * dayMs;
    employees.push({
      id,
      principal: id,
      employeeId: `H2EMP${String(i + 1).padStart(3, '0')}`,
      fullName: fullName(i + 100),
      role: jobTitle,
      nationality: pick(['Bahrain', 'India', 'Jordan', 'Egypt', 'Nepal', 'Philippines']),
      jobDescriptionId: `h2_jd_${i + 1}`,
      jobTitle,
      departmentId: departmentName.toLowerCase().replace(/\s+/g, '_'),
      departmentName,
      costCenterId: `h2_cc_${departmentName.toLowerCase().replace(/\s+/g, '_')}`,
      payGradeId: `h2_pg_${rand(1, 6)}`,
      systemRoleId: departmentName === 'HR' ? 'hr_manager' : 'frontdesk_agent',
      contractType: pick(['Full-time', 'Full-time', 'Part-time']),
      hireDate,
      probationEndDate: hireDate + 90 * dayMs,
      confirmationDate: hireDate + 120 * dayMs,
      reportingManagerId: i === 0 ? null : 'emp_h2_001',
      basicSalary: salary,
      currency: 'BHD',
      hourlyRate: Number((salary / 180).toFixed(2)),
      overtimeRate: Number((salary / 180 * 1.5).toFixed(2)),
      allowances: [{ name: 'Transport', amount: rand(15, 90) }],
      status: i === 5 || i === 14 ? 'OnLeave' : 'Active',
      performanceScore: rand(72, 94),
      aiPerformanceScore: rand(74, 96),
      performanceFeedback: ['Steady operational performance'],
      skills: [
        { name: pick(['Service', 'Compliance', 'POS', 'Operations']), score: rand(70, 95) },
      ],
      crossTrainedRoleIds: [],
      certifications: [{ name: 'Mandatory Safety', issuedAt: now - rand(40, 320) * dayMs }],
      trainingProgress: [{ moduleId: 'orientation', status: 'Completed', score: rand(80, 98) }],
      gratuityStartDate: hireDate,
      accruedGratuity: rand(5000, 60000),
      promotionHistory: [],
      salaryHistory: [],
      transferHistory: [],
      auditLog: [],
      workPermitExpiry: now + rand(120, 520) * dayMs,
    });
  }
  return employees;
};

const buildShifts = (employees) => {
  const date = new Date().toISOString().slice(0, 10);
  return employees.map((e, i) => ({
    id: `h2_shift_${e.id}`,
    employeeId: e.id,
    employeeName: e.fullName,
    department: e.departmentName,
    type: i % 3 === 0 ? 'Morning' : i % 3 === 1 ? 'Afternoon' : 'Night',
    date,
    startTime: i % 3 === 0 ? '07:00' : i % 3 === 1 ? '15:00' : '23:00',
    endTime: i % 3 === 0 ? '15:00' : i % 3 === 1 ? '23:00' : '07:00',
    start: `${date}T07:00:00.000Z`,
    end: `${date}T15:00:00.000Z`,
    status: pick(['Scheduled', 'ClockedIn', 'Completed']),
  }));
};

const buildTables = () => {
  const tables = [];
  for (let i = 1; i <= 10; i += 1) {
    tables.push({
      id: `h2_table_${i}`,
      number: `${i}`,
      seats: pick([2, 2, 4, 4, 6]),
      status: pick(['Available', 'Occupied', 'Reserved']),
      outletId: 'outlet_bistro_h2',
      section: i <= 6 ? 'Main' : 'Window',
    });
  }
  return tables;
};

const buildInventory = () => ([
  { id: 'h2_inv_001', sku: 'H2-FOOD-01', name: 'Chicken Breast', category: 'Food', unit: 'kg', costPerUnit: 1.8, totalStock: 60, parLevel: 35, reorderPoint: 25 },
  { id: 'h2_inv_002', sku: 'H2-FOOD-02', name: 'Basmati Rice', category: 'Food', unit: 'kg', costPerUnit: 0.9, totalStock: 80, parLevel: 50, reorderPoint: 35 },
  { id: 'h2_inv_003', sku: 'H2-BEV-01', name: 'Soft Drink Can', category: 'Beverage', unit: 'case', costPerUnit: 2.2, totalStock: 28, parLevel: 18, reorderPoint: 12 },
  { id: 'h2_inv_004', sku: 'H2-BEV-02', name: 'Mineral Water', category: 'Beverage', unit: 'case', costPerUnit: 2.0, totalStock: 34, parLevel: 20, reorderPoint: 14 },
  { id: 'h2_inv_005', sku: 'H2-OPS-01', name: 'Amenity Kit', category: 'Operating Supplies', unit: 'box', costPerUnit: 5.2, totalStock: 18, parLevel: 12, reorderPoint: 8 },
]).map((item) => ({
  ...item,
  locations: [
    { locationId: 'h2_main_store', locationName: 'Main Store', stock: Math.round(item.totalStock * 0.7) },
    { locationId: 'h2_ops_store', locationName: 'Operations Store', stock: Math.round(item.totalStock * 0.3) },
  ],
}));

const buildTasks = () => {
  const list = [];
  const departments = ['Housekeeping', 'IRD', 'General', 'Maintenance', 'MiniBar'];
  for (let i = 0; i < 14; i += 1) {
    list.push({
      id: `h2_task_${String(i + 1).padStart(3, '0')}`,
      title: pick(['Guest request follow-up', 'Room readiness', 'IRD delivery', 'Mini bar refill', 'Late checkout preparation']),
      description: 'Operational task for compact property.',
      department: pick(departments),
      assigneeId: `emp_h2_${String(rand(1, EMPLOYEE_TOTAL)).padStart(3, '0')}`,
      delegatorId: 'emp_h2_001',
      acceptedBy: null,
      priority: pick(['Low', 'Medium', 'High']),
      status: pick(['Open', 'In Progress', 'Done']),
      dueDate: now + rand(-45, 180) * 60 * 1000,
      aiSuggested: Math.random() > 0.4,
    });
  }
  return list;
};

const buildMaintenanceTasks = () => {
  const list = [];
  for (let i = 0; i < 6; i += 1) {
    list.push({
      id: `h2_mnt_${String(i + 1).padStart(3, '0')}`,
      assetId: `h2_asset_${String(i + 1).padStart(3, '0')}`,
      type: pick(['Preventive', 'Corrective']),
      description: pick(['AC check', 'Light replacement', 'Door lock battery', 'Plumbing check']),
      priority: pick(['Low', 'Medium', 'High']),
      status: pick(['Open', 'In Progress', 'Completed']),
      technicianId: `emp_h2_${String(rand(16, 17)).padStart(3, '0')}`,
    });
  }
  return list;
};

const buildPosOrders = (tables, rooms) => {
  const inHouseRooms = rooms.slice(0, CHECKED_IN_TOTAL);
  const result = [];
  for (let i = 0; i < 22; i += 1) {
    const isIrd = Math.random() > 0.55;
    const outletId = isIrd ? 'outlet_ird_h2' : 'outlet_bistro_h2';
    const pool = menuItems.filter((m) => m.outletId === outletId);
    const itemCount = rand(1, 3);
    const items = [];
    let subtotal = 0;
    for (let j = 0; j < itemCount; j += 1) {
      const m = pick(pool);
      const qty = rand(1, 2);
      subtotal += m.price * qty;
      items.push({
        menuItemId: m.id,
        name: m.name,
        qty,
        price: m.price,
        department: m.department,
        status: pick(['New', 'Sent', 'Sent']),
        firedAt: now - rand(10, 400) * 60 * 1000,
      });
    }
    const discountAmount = Math.random() > 0.9 ? Math.round(subtotal * 0.08) : 0;
    const total = subtotal - discountAmount;
    const order = {
      id: `h2_pos_${String(i + 1).padStart(3, '0')}`,
      outletId,
      items,
      status: pick(['Sent', 'Ready', 'Served', 'Paid']),
      total,
      subtotal,
      discountAmount,
      timestamp: now - rand(0, 14) * 60 * 60 * 1000,
      tips: rand(0, 8),
      paymentMethod: pick(['Card', 'Cash', 'RoomPost']),
      orderType: isIrd ? 'RoomService' : pick(['DineIn', 'TakeAway']),
      connectSection: isIrd ? 'IRD' : 'Standard',
      guestCount: rand(1, 3),
      serverId: `emp_h2_${String(rand(10, 13)).padStart(3, '0')}`,
      shiftId: `h2_shift_emp_h2_${String(rand(1, EMPLOYEE_TOTAL)).padStart(3, '0')}`,
      openedBy: pick(['Cedar Team A', 'Cedar Team B']),
      auditLog: [],
    };
    if (order.orderType === 'DineIn') {
      order.tableId = pick(tables).id;
    } else {
      order.roomId = pick(inHouseRooms).id;
    }
    result.push(order);
  }
  return result;
};

const run = async () => {
  console.log('==================================================');
  console.log('Second Property Seeder');
  console.log(`Property: ${PROPERTY_ID}`);
  console.log('Target: 10 rooms / 20 guests / 20 staff / 2 outlets + procurement');
  console.log('==================================================');

  await clearCollections([
    'rooms',
    'guests',
    'reservations',
    'folios',
    'employees',
    'shifts',
    'tables',
    'outlets',
    'menuItems',
    'master_inventory',
    'posOrders',
    'tasks',
    'maintenanceTasks',
    'suppliers',
    'procurementRequests',
    'rfqs',
    'purchaseOrders',
    'invoices',
    'systemRoles',
    'systemConfig',
    'ledgerEntries',
  ]);

  const rooms = buildRooms();
  const { guests, reservations, folios } = buildGuestsReservationsFolios(rooms);
  const employees = buildEmployees();
  const shifts = buildShifts(employees);
  const tables = buildTables();
  const inventory = buildInventory();
  const tasks = buildTasks();
  const maintenanceTasks = buildMaintenanceTasks();
  const posOrders = buildPosOrders(tables, rooms);

  const ledgerEntries = [
    {
      id: 'h2_ledger_001',
      transactionId: 'h2_txn_001',
      date: now - dayMs,
      businessDate: new Date(now - dayMs).toISOString().slice(0, 10),
      accountId: '4001',
      accountCode: '4001',
      debit: 0,
      credit: 1680,
      departmentId: 'FrontDesk',
      description: 'Rooms revenue daily posting',
      moduleSource: 'PMS',
    },
    {
      id: 'h2_ledger_002',
      transactionId: 'h2_txn_002',
      date: now - dayMs,
      businessDate: new Date(now - dayMs).toISOString().slice(0, 10),
      accountId: '4101',
      accountCode: '4101',
      debit: 0,
      credit: 920,
      departmentId: 'F&B',
      outletId: 'outlet_bistro_h2',
      description: 'F&B revenue posting',
      moduleSource: 'POS',
    },
  ];

  let batch = writeBatch(db);
  let opCount = 0;
  const setScoped = async (collectionName, id, payload) => {
    batch.set(doc(db, scoped(collectionName), id), payload);
    opCount += 1;
    if (opCount >= 420) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  };

  // Top-level property registry documents for portfolio switching.
  batch.set(doc(db, 'properties', 'demo_property_h1'), {
    id: 'demo_property_h1',
    chainId: CHAIN_ID,
    name: 'Hotel Singularity Downtown',
    location: 'Manama, Bahrain',
    currency: 'USD',
    taxRate: 0.1,
    timezone: 'Asia/Bahrain',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(db, 'properties', PROPERTY_ID), {
    id: PROPERTY_ID,
    chainId: CHAIN_ID,
    name: 'Hotel Singularity Marina Annex',
    location: 'Muharraq, Bahrain',
    currency: 'BHD',
    taxRate: 0.1,
    timezone: 'Asia/Bahrain',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  opCount += 2;

  const systemRoles = [
    { id: 'gm', name: 'General Manager', description: 'Property leadership', permissions: ['*'], isSystemDefault: true, createdAt: now, updatedAt: now },
    { id: 'frontdesk_agent', name: 'Front Desk Agent', description: 'PMS operations', permissions: ['pms.read', 'pms.write'], isSystemDefault: true, createdAt: now, updatedAt: now },
    { id: 'fnb_manager', name: 'F&B Manager', description: 'Outlet ops', permissions: ['pos.read', 'pos.write'], isSystemDefault: true, createdAt: now, updatedAt: now },
    { id: 'hr_manager', name: 'HR Manager', description: 'People operations', permissions: ['hr.read', 'hr.write'], isSystemDefault: true, createdAt: now, updatedAt: now },
  ];

  for (const x of outlets) await setScoped('outlets', x.id, { ...x, createdAt: now });
  for (const x of menuItems) await setScoped('menuItems', x.id, x);
  for (const x of inventory) await setScoped('master_inventory', x.id, x);
  for (const x of rooms) await setScoped('rooms', x.id, x);
  for (const x of guests) await setScoped('guests', x.id, x);
  for (const x of reservations) await setScoped('reservations', x.id, x);
  for (const x of folios) await setScoped('folios', x.id, x);
  for (const x of employees) await setScoped('employees', x.id, x);
  for (const x of shifts) await setScoped('shifts', x.id, x);
  for (const x of tables) await setScoped('tables', x.id, x);
  for (const x of posOrders) await setScoped('posOrders', x.id, x);
  for (const x of tasks) await setScoped('tasks', x.id, x);
  for (const x of maintenanceTasks) await setScoped('maintenanceTasks', x.id, x);
  for (const x of suppliers) await setScoped('suppliers', x.id, x);
  for (const x of procurementRequests) await setScoped('procurementRequests', x.id, x);
  for (const x of rfqs) await setScoped('rfqs', x.id, x);
  for (const x of purchaseOrders) await setScoped('purchaseOrders', x.id, x);
  for (const x of invoices) await setScoped('invoices', x.id, x);
  for (const x of ledgerEntries) await setScoped('ledgerEntries', x.id, x);
  for (const x of systemRoles) await setScoped('systemRoles', x.id, x);

  await setScoped('systemConfig', 'settings', {
    hotelName: 'Hotel Singularity Marina Annex',
    propertyId: PROPERTY_ID,
    category: 'Business Hotel',
    totalRooms: ROOM_TOTAL,
    totalGuests: GUEST_TOTAL,
    totalEmployees: EMPLOYEE_TOTAL,
    fnbOutlets: OUTLET_TOTAL,
    currency: 'BHD',
    mode: 'second_property_compact_demo',
    updatedAt: serverTimestamp(),
  });

  if (opCount > 0) {
    await batch.commit();
  }

  console.log('--------------------------------------------------');
  console.log(`[seed-h2] Property ${PROPERTY_ID} ready.`);
  console.log(`rooms=${rooms.length} guests=${guests.length} reservations=${reservations.length} employees=${employees.length}`);
  console.log(`outlets=${outlets.length} menuItems=${menuItems.length}`);
  console.log(`suppliers=${suppliers.length} requests=${procurementRequests.length} rfqs=${rfqs.length} pos=${purchaseOrders.length} invoices=${invoices.length}`);
  console.log('--------------------------------------------------');
};

run().catch((error) => {
  console.error('[seed-h2] Failed:', error);
  process.exit(1);
});
