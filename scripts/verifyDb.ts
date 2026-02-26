import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, count } from "firebase/firestore";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verify() {
    const rooms = await getDocs(collection(db, 'rooms'));
    console.log(`Rooms count: ${rooms.size}`);

    const outlets = await getDocs(collection(db, 'outlets'));
    console.log(`Outlets count: ${outlets.size}`);
    outlets.docs.forEach(d => console.log(` - ${d.data().name}`));

    const menus = await getDocs(collection(db, 'menu_items'));
    console.log(`Menu Items count: ${menus.size}`);

    process.exit(0);
}

verify().catch(console.error);
