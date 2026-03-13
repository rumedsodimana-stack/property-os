
import { db } from './firebase';
import {
    collection,
    query,
    getDocs,
    getDoc,
    doc,
    addDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    DocumentData,
    QueryConstraint,
    type CollectionReference
} from 'firebase/firestore';
import { internalAuthService } from './internalAuthService';
import { tenantService } from './tenantService';

const isAuthRetryableError = (error: unknown): boolean => {
    const code = String((error as any)?.code || '').toLowerCase();
    const message = String((error as any)?.message || '').toLowerCase();
    return (
        code.includes('permission-denied') ||
        code.includes('unauthenticated') ||
        message.includes('permission') ||
        message.includes('insufficient')
    );
};

const withAuthRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (!isAuthRetryableError(error)) {
            throw error;
        }
        await internalAuthService.ensureFirebaseClientAuth();
        return operation();
    }
};

const usePollingSubscriptions = import.meta.env.DEV || import.meta.env.VITE_FIRESTORE_USE_POLLING === 'true';
const requestedPollInterval = Number(import.meta.env.VITE_FIRESTORE_POLL_INTERVAL_MS ?? 4000);
const pollingIntervalMs = Number.isFinite(requestedPollInterval) ? Math.max(1000, requestedPollInterval) : 4000;
const disableTenantScoping = import.meta.env.VITE_DISABLE_TENANT_SCOPING === 'true';

// ─── Multi-tenancy path resolver ─────────────────────────────────────────────
const GLOBAL_COLLECTIONS = new Set([
    'properties',
    'chains',
    'brands',
    'brand_documents',
    'brand_changes',
    'feature_flags'
]);

const resolveCollectionPath = (collectionName: string): { path: string; scoped: boolean } => {
    // Explicit path provided (e.g., already tenant scoped)
    if (collectionName.startsWith('properties/')) {
        return { path: collectionName, scoped: true };
    }
    // Global collections bypass property scoping
    if (GLOBAL_COLLECTIONS.has(collectionName)) {
        return { path: collectionName, scoped: false };
    }
    // Optional fallback for environments that intentionally disable tenant scoping.
    if (disableTenantScoping) {
        return { path: collectionName, scoped: false };
    }

    const propertyId = tenantService.getActivePropertyId();
    if (!propertyId || String(propertyId).trim() === '' || String(propertyId) === 'undefined') {
        throw new Error('[Firestore] No active property. Sign in or select a property first.');
    }
    return {
        path: `properties/${propertyId}/${collectionName}`,
        scoped: true
    };
};

/** Returns a CollectionReference for the given collection (tenant-scoped). Use for direct queries. */
export const getCollectionRef = (collectionName: string): CollectionReference => {
    if (!db) {
        throw new Error('[Firestore] Database not initialized. Check Firebase configuration.');
    }
    const { path } = resolveCollectionPath(collectionName);
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.some(seg => seg === 'undefined' || seg === 'null' || seg === '')) {
        throw new Error('[Firestore] Invalid collection path. No active property selected.');
    }
    return pathSegments.length > 1
        ? collection(db, ...pathSegments as [string, ...string[]])
        : collection(db, path);
};

/**
 * Generic Fetch all from a collection
 */
export const fetchItems = async <T>(collectionName: string, ...constraints: QueryConstraint[]): Promise<T[]> => {
    return withAuthRetry(async () => {
        const { path } = resolveCollectionPath(collectionName);
        const pathSegments = path.includes('/') ? path.split('/') : [path];
        const colRef = pathSegments.length > 1 ? collection(db, ...pathSegments as [string, ...string[]]) : collection(db, path);
        const q = query(colRef, ...constraints as QueryConstraint[]);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    });
};

/**
 * Generic Fetch single document
 */
export const fetchItem = async <T>(collectionName: string, id: string): Promise<T | null> => {
    return withAuthRetry(async () => {
        const { path } = resolveCollectionPath(collectionName);
        const pathSegments = path.includes('/') ? path.split('/') : [path];
        const docRef = pathSegments.length > 1 ? doc(db, ...pathSegments as [string, ...string[]], id) : doc(db, path, id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as T;
        }
        return null;
    });
};

