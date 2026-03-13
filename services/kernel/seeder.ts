/**
 * Hotel Singularity OS — Demo Property Seeder
 *
 * Populates demo_property_h1 and demo_property_h2 with realistic sample data
 * so the ops app looks live from the first login.
 *
 * STRICT RULE: Only runs for propertyIds that start with 'demo_property_'.
 * Real enrolled hotels NEVER trigger this path.
 *
 * NOTE: Cannot import from persistence.ts — circular dependency (persistence imports seeder).
 * We write the property config cache directly to localStorage instead.
 */

import { db } from './firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { tenantService } from './tenantService';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PROPERTY_CONFIG_LS_KEY = 'property_config';
const PROPERTY_CONFIG_UPDATED_EVENT = 'hs:property-config-updated';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const MS_PER_DAY = 86_400_000;
const nowMs = () => Date.now();
const dateStr = (offsetDays: number) =>
    new Date(nowMs() + offsetDays * MS_PER_DAY).toISOString().split('T')[0];
const uid = (prefix: string, n: number | string) => `${prefix}_${n}`;

/** Persist to the localStorage key that CURRENT_PROPERTY getters and getPropertyConfig() both read. */
function cachePropertyConfig(config: Record<string, unknown>): void {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(PROPERTY_CONFIG_LS_KEY, JSON.stringify(config));
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(PROPERTY_CONFIG_UPDATED_EVENT, { detail: config }));
        }
    } catch { /* silently ignore SSR / private-browse errors */ }
}

/** Split large write sets into Firestore-safe batches (max 490 per batch). */
async function batchWrite(
    items: Array<{ path: string; data: Record<string, unknown> }>
): Promise<void> {
    const BATCH_LIMIT = 490;
    for (let i = 0; i < items.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        items.slice(i, i + BATCH_LIMIT).forEach(({ path, data }) => {
            const segs = path.split('/') as [string, ...string[]];
            const ref = doc(db, segs[0], ...segs.slice(1));
            batch.set(ref, data);
        });
        await batch.commit();
    }
}

// ─── Entry Point ───────────────────────────────────────────────────────────────

