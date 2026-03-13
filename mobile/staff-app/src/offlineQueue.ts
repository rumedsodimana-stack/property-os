import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const QUEUE_KEY = 'hs_offline_queue_v1';

export type QueuedMutation = {
  id: string;
  path: string; // full firestore doc path
  data: any;
  merge?: boolean;
};

export const offlineQueue = {
  async enqueue(mutation: QueuedMutation) {
    const current = await offlineQueue._load();
    current.push(mutation);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(current));
  },

  async process(): Promise<void> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;
    const current = await offlineQueue._load();
    if (current.length === 0) return;
    const remaining: QueuedMutation[] = [];

    for (const m of current) {
      try {
        await setDoc(doc(db, m.path), m.data, { merge: m.merge ?? true });
      } catch (err) {
        console.warn('[OfflineQueue] Failed to flush mutation', m.id, err);
        remaining.push(m);
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  },

  async _load(): Promise<QueuedMutation[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedMutation[];
    } catch {
      return [];
    }
  }
};
