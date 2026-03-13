import { initializeApp } from "firebase/app";
import {
    initializeFirestore,
    getFirestore,
    connectFirestoreEmulator,
    enableIndexedDbPersistence
} from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const ensureEnv = (key: string, value: unknown): string => {
    if (typeof value === 'string' && value.trim().length > 0) return value;
    const message = `[Singularity] Missing required Firebase env var: ${key}`;
    console.error(message);
    throw new Error(message);
};

const firebaseConfig = {
    apiKey: ensureEnv('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: ensureEnv('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: ensureEnv('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: ensureEnv('VITE_FIREBASE_STORAGE_BUCKET', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: ensureEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: ensureEnv('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const shouldForceLongPolling = import.meta.env.DEV || import.meta.env.VITE_FIRESTORE_FORCE_LONG_POLLING === 'true';
const shouldAutoDetectLongPolling = import.meta.env.VITE_FIRESTORE_AUTO_DETECT_LONG_POLLING !== 'false';
const disableFetchStreams = import.meta.env.DEV || import.meta.env.VITE_FIRESTORE_DISABLE_FETCH_STREAMS === 'true';

// Some local networks/proxies break Firestore's streaming transport and trigger
// internal assertion failures (e.g. ca9/b815). Harden dev transport defaults.
export const db = (() => {
    try {
        return initializeFirestore(app, {
            experimentalAutoDetectLongPolling: shouldAutoDetectLongPolling,
            experimentalForceLongPolling: shouldForceLongPolling,
        });
    } catch (error) {
        console.warn('[Singularity] Firestore init fallback to getFirestore():', error);
        return getFirestore(app);
    }
})();
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const useFirebaseEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

type GlobalFlags = typeof globalThis & {
    __singularityFirestoreEmulatorConnected?: boolean;
    __singularityAuthEmulatorConnected?: boolean;
    __singularityFunctionsEmulatorConnected?: boolean;
};
const runtimeFlags = globalThis as GlobalFlags;

export interface FirebaseBootstrapDiagnostics {
    emulatorsEnabled: boolean;
    checkedAt: number;
    firestore: 'unknown' | 'ok' | 'down';
    auth: 'unknown' | 'ok' | 'down';
    functions: 'unknown' | 'ok' | 'down';
    warning: string | null;
}

const bootstrapListeners = new Set<(diagnostics: FirebaseBootstrapDiagnostics) => void>();
let bootstrapDiagnostics: FirebaseBootstrapDiagnostics = {
    emulatorsEnabled: useFirebaseEmulators,
    checkedAt: Date.now(),
    firestore: 'unknown',
    auth: 'unknown',
    functions: 'unknown',
    warning: null
};

const publishBootstrapDiagnostics = (next: Partial<FirebaseBootstrapDiagnostics>) => {
    bootstrapDiagnostics = {
        ...bootstrapDiagnostics,
        ...next,
        checkedAt: Date.now()
    };
    bootstrapListeners.forEach((listener) => listener(bootstrapDiagnostics));
};

const probeEmulatorEndpoint = async (url: string): Promise<boolean> => {
    try {
        await fetch(url, { method: 'GET', mode: 'no-cors' });
        return true;
    } catch {
        return false;
    }
};

const probeEmulators = async () => {
    const [firestoreUp, authUp, functionsUp] = await Promise.all([
        probeEmulatorEndpoint('http://127.0.0.1:8085'),
        probeEmulatorEndpoint('http://127.0.0.1:9099'),
        probeEmulatorEndpoint('http://127.0.0.1:5001')
    ]);

    const missingPorts = [
        !firestoreUp ? '8085 (Firestore)' : '',
        !authUp ? '9099 (Auth)' : '',
        !functionsUp ? '5001 (Functions)' : ''
    ].filter(Boolean);

    const warning = missingPorts.length > 0
        ? `Firebase emulators are enabled but unreachable on ${missingPorts.join(', ')}. Start emulators or disable VITE_USE_FIREBASE_EMULATORS.`
        : null;

    publishBootstrapDiagnostics({
        firestore: firestoreUp ? 'ok' : 'down',
        auth: authUp ? 'ok' : 'down',
        functions: functionsUp ? 'ok' : 'down',
        warning
    });

    if (warning) {
        console.warn(`[Singularity] ${warning}`);
    }
};

export const getFirebaseBootstrapDiagnostics = (): FirebaseBootstrapDiagnostics => bootstrapDiagnostics;

export const subscribeFirebaseBootstrapDiagnostics = (listener: (diagnostics: FirebaseBootstrapDiagnostics) => void): (() => void) => {
    bootstrapListeners.add(listener);
    listener(bootstrapDiagnostics);
    return () => {
        bootstrapListeners.delete(listener);
    };
};

if (useFirebaseEmulators) {
    console.log("[Singularity] VITE_USE_FIREBASE_EMULATORS=true, wiring to local Firebase emulators (127.0.0.1).");
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
    void probeEmulators();
} else {
    console.log("[Singularity] Using cloud Firebase services. Set VITE_USE_FIREBASE_EMULATORS=true to use local emulators.");
    // Enable persistence only when explicitly opted in to avoid dev assertion crashes.
    const allowPersistence = import.meta.env.VITE_ENABLE_FS_PERSISTENCE === 'true' && !import.meta.env.DEV;
    if (allowPersistence) {
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("[Singularity] Persistence failed: Multiple tabs open.");
            } else if (err.code === 'unimplemented') {
                console.warn("[Singularity] Persistence unimplemented in this browser.");
            }
        });
    } else {
        console.warn("[Singularity] Firestore persistence disabled in dev to avoid internal assertion errors. Set VITE_ENABLE_FS_PERSISTENCE=true to enable in prod.");
    }
}

export default app;
