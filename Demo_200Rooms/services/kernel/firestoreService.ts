
import { db } from './firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    addDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    orderBy,
    limit,
    DocumentData,
    QueryConstraint
} from 'firebase/firestore';

/**
 * Generic Fetch all from a collection
 */
export const fetchItems = async <T>(collectionName: string, ...constraints: QueryConstraint[]): Promise<T[]> => {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

/**
 * Generic Fetch single document
 */
export const fetchItem = async <T>(collectionName: string, id: string): Promise<T | null> => {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as T;
    }
    return null;
};

/**
 * Generic Subscribe to a collection (Real-time)
 */
export const subscribeToItems = <T>(
    collectionName: string,
    callback: (items: T[]) => void,
    ...constraints: QueryConstraint[]
) => {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        callback(items);
    });
};

/**
 * Generic Update document
 */
export const updateItem = async (collectionName: string, id: string, data: Partial<DocumentData>) => {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
};

/**
 * Generic Add document
 */
export const addItem = async (collectionName: string, data: DocumentData) => {
    const colRef = collection(db, collectionName);
    return await addDoc(colRef, data);
};

/**
 * Generic Delete document
 */
export const deleteItem = async (collectionName: string, id: string) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
};
/**
 * Generic Fetch all from a collection
 */
export const queryItems = async <T>(collectionName: string, ...constraints: QueryConstraint[]): Promise<T[]> => {
    return fetchItems<T>(collectionName, ...constraints);
};
