import { initializeApp } from "firebase/app";
import {
    getFirestore,
    connectFirestoreEmulator,
    enableIndexedDbPersistence
} from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

type GlobalFlags = typeof globalThis & {
    __singularityFirestoreEmulatorConnected?: boolean;
    __singularityAuthEmulatorConnected?: boolean;
    __singularityFunctionsEmulatorConnected?: boolean;
};
const runtimeFlags = globalThis as GlobalFlags;

// Connect to Local Mac Backend when in Development
if (import.meta.env.DEV) {
    console.log("[Singularity] Wiring to Local Database and Backend (127.0.0.1)...");
    try {
        if (!runtimeFlags.__singularityFirestoreEmulatorConnected) {
            connectFirestoreEmulator(db, '127.0.0.1', 8085);
            runtimeFlags.__singularityFirestoreEmulatorConnected = true;
        }
    } catch (err) {
        console.warn("[Singularity] Firestore emulator connection skipped:", err);
    }

    try {
        if (!runtimeFlags.__singularityAuthEmulatorConnected) {
            connectAuthEmulator(auth, 'http://127.0.0.1:9099');
            runtimeFlags.__singularityAuthEmulatorConnected = true;
        }
    } catch (err) {
        console.warn("[Singularity] Auth emulator connection skipped:", err);
    }

    try {
        if (!runtimeFlags.__singularityFunctionsEmulatorConnected) {
            connectFunctionsEmulator(functions, '127.0.0.1', 5001);
            runtimeFlags.__singularityFunctionsEmulatorConnected = true;
        }
    } catch (err) {
        console.warn("[Singularity] Functions emulator connection skipped:", err);
    }
} else {
    // Enable Offline Persistence ONLY in production/deployed mode
    // Emulators and Persistence can sometimes conflict or cause hangs in local dev
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn("[Singularity] Persistence failed: Multiple tabs open.");
        } else if (err.code === 'unimplemented') {
            console.warn("[Singularity] Persistence unimplemented in this browser.");
        }
    });
}

export default app;