export const seedDatabase = async (): Promise<void> => {
    const propertyId = tenantService.getActivePropertyId();

    if (!propertyId.startsWith('demo_property_')) {
        console.warn('[Seeder] Refusing to seed non-demo property:', propertyId);
        return;
    }

    const isH2 = propertyId === 'demo_property_h2';
    console.log(`[Seeder] Seeding ${propertyId}…`);

    const t = nowMs();
    const writes: Array<{ path: string; data: Record<string, unknown> }> = [];
    const p = (coll: string, id: string) => `properties/${propertyId}/${coll}/${id}`;

    // ── 1. Hotel identity ────────────────────────────────────────────────────
    const hotelName  = isH2 ? 'Seabreeze Boutique Resort'       : 'Grand Mirage Hotel & Residences';
    const currency   = 'USD';
    const timezone   = isH2 ? 'Indian/Maldives'                  : 'Asia/Dubai';
    const country    = isH2 ? 'Maldives'                         : 'UAE';
    const city       = isH2 ? 'Addu Atoll'                       : 'Dubai';
    const street     = isH2 ? 'Hithadhoo, Addu Atoll'            : 'Sheikh Zayed Road, DIFC';
    const phone      = isH2 ? '+960 688 0000'                    : '+971 4 000 0000';
    const email      = isH2 ? 'gm@seabreeze-demo.hs'             : 'gm@grandmirage-demo.hs';
    const checkIn    = '15:00';
    const checkOut   = isH2 ? '11:00'                            : '12:00';
    const taxRate    = isH2 ? 0.12                               : 0.05;
    const brandColor = isH2 ? '#0ea5e9'                          : '#6366f1';

    // Root properties doc (read by hydratePropertyConfig on login)
    writes.push({
        path: `properties/${propertyId}`,
        data: {
            id: propertyId, hotelId: propertyId, name: hotelName,
            currency, timezone, country, city, isDemo: true,
            setupComplete: true, taxRate, checkInTime: checkIn, checkOutTime: checkOut,
            updatedAt: t,
        },
    });

    // Hydrate the localStorage cache immediately so CURRENT_PROPERTY getters
    // reflect the demo hotel name/currency without waiting for a Firestore round-trip.
    cachePropertyConfig({
        id: propertyId, name: hotelName,
        type: isH2 ? 'Boutique' : 'Resort',
        address: { street, city, state: '', postalCode: '', country },
        contact: { phone, email, website: '' },
        operations: { checkInTime: checkIn, checkOutTime: checkOut, currency, timezone, cancellationPolicy: 'moderate' },
        features: { parking: !isH2, pool: true, gym: !isH2, spa: true, restaurant: true, bar: true, roomService: true, wifi: 'free' },
        branding: { primaryColor: brandColor, secondaryColor: '#f59e0b', logoUrl: '' },
        lastUpdated: new Date().toISOString(),
    });

    // ── 2. Room Types ────────────────────────────────────────────────────────
    const roomTypes: Array<Record<string, unknown>> = isH2
        ? [
            { id: 'rt_bb',  name: 'Beach Bungalow',      code: 'BB',  baseRate: 650,  maxOccupancy: 2, bedType: 'King', count: 30, description: 'Secluded beachfront bungalow with plunge pool & outdoor shower.' },
            { id: 'rt_wv',  name: 'Water Villa',         code: 'WV',  baseRate: 950,  maxOccupancy: 2, bedType: 'King', count: 35, description: 'Overwater villa with glass floor panels and infinity pool.' },
            { id: 'rt_pwv', name: 'Premium Water Villa', code: 'PWV', baseRate: 1400, maxOccupancy: 3, bedType: 'King + Sofa', count: 15, description: 'Two-level overwater villa — private slide, jacuzzi, butler service.' },
        ]
        : [
            { id: 'rt_dlx', name: 'Deluxe Room',   code: 'DLX', baseRate: 320,  maxOccupancy: 2, bedType: 'King', count: 100, description: 'Contemporary 45 sqm room with floor-to-ceiling city views.' },
            { id: 'rt_ps',  name: 'Premier Suite', code: 'PS',  baseRate: 680,  maxOccupancy: 3, bedType: 'King + Sofa', count: 70, description: 'Spacious 85 sqm suite with private lounge and butler service.' },
            { id: 'rt_ph',  name: 'Penthouse',     code: 'PH',  baseRate: 1800, maxOccupancy: 4, bedType: 'King + Twin', count: 30, description: 'Signature 200 sqm penthouse with wraparound terrace and full kitchen.' },
        ];
    roomTypes.forEach(rt =>
        writes.push({ path: p('room_types', rt.id as string), data: { ...rt, amenities: ['Wi-Fi', 'Smart TV', 'Mini Bar', 'Safe', 'Nespresso'], createdAt: t, updatedAt: t } })
    );

    // ── 3. Rate Plans ────────────────────────────────────────────────────────
    const ratePlans: Array<Record<string, unknown>> = isH2
        ? [
            { id: 'rp_fb',   name: 'Full Board',      code: 'FB',   modifier: 180, isPublic: true,  description: 'Breakfast, lunch & dinner included.' },
            { id: 'rp_hb',   name: 'Half Board',      code: 'HB',   modifier: 100, isPublic: true,  description: 'Breakfast & dinner included.' },
            { id: 'rp_bb',   name: 'Bed & Breakfast', code: 'BB',   modifier:  55, isPublic: true,  description: 'Breakfast included.' },
            { id: 'rp_ro',   name: 'Room Only',       code: 'RO',   modifier:   0, isPublic: true,  description: 'No meals. Pay-as-you-go dining.' },
        ]
        : [
            { id: 'rp_flex', name: 'Flexible',         code: 'FLEX', modifier:   0, isPublic: true,  description: 'Best available rate — free cancellation up to 24 h.' },
            { id: 'rp_nr',   name: 'Non-Refundable',   code: 'NR',   modifier: -40, isPublic: true,  description: '12% savings — no changes or cancellations.' },
            { id: 'rp_bb',   name: 'Bed & Breakfast',  code: 'BB',   modifier:  45, isPublic: true,  description: 'Daily buffet breakfast at Mirage Brasserie.' },
            { id: 'rp_hb',   name: 'Half Board',       code: 'HB',   modifier: 110, isPublic: true,  description: 'Breakfast & 3-course dinner.' },
            { id: 'rp_corp', name: 'Corporate',        code: 'CORP', modifier: -30, isPublic: false, description: 'Negotiated corporate rate — ID required at check-in.' },
        ];
    ratePlans.forEach(rp =>
        writes.push({ path: p('rate_plans', rp.id as string), data: { ...rp, createdAt: t, updatedAt: t } })
    );

    // ── 4. Rooms ─────────────────────────────────────────────────────────────
    // Generate a realistic occupancy spread
    interface RoomSeed { id: string; number: string; typeId: string; status: string; hkStatus: string; floor: number; view: string }
    const roomSeeds: RoomSeed[] = isH2
        ? ([
            { id: 'r_101', number: 'BB-01', typeId: 'rt_bb',  status: 'Occupied',    hkStatus: 'Occupied', floor: 1, view: 'Beach' },
            { id: 'r_102', number: 'BB-02', typeId: 'rt_bb',  status: 'Occupied',    hkStatus: 'Occupied', floor: 1, view: 'Beach' },
            { id: 'r_103', number: 'BB-03', typeId: 'rt_bb',  status: 'Clean/Ready', hkStatus: 'Clean',    floor: 1, view: 'Beach' },
            { id: 'r_104', number: 'BB-04', typeId: 'rt_bb',  status: 'Dirty',       hkStatus: 'Dirty',    floor: 1, view: 'Lagoon' },
            { id: 'r_105', number: 'BB-05', typeId: 'rt_bb',  status: 'Clean/Ready', hkStatus: 'Clean',    floor: 1, view: 'Beach' },
            { id: 'r_201', number: 'WV-01', typeId: 'rt_wv',  status: 'Occupied',    hkStatus: 'Occupied', floor: 2, view: 'Ocean' },
            { id: 'r_202', number: 'WV-02', typeId: 'rt_wv',  status: 'Occupied',    hkStatus: 'Occupied', floor: 2, view: 'Ocean' },
            { id: 'r_203', number: 'WV-03', typeId: 'rt_wv',  status: 'Clean/Ready', hkStatus: 'Clean',    floor: 2, view: 'Lagoon' },
            { id: 'r_204', number: 'WV-04', typeId: 'rt_wv',  status: 'Occupied',    hkStatus: 'Occupied', floor: 2, view: 'Ocean' },
            { id: 'r_205', number: 'WV-05', typeId: 'rt_wv',  status: 'Dirty',       hkStatus: 'Dirty',    floor: 2, view: 'Lagoon' },
            { id: 'r_206', number: 'WV-06', typeId: 'rt_wv',  status: 'Clean/Ready', hkStatus: 'Clean',    floor: 2, view: 'Ocean' },
            { id: 'r_301', number: 'PW-01', typeId: 'rt_pwv', status: 'Occupied',    hkStatus: 'Occupied', floor: 3, view: 'Reef' },
            { id: 'r_302', number: 'PW-02', typeId: 'rt_pwv', status: 'Clean/Ready', hkStatus: 'Clean',    floor: 3, view: 'Sunset' },
            { id: 'r_303', number: 'PW-03', typeId: 'rt_pwv', status: 'Out of Order', hkStatus: 'Maintenance', floor: 3, view: 'Reef' },
        ] as RoomSeed[])
        : Array.from({ length: 25 }, (_, i) => {
            const floor = Math.floor(i / 8) + 3;
            const n = i + 1;
            const num = `${floor}0${n.toString().padStart(2, '0')}`;
            const typeId = i < 14 ? 'rt_dlx' : i < 22 ? 'rt_ps' : 'rt_ph';
            const statuses: Array<{ status: string; hkStatus: string }> = [
                { status: 'Occupied', hkStatus: 'Occupied' },
                { status: 'Occupied', hkStatus: 'Occupied' },
                { status: 'Occupied', hkStatus: 'Occupied' },
                { status: 'Clean/Ready', hkStatus: 'Clean' },
                { status: 'Dirty', hkStatus: 'Dirty' },
            ];
            const s = statuses[i % statuses.length];
            return { id: `r_${num}`, number: num, typeId, floor, view: i % 2 === 0 ? 'City View' : 'Sea View', ...s } as RoomSeed;
        });

    roomSeeds.forEach(r =>
        writes.push({
            path: p('rooms', r.id),
            data: {
                id: r.id, number: r.number, typeId: r.typeId,
                status: r.status, floor: r.floor,
                hkStatus: r.hkStatus, hkAttendant: '',
                attributes: [
                    { id: 'view_1', name: r.view, type: 'View', priceModifier: 0 },
                    { id: 'bed_1',  name: 'King Bed', type: 'Bed', priceModifier: 0 },
                ],
                connectsTo: [], isVirtual: false, componentRoomIds: [],
                maintenanceProfile: { lastRenovated: t - 365 * MS_PER_DAY, conditionScore: 97, noiseLevel: 'Low', features: ['Smart TV', 'Rain Shower'], openTickets: 0 },
                iotStatus: { temp: 22, lights: 0, doorLocked: true, carbonFootprint: 1.1, humidity: 48, occupancyDetected: r.status === 'Occupied' },
                createdAt: t, updatedAt: t,
            },
        })
    );

    // ── 5. Guests ────────────────────────────────────────────────────────────
    interface GuestSeed { id: string; firstName: string; lastName: string; email: string; phone: string; nationality: string; loyalty: string; vip: boolean }
    const guestSeeds: GuestSeed[] = isH2
        ? [
            { id: 'g_001', firstName: 'Lena',    lastName: 'Müller',    email: 'lena.muller@mail.de',      phone: '+49 170 123 4567', nationality: 'German',     loyalty: 'Platinum', vip: true  },
            { id: 'g_002', firstName: 'James',   lastName: 'Hartley',   email: 'j.hartley@outlook.com',    phone: '+44 7911 123456', nationality: 'British',    loyalty: 'Gold',     vip: false },
            { id: 'g_003', firstName: 'Aiko',    lastName: 'Yamamoto',  email: 'aiko.yama@gmail.com',      phone: '+81 90 1234 5678', nationality: 'Japanese',   loyalty: 'Silver',   vip: false },
            { id: 'g_004', firstName: 'Carlos',  lastName: 'Vega',      email: 'carlos.vega@icloud.com',   phone: '+34 612 345 678', nationality: 'Spanish',    loyalty: 'Silver',   vip: false },
            { id: 'g_005', firstName: 'Priya',   lastName: 'Sharma',    email: 'priya.s@gmail.com',        phone: '+91 98765 43210', nationality: 'Indian',     loyalty: 'Gold',     vip: true  },
            { id: 'g_006', firstName: 'Noah',    lastName: 'Anderson',  email: 'noah.a@gmail.com',         phone: '+1 617 555 0192', nationality: 'American',   loyalty: 'Bronze',   vip: false },
            { id: 'g_007', firstName: 'Fatima',  lastName: 'Al-Rashid', email: 'f.alrashid@gmail.com',     phone: '+971 50 111 2233', nationality: 'Emirati',    loyalty: 'Platinum', vip: true  },
            { id: 'g_008', firstName: 'Ethan',   lastName: 'Clarke',    email: 'ethan.c@hotmail.com',      phone: '+61 412 345 678', nationality: 'Australian', loyalty: 'Bronze',   vip: false },
        ]
        : [
            { id: 'g_001', firstName: 'Alexandra', lastName: 'Rousseau',   email: 'a.rousseau@gmail.com',     phone: '+33 6 12 34 56 78', nationality: 'French',     loyalty: 'Platinum', vip: true  },
            { id: 'g_002', firstName: 'Mohammed',  lastName: 'Al-Sayed',   email: 'm.alsayed@outlook.com',    phone: '+971 50 234 5678', nationality: 'Emirati',    loyalty: 'Gold',     vip: true  },
            { id: 'g_003', firstName: 'David',     lastName: 'Chen',       email: 'd.chen@icloud.com',        phone: '+86 138 0000 1234', nationality: 'Chinese',    loyalty: 'Gold',     vip: false },
            { id: 'g_004', firstName: 'Sarah',     lastName: 'Mitchell',   email: 's.mitchell@gmail.com',     phone: '+1 312 555 0155', nationality: 'American',   loyalty: 'Silver',   vip: false },
            { id: 'g_005', firstName: 'Hans',      lastName: 'Weber',      email: 'h.weber@web.de',           phone: '+49 89 1234 5678', nationality: 'German',     loyalty: 'Silver',   vip: false },
            { id: 'g_006', firstName: 'Yuki',      lastName: 'Tanaka',     email: 'y.tanaka@gmail.com',       phone: '+81 3 1234 5678', nationality: 'Japanese',   loyalty: 'Bronze',   vip: false },
            { id: 'g_007', firstName: 'Isabella',  lastName: 'Ferreira',   email: 'i.ferreira@outlook.com',   phone: '+55 11 9 1234 5678', nationality: 'Brazilian',  loyalty: 'Bronze',   vip: false },
            { id: 'g_008', firstName: 'Oliver',    lastName: 'Thompson',   email: 'o.thompson@gmail.com',     phone: '+44 7700 900123', nationality: 'British',    loyalty: 'Gold',     vip: false },
            { id: 'g_009', firstName: 'Nour',      lastName: 'Hassan',     email: 'n.hassan@gmail.com',       phone: '+20 100 123 4567', nationality: 'Egyptian',   loyalty: 'Silver',   vip: false },
            { id: 'g_010', firstName: 'Lucas',     lastName: 'Dupont',     email: 'l.dupont@free.fr',         phone: '+33 7 56 78 90 12', nationality: 'French',     loyalty: 'Bronze',   vip: false },
            { id: 'g_011', firstName: 'Mei',       lastName: 'Lin',        email: 'mei.lin@gmail.com',        phone: '+65 8123 4567', nationality: 'Singaporean', loyalty: 'Platinum', vip: true  },
            { id: 'g_012', firstName: 'Vikram',    lastName: 'Patel',      email: 'v.patel@gmail.com',        phone: '+91 98989 12345', nationality: 'Indian',     loyalty: 'Gold',     vip: false },
        ];

    guestSeeds.forEach(g =>
        writes.push({
            path: p('guests', g.id),
            data: {
                id: g.id, firstName: g.firstName, lastName: g.lastName,
                fullName: `${g.firstName} ${g.lastName}`,
                email: g.email, phone: g.phone, nationality: g.nationality,
                loyaltyTier: g.loyalty, isVip: g.vip,
                preferences: { bedType: 'King', smokingRoom: false, highFloor: g.vip },
                totalStays: Math.floor(Math.random() * 8) + 1,
                totalSpend: Math.floor(Math.random() * 15000) + 2000,
                createdAt: t, updatedAt: t,
            },
        })
    );

    // ── 6. Reservations + Folios ─────────────────────────────────────────────
    // Mix: 6+ in-house, 2-3 arriving today, 2 due-out today, 3 future
    interface ResSeed {
        id: string; guestId: string; roomId: string; rtId: string; rpId: string;
        checkIn: string; checkOut: string; status: string; nights: number;
        adults: number; rate: number; balance: number;
    }

    const occupied = roomSeeds.filter(r => r.status === 'Occupied');
    const clean    = roomSeeds.filter(r => r.status === 'Clean/Ready');

    const resList: ResSeed[] = [
        // In-house — checked in 2 days ago, out in 2-4 days
        ...occupied.slice(0, Math.min(occupied.length, isH2 ? 5 : 9)).map((r, i) => ({
            id: uid('res', i + 1), guestId: guestSeeds[i % guestSeeds.length].id,
            roomId: r.id, rtId: r.typeId,
            rpId: isH2 ? 'rp_fb' : 'rp_flex',
            checkIn: dateStr(-2), checkOut: dateStr(2 + i % 3),
            status: 'In House', nights: 4 + i % 3, adults: 2,
            rate: (roomTypes.find(rt => rt.id === r.typeId) as { baseRate: number })?.baseRate ?? 400,
            balance: 0,
        })),
        // Arriving today
        ...clean.slice(0, isH2 ? 2 : 3).map((r, i) => ({
            id: uid('res', 20 + i), guestId: guestSeeds[(occupied.length + i) % guestSeeds.length].id,
            roomId: r.id, rtId: r.typeId,
            rpId: isH2 ? 'rp_hb' : 'rp_bb',
            checkIn: dateStr(0), checkOut: dateStr(3 + i),
            status: 'Confirmed', nights: 3 + i, adults: 2,
            rate: (roomTypes.find(rt => rt.id === r.typeId) as { baseRate: number })?.baseRate ?? 400,
            balance: 0,
        })),
        // Future bookings
        ...Array.from({ length: isH2 ? 3 : 5 }, (_, i) => ({
            id: uid('res', 30 + i), guestId: guestSeeds[(i + 3) % guestSeeds.length].id,
            roomId: '', rtId: roomTypes[i % roomTypes.length].id as string,
            rpId: isH2 ? 'rp_ro' : 'rp_flex',
            checkIn: dateStr(5 + i * 3), checkOut: dateStr(8 + i * 3),
            status: 'Confirmed', nights: 3, adults: 2,
            rate: (roomTypes[i % roomTypes.length] as { baseRate: number }).baseRate,
            balance: (roomTypes[i % roomTypes.length] as { baseRate: number }).baseRate * 3 * 0.3,
        })),
    ];

    resList.forEach(r =>
        writes.push({
            path: p('reservations', r.id),
            data: {
                id: r.id, confirmationNumber: `HS-DEMO-${r.id.toUpperCase()}`,
                guestId: r.guestId, guestName: (() => { const g = guestSeeds.find(gs => gs.id === r.guestId); return g ? `${g.firstName} ${g.lastName}` : 'Guest'; })(),
                roomId: r.roomId, roomNumber: roomSeeds.find(rs => rs.id === r.roomId)?.number ?? 'TBA',
                roomTypeId: r.rtId, ratePlanId: r.rpId,
                checkInDate: r.checkIn, checkOutDate: r.checkOut,
                status: r.status, nights: r.nights, adults: r.adults, children: 0,
                ratePerNight: r.rate, totalAmount: r.rate * r.nights,
                balance: r.balance, source: 'Direct', channel: 'Property',
                specialRequests: '', notes: '',
                createdAt: t, updatedAt: t,
            },
        })
    );

    resList.forEach(r =>
        writes.push({
            path: p('folios', `fol_${r.id}`),
            data: {
                id: `fol_${r.id}`, reservationId: r.id, guestId: r.guestId,
                status: r.status === 'In House' ? 'Open' : 'Pending',
                balance: r.rate * r.nights,
                currency,
                transactions: [],
                createdAt: t, updatedAt: t,
            },
        })
    );

    // ── 7. F&B — Outlets ────────────────────────────────────────────────────
    interface OutletSeed { id: string; name: string; type: string; operatingHours: string; capacity: number }
    const outletSeeds: OutletSeed[] = isH2
        ? [
            { id: 'out_beach',   name: 'The Beach Grill',    type: 'Restaurant', operatingHours: '07:00–22:00', capacity: 60 },
            { id: 'out_bar',     name: 'Coral Bar',          type: 'Bar',        operatingHours: '10:00–01:00', capacity: 30 },
            { id: 'out_ird',     name: 'In-Villa Dining',    type: 'In-Room',    operatingHours: '24/7',        capacity: 80 },
        ]
        : [
            { id: 'out_brasserie', name: 'Mirage Brasserie',  type: 'Restaurant', operatingHours: '06:30–23:00', capacity: 120 },
            { id: 'out_lobby',     name: 'Lobby Lounge & Bar',type: 'Bar',        operatingHours: '10:00–02:00', capacity: 60 },
            { id: 'out_rooftop',   name: 'Altitude Rooftop',  type: 'Restaurant', operatingHours: '18:00–01:00', capacity: 80 },
            { id: 'out_pool',      name: 'Infinity Pool Bar', type: 'Bar',        operatingHours: '09:00–20:00', capacity: 40 },
            { id: 'out_ird',       name: 'In-Room Dining',    type: 'In-Room',    operatingHours: '24/7',        capacity: 200 },
        ];

    outletSeeds.forEach(o =>
        writes.push({
            path: p('outlets', o.id),
            data: { id: o.id, name: o.name, type: o.type, status: 'Open', operatingHours: o.operatingHours, capacity: o.capacity, currentOccupancy: 0, revenueToday: 0, waitTimeMin: 0, createdAt: t, updatedAt: t },
        })
    );

    // ── 8. Tables ────────────────────────────────────────────────────────────
    const diningOutlets = outletSeeds.filter(o => o.type === 'Restaurant' || o.type === 'Bar');
    diningOutlets.forEach(o => {
        const count = o.type === 'Restaurant' ? 12 : 6;
        Array.from({ length: count }, (_, i) => {
            const tId = `tbl_${o.id}_${i + 1}`;
            writes.push({
                path: p('tables', tId),
                data: { id: tId, outletId: o.id, number: `${(i + 1).toString().padStart(2, '0')}`, capacity: i < 4 ? 2 : i < 8 ? 4 : 6, status: 'Available', section: i < 6 ? 'Indoor' : 'Outdoor', createdAt: t },
            });
        });
    });

    // ── 9. Menu Items ────────────────────────────────────────────────────────
    interface MenuItemSeed { id: string; outletId: string; name: string; price: number; category: string; description?: string }
    const menuSeeds: MenuItemSeed[] = isH2
        ? [
            { id: 'mi_001', outletId: 'out_beach', name: 'Maldivian Breakfast Platter', price: 48, category: 'Breakfast', description: 'Fresh tropical fruit, fish curry, roshi bread' },
            { id: 'mi_002', outletId: 'out_beach', name: 'Grilled Reef Fish',           price: 52, category: 'Mains',     description: 'Caught fresh, served with coconut sambal & steamed rice' },
            { id: 'mi_003', outletId: 'out_beach', name: 'Lobster Thermidor',           price: 85, category: 'Mains',     description: 'Market price, served with truffle fries' },
            { id: 'mi_004', outletId: 'out_beach', name: 'Mango Pannacotta',            price: 18, category: 'Desserts',  description: 'Local mango, vanilla cream, passion fruit coulis' },
            { id: 'mi_005', outletId: 'out_bar',   name: 'Seabreeze Signature Spritz', price: 22, category: 'Cocktails',  description: 'Prosecco, elderflower, cucumber' },
            { id: 'mi_006', outletId: 'out_bar',   name: 'Frozen Coconut Daiquiri',    price: 18, category: 'Cocktails',  description: 'Coconut rum, lime, coconut cream' },
            { id: 'mi_007', outletId: 'out_bar',   name: 'Fresh Coconut',              price: 12, category: 'Non-Alcoholic' },
            { id: 'mi_008', outletId: 'out_bar',   name: 'Truffle Nuts & Olives',      price: 14, category: 'Bar Bites'  },
            { id: 'mi_009', outletId: 'out_ird',   name: 'Continental Breakfast',      price: 42, category: 'Breakfast'  },
            { id: 'mi_010', outletId: 'out_ird',   name: 'Club Sandwich',              price: 28, category: 'Light Bites' },
            { id: 'mi_011', outletId: 'out_ird',   name: 'Wagyu Burger',               price: 36, category: 'Light Bites', description: 'Caramelized onions, truffle fries' },
            { id: 'mi_012', outletId: 'out_ird',   name: 'Champagne (half btl)',        price: 65, category: 'Beverages'  },
        ]
        : [
            { id: 'mi_001', outletId: 'out_brasserie', name: 'Seasonal Breakfast Buffet',    price: 58, category: 'Breakfast', description: 'Full hot & cold buffet, 06:30–10:30' },
            { id: 'mi_002', outletId: 'out_brasserie', name: 'Wagyu Beef Tenderloin',        price: 88, category: 'Mains',     description: '200g, bordelaise sauce, truffle fries' },
            { id: 'mi_003', outletId: 'out_brasserie', name: 'Sea Bass en Croûte',           price: 72, category: 'Mains',     description: 'Herb crust, beurre blanc, seasonal veg' },
            { id: 'mi_004', outletId: 'out_brasserie', name: 'Crème Brûlée',                 price: 22, category: 'Desserts'  },
            { id: 'mi_005', outletId: 'out_brasserie', name: 'Artisan Cheese Board',         price: 38, category: 'Sharing'   },
            { id: 'mi_006', outletId: 'out_lobby',     name: 'Singularity Martini',          price: 28, category: 'Cocktails', description: 'Grey Goose, dry vermouth, molecular olive sphere' },
            { id: 'mi_007', outletId: 'out_lobby',     name: 'Barrel-Aged Negroni',          price: 30, category: 'Cocktails', description: 'Campari, sweet vermouth, Sipsmith' },
            { id: 'mi_008', outletId: 'out_lobby',     name: 'Truffle Nuts & Nocellara',     price: 16, category: 'Bar Bites'  },
            { id: 'mi_009', outletId: 'out_rooftop',   name: 'Altitude Tasting Menu (5 crs)', price: 145, category: 'Set Menu', description: 'Seasonal, wine pairing available' },
            { id: 'mi_010', outletId: 'out_rooftop',   name: 'Burrata & Heritage Tomato',    price: 28, category: 'Starters'  },
            { id: 'mi_011', outletId: 'out_rooftop',   name: 'Grilled Branzino',             price: 62, category: 'Mains'     },
            { id: 'mi_012', outletId: 'out_pool',      name: 'Frozen Margarita',             price: 22, category: 'Cocktails' },
            { id: 'mi_013', outletId: 'out_pool',      name: 'Ceviche Tostadas',             price: 26, category: 'Bites'     },
            { id: 'mi_014', outletId: 'out_pool',      name: 'Fish Tacos (×3)',              price: 24, category: 'Bites'     },
            { id: 'mi_015', outletId: 'out_pool',      name: 'Açaí Bowl',                   price: 18, category: 'Healthy'   },
            { id: 'mi_016', outletId: 'out_ird',       name: 'Mirage Breakfast Box',         price: 55, category: 'Breakfast' },
            { id: 'mi_017', outletId: 'out_ird',       name: 'Club Sandwich',                price: 34, category: 'Light Bites' },
            { id: 'mi_018', outletId: 'out_ird',       name: 'Artisan Cheese Board',         price: 42, category: 'Sharing'   },
        ];

    menuSeeds.forEach(mi =>
        writes.push({ path: p('menuItems', mi.id), data: { ...mi, available: true, allergens: [], createdAt: t, updatedAt: t } })
    );

    // ── 10. Employees ────────────────────────────────────────────────────────
    interface EmpSeed { id: string; firstName: string; lastName: string; role: string; department: string; employeeId: string }
    const empSeeds: EmpSeed[] = isH2
        ? [
            { id: 'emp_001', firstName: 'Maya',   lastName: 'Ali',        role: 'General Manager', department: 'Management',   employeeId: 'GM001' },
            { id: 'emp_002', firstName: 'Ravi',   lastName: 'Nair',       role: 'FrontDesk',        department: 'Front Office', employeeId: 'FD001' },
            { id: 'emp_003', firstName: 'Sara',   lastName: 'Jansen',     role: 'FrontDesk',        department: 'Front Office', employeeId: 'FD002' },
            { id: 'emp_004', firstName: 'Amin',   lastName: 'Mohamed',    role: 'Staff',            department: 'Housekeeping', employeeId: 'HK001' },
            { id: 'emp_005', firstName: 'Tina',   lastName: 'Roberts',    role: 'Chef',             department: 'F&B',          employeeId: 'FB001' },
            { id: 'emp_006', firstName: 'Jamal',  lastName: 'Abdulla',    role: 'Finance',          department: 'Finance',      employeeId: 'FIN001' },
        ]
        : [
            { id: 'emp_001', firstName: 'Marcus',    lastName: 'Reeves',     role: 'General Manager',  department: 'Management',     employeeId: 'GM001' },
            { id: 'emp_002', firstName: 'Layla',     lastName: 'Hassan',     role: 'Manager',          department: 'Front Office',   employeeId: 'MGR001' },
            { id: 'emp_003', firstName: 'Tom',       lastName: 'Bradley',    role: 'FrontDesk',        department: 'Front Office',   employeeId: 'FD001' },
            { id: 'emp_004', firstName: 'Sofia',     lastName: 'Kim',        role: 'FrontDesk',        department: 'Front Office',   employeeId: 'FD002' },
            { id: 'emp_005', firstName: 'Ahmed',     lastName: 'Khatib',     role: 'Staff',            department: 'Housekeeping',   employeeId: 'HK001' },
            { id: 'emp_006', firstName: 'Grace',     lastName: 'Wu',         role: 'Staff',            department: 'Housekeeping',   employeeId: 'HK002' },
            { id: 'emp_007', firstName: 'Pierre',    lastName: 'Moreau',     role: 'Chef',             department: 'F&B',            employeeId: 'FB001' },
            { id: 'emp_008', firstName: 'Elena',     lastName: 'Torres',     role: 'Chef',             department: 'F&B',            employeeId: 'FB002' },
            { id: 'emp_009', firstName: 'Hassan',    lastName: 'Siddiqui',   role: 'Finance',          department: 'Finance',        employeeId: 'FIN001' },
            { id: 'emp_010', firstName: 'Nina',      lastName: 'Schulz',     role: 'Supervisor',       department: 'Security',       employeeId: 'SEC001' },
        ];

    empSeeds.forEach(e =>
        writes.push({
            path: p('employees', e.id),
            data: {
                id: e.id, employeeId: e.employeeId,
                firstName: e.firstName, lastName: e.lastName,
                fullName: `${e.firstName} ${e.lastName}`,
                role: e.role, department: e.department,
                email: `${e.firstName.toLowerCase()}.${e.lastName.toLowerCase()}@${isH2 ? 'seabreeze' : 'grandmirage'}-demo.hs`,
                phone: '+971 50 000 0000',
                status: 'Active', hireDate: dateStr(-180 - Math.floor(Math.random() * 500)),
                salary: e.role === 'General Manager' ? 18000 : e.role === 'Manager' ? 12000 : 6000,
                leaveBalance: 24, nationality: 'Diverse',
                createdAt: t, updatedAt: t,
            },
        })
    );

    // ── 11. GL Accounts ──────────────────────────────────────────────────────
    const glAccountSeeds = [
        { id: 'gl_1100', code: '1100', name: 'Cash & Bank', type: 'Asset',     category: 'Current Assets' },
        { id: 'gl_1200', code: '1200', name: 'Accounts Receivable', type: 'Asset',     category: 'Current Assets' },
        { id: 'gl_2100', code: '2100', name: 'Accounts Payable',   type: 'Liability', category: 'Current Liabilities' },
        { id: 'gl_2200', code: '2200', name: 'Guest Deposits',     type: 'Liability', category: 'Current Liabilities' },
        { id: 'gl_3100', code: '3100', name: 'Owner Equity',       type: 'Equity',    category: 'Equity' },
        { id: 'gl_4100', code: '4100', name: 'Room Revenue',       type: 'Revenue',   category: 'Operating Revenue' },
        { id: 'gl_4200', code: '4200', name: 'F&B Revenue',        type: 'Revenue',   category: 'Operating Revenue' },
        { id: 'gl_4300', code: '4300', name: 'Ancillary Revenue',  type: 'Revenue',   category: 'Operating Revenue' },
        { id: 'gl_5100', code: '5100', name: 'Cost of F&B',        type: 'Expense',   category: 'COGS' },
        { id: 'gl_6100', code: '6100', name: 'Payroll Expense',    type: 'Expense',   category: 'Operating Expenses' },
        { id: 'gl_6200', code: '6200', name: 'Utilities',          type: 'Expense',   category: 'Operating Expenses' },
        { id: 'gl_6300', code: '6300', name: 'Maintenance',        type: 'Expense',   category: 'Operating Expenses' },
        { id: 'gl_6400', code: '6400', name: 'Marketing',          type: 'Expense',   category: 'Operating Expenses' },
    ];

    glAccountSeeds.forEach(ga =>
        writes.push({ path: p('glAccounts', ga.id), data: { ...ga, balance: 0, isActive: true, createdAt: t, updatedAt: t } })
    );

    // ── 12. Suppliers ────────────────────────────────────────────────────────
    const supplierSeeds = isH2
        ? [
            { id: 'sup_001', name: 'Tropical Seafood Co.',   category: 'F&B',          contactEmail: 'orders@tropicalseafood.mv', paymentTerms: 'Net 30' },
            { id: 'sup_002', name: 'Maldives Laundry Group', category: 'Laundry',      contactEmail: 'ops@maldiveslaundry.mv',    paymentTerms: 'Net 15' },
            { id: 'sup_003', name: 'Island Amenities Ltd.',  category: 'Housekeeping', contactEmail: 'sales@islandamenities.mv',  paymentTerms: 'Net 30' },
        ]
        : [
            { id: 'sup_001', name: 'Gulf Premium Provisions',   category: 'F&B',           contactEmail: 'orders@gulfpremium.ae',  paymentTerms: 'Net 30' },
            { id: 'sup_002', name: 'UAE Linen & Laundry',       category: 'Laundry',       contactEmail: 'info@uaelinen.ae',       paymentTerms: 'Net 15' },
            { id: 'sup_003', name: 'Hotelier Amenities MENA',   category: 'Housekeeping',  contactEmail: 'sales@hotelier-mena.ae', paymentTerms: 'Net 30' },
            { id: 'sup_004', name: 'SmartTech Hospitality',     category: 'Technology',    contactEmail: 'support@smarttech.ae',   paymentTerms: 'Net 45' },
        ];

    supplierSeeds.forEach(s =>
        writes.push({ path: p('suppliers', s.id), data: { ...s, status: 'Active', createdAt: t, updatedAt: t } })
    );

    // ── 13. System Roles ─────────────────────────────────────────────────────
    const systemRoleSeeds = [
        { id: 'role_gm',        name: 'General Manager',  code: 'GM',        permissions: ['all'] },
        { id: 'role_mgr',       name: 'Manager',          code: 'Manager',   permissions: ['ops', 'hr', 'finance_read'] },
        { id: 'role_fd',        name: 'Front Desk',       code: 'FrontDesk', permissions: ['reservations', 'check_in', 'check_out', 'folio_read'] },
        { id: 'role_hk',        name: 'Housekeeping',     code: 'Staff',     permissions: ['rooms_hk', 'tasks'] },
        { id: 'role_finance',   name: 'Finance Officer',  code: 'Finance',   permissions: ['finance', 'reports', 'payroll'] },
        { id: 'role_chef',      name: 'Chef / Kitchen',   code: 'Chef',      permissions: ['pos_kitchen', 'recipes', 'inventory'] },
        { id: 'role_supervisor',name: 'Supervisor',       code: 'Supervisor',permissions: ['ops', 'tasks', 'reports_limited'] },
    ];

    systemRoleSeeds.forEach(sr =>
        writes.push({ path: p('systemRoles', sr.id), data: { ...sr, isActive: true, createdAt: t } })
    );

    // ── Write everything ─────────────────────────────────────────────────────
    await batchWrite(writes);
    console.log(`[Seeder] ✅ Complete — ${writes.length} documents written for ${propertyId}.`);
};
