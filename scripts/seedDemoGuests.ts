import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import * as dotenv from 'dotenv';
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
    appId: process.env.VITE_FIREBASE_APP_ID
});
const db = getFirestore(app);

// Helpers
const generateId = () => Math.random().toString(36).substring(2, 15);
const randomChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const firstNames = ['James', 'Emma', 'Oliver', 'Sophia', 'William', 'Isabella', 'Charlotte', 'Benjamin', 'Amelia', 'Liam'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

async function seedGuestsAndReservations() {
    console.log('🚀 Generating Mock Guests & Reservations for Boutique Hotel...');

    const roomsSnap = await getDocs(collection(db, 'rooms'));
    const rooms = roomsSnap.docs.map(d => d.data());

    if (rooms.length === 0) {
        console.error("No rooms found. Please run seedBoutiqueDemo.ts first.");
        process.exit(1);
    }

    const batch = writeBatch(db);
    let guestCount = 0;
    let resCount = 0;
    let folioCount = 0;

    // We'll create exactly 12 active reservations (leaving 6 rooms vacant)
    const activeRooms = rooms.slice(0, 12);

    for (const room of activeRooms) {
        // 1. Create a Guest
        const guestId = `guest_${generateId()}`;
        const fname = randomChoice(firstNames);
        const lname = randomChoice(lastNames);

        batch.set(doc(db, 'guests', guestId), {
            principal: guestId,
            fullName: `${fname} ${lname}`,
            role: 'Guest',
            hotelId: 'Singularity_Boutique',
            loyaltyTier: randomChoice(['Silver', 'Gold', 'Platinum', 'Diamond']),
            preferences: {
                temperature: 22,
                language: 'en',
                dietary: randomChoice([[], ['Vegan'], ['Gluten-Free']])
            },
            valenceHistory: []
        });
        guestCount++;

        // 2. Create a Reservation
        const resId = `res_${generateId()}`;
        const folioId = `folio_${generateId()}`;

        const checkInDate = new Date(today);
        checkInDate.setDate(today.getDate() - Math.floor(Math.random() * 3)); // 0 to 2 days ago

        const checkOutDate = new Date(today);
        checkOutDate.setDate(today.getDate() + Math.floor(Math.random() * 4) + 1); // 1 to 4 days from now

        batch.set(doc(db, 'reservations', resId), {
            id: resId,
            guestId,
            propertyId: 'Singularity_Boutique',
            roomId: room.id,
            roomTypeId: room.typeId,
            checkIn: formatDate(checkInDate),
            checkOut: formatDate(checkOutDate),
            adults: 2,
            children: 0,
            status: 'Checked In',
            folioId,
            rateApplied: room.typeId === 'PRESIDENTIAL' ? 1200 : room.typeId === 'SUITE' ? 650 : 350,
            noShowProbability: 0,
            paymentMethod: 'Credit Card',
            accompanyingGuests: []
        });
        resCount++;

        // 3. Update the Room Status
        batch.update(doc(db, 'rooms', room.id), {
            status: 'Occupied',
            currentGuestId: guestId,
            assignedReservationId: resId
        });

        // 4. Create a Folio
        batch.set(doc(db, 'folios', folioId), {
            id: folioId,
            reservationId: resId,
            guestId,
            balance: 0,
            status: 'Open',
            hotelId: 'Singularity_Boutique',
            createdAt: checkInDate.getTime(),
            updatedAt: Date.now()
        });
        folioCount++;

        // 5. Add a transaction to the folio for Room Rate
        const transId = `tx_${generateId()}`;
        batch.set(doc(db, 'transactions', transId), {
            id: transId,
            folioId,
            amount: room.typeId === 'PRESIDENTIAL' ? 1200 : room.typeId === 'SUITE' ? 650 : 350,
            type: 'Charge',
            category: 'Room',
            description: `Room Rate - Night 1`,
            timestamp: Date.now(),
            cashierId: 'System'
        });
    }

    // 6. Create some future reservations
    for (let i = 0; i < 5; i++) {
        const guestId = `guest_fut_${generateId()}`;
        const resId = `res_fut_${generateId()}`;
        const folioId = `folio_fut_${generateId()}`;

        batch.set(doc(db, 'guests', guestId), {
            principal: guestId,
            fullName: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
            role: 'Guest',
            hotelId: 'Singularity_Boutique',
            preferences: {}, valenceHistory: []
        });

        const fIn = new Date(today);
        fIn.setDate(today.getDate() + Math.floor(Math.random() * 10) + 1);
        const fOut = new Date(fIn);
        fOut.setDate(fIn.getDate() + 3);

        batch.set(doc(db, 'reservations', resId), {
            id: resId,
            guestId,
            propertyId: 'Singularity_Boutique',
            roomId: randomChoice(rooms.slice(12, 18)).id, // Assign to vacant rooms
            roomTypeId: 'DELUXE',
            checkIn: formatDate(fIn),
            checkOut: formatDate(fOut),
            adults: 1, children: 0,
            status: 'Confirmed',
            folioId,
            rateApplied: 350,
            noShowProbability: 0,
            paymentMethod: 'Credit Card',
            accompanyingGuests: []
        });

        batch.set(doc(db, 'folios', folioId), {
            id: folioId, reservationId: resId, guestId, balance: 0, status: 'Open', hotelId: 'Singularity_Boutique', createdAt: Date.now(), updatedAt: Date.now()
        });
    }

    await batch.commit();

    console.log(`✅ Mock Data Injection Complete!`);
    console.log(`- ${guestCount + 5} Guests Created`);
    console.log(`- ${resCount} Active "Checked In" Reservations Created`);
    console.log(`- 5 Future "Confirmed" Reservations Created`);
    console.log(`- ${folioCount + 5} Folios & Transactions Created`);
    console.log(`- Updated 12 Rooms to "Occupied" status`);

    process.exit(0);
}

seedGuestsAndReservations().catch(console.error);