/**
 * Generic Subscribe to a collection (Real-time)
 */
export const subscribeToItems = <T>(
    collectionName: string,
    callback: (items: T[]) => void,
    onErrorOrConstraint?: ((error: unknown) => void) | QueryConstraint,
    ...constraints: QueryConstraint[]
) => {
    const hasErrorHandler = typeof onErrorOrConstraint === 'function';
    const onError = hasErrorHandler ? onErrorOrConstraint as (error: unknown) => void : undefined;
    const activeConstraints = (hasErrorHandler
        ? constraints
        : [onErrorOrConstraint as QueryConstraint, ...constraints]
    ).filter(Boolean) as QueryConstraint[];

    const { path } = resolveCollectionPath(collectionName);
    const pathSegments = path.includes('/') ? path.split('/') : [path];
    const colRef = pathSegments.length > 1 ? collection(db, ...pathSegments as [string, ...string[]]) : collection(db, path);
    const q = query(colRef, ...activeConstraints);

    if (usePollingSubscriptions) {
        let disposed = false;
        let inFlight = false;

        const poll = async () => {
            if (disposed || inFlight) return;
            inFlight = true;
            try {
                const snapshot = await withAuthRetry(async () => getDocs(q));
                if (disposed) return;
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
                callback(items);
            } catch (error) {
                if (disposed) return;
                if (onError) {
                    onError(error);
                } else {
                    console.error(`[Firestore] Polling subscription failed for "${collectionName}":`, error);
                }
            } finally {
                inFlight = false;
            }
        };

        void poll();
        const timer = setInterval(() => {
            void poll();
        }, pollingIntervalMs);

        return () => {
            disposed = true;
            clearInterval(timer);
        };
    }

    return onSnapshot(
        q,
        (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
            callback(items);
        },
        (error) => {
            if (onError) {
                onError(error);
                return;
            }
            console.error(`[Firestore] Subscription failed for "${collectionName}":`, error);
        }
    );
};

/**
 * Generic Update document
 */
export const updateItem = async (collectionName: string, id: string, data: Partial<DocumentData>) => {
    await withAuthRetry(async () => {
        const { path } = resolveCollectionPath(collectionName);
        const pathSegments = path.includes('/') ? path.split('/') : [path];
        const docRef = pathSegments.length > 1 ? doc(db, ...pathSegments as [string, ...string[]], id) : doc(db, path, id);
        await setDoc(docRef, data, { merge: true });
    });
};

/**
 * Generic Add document
 */
export const addItem = async (collectionName: string, data: DocumentData) => {
    return withAuthRetry(async () => {
        const { path, scoped } = resolveCollectionPath(collectionName);
        const pathSegments = path.includes('/') ? path.split('/') : [path];
        const colRef = pathSegments.length > 1 ? collection(db, ...pathSegments as [string, ...string[]]) : collection(db, path);
        const payload = scoped && !data.propertyId
            ? { ...data, propertyId: tenantService.getActivePropertyId() }
            : data;
        const customId = typeof payload?.id === 'string' ? String(payload.id) : null;
        if (customId) {
            const docRef = pathSegments.length > 1 ? doc(db, ...pathSegments as [string, ...string[]], customId) : doc(db, path, customId);
            await setDoc(docRef, payload);
            return docRef;
        }
        return await addDoc(colRef, payload);
    });
};

/**
 * Generic Delete document
 */
export const deleteItem = async (collectionName: string, id: string) => {
    await withAuthRetry(async () => {
        const { path } = resolveCollectionPath(collectionName);
        const pathSegments = path.includes('/') ? path.split('/') : [path];
        const docRef = pathSegments.length > 1 ? doc(db, ...pathSegments as [string, ...string[]], id) : doc(db, path, id);
        await deleteDoc(docRef);
    });
};
/**
 * Generic Fetch all from a collection
 */
export const queryItems = async <T>(collectionName: string, ...constraints: QueryConstraint[]): Promise<T[]> => {
    return fetchItems<T>(collectionName, ...constraints);
};
