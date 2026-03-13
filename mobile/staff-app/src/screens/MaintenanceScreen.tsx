import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { tenant } from '../tenant';
import { offlineQueue } from '../offlineQueue';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, serverTimestamp } from 'firebase/firestore';

type Ticket = { id: string; description: string; priority: string; status: string; location?: string };

const MaintenanceScreen: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    tenant.getActivePropertyId().then((propertyId) => {
      unsub = onSnapshot(collection(db, `properties/${propertyId}/maintenanceTasks`), (snap) => {
        setTickets(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Ticket[]);
      });
    });
    return () => { if (unsub) unsub(); };
  }, []);

  const start = async (t: Ticket) => {
    const propertyId = await tenant.getActivePropertyId();
    const path = `properties/${propertyId}/maintenanceTasks/${t.id}`;
    try {
      await updateDoc(doc(db, path), { status: 'In Progress', startedAt: Date.now() });
    } catch (err) {
      await offlineQueue.enqueue({ id: `mt-${t.id}`, path, data: { status: 'In Progress', startedAt: Date.now() }, merge: true });
    }
  };

  const raise = async () => {
    try {
      setSubmitting(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission required to log maintenance photos.');
      }
      const capture = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
      if (capture.canceled) return;
      const propertyId = await tenant.getActivePropertyId();
      const payload = {
        description: 'Maintenance issue reported via mobile',
        priority: 'High',
        status: 'Open',
        photo: capture.assets?.[0]?.base64 ? `data:image/jpeg;base64,${capture.assets[0].base64}` : null,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, `properties/${propertyId}/maintenanceTasks`), payload);
      Alert.alert('Submitted', 'Maintenance ticket created.');
    } catch (err: any) {
      Alert.alert('Maintenance', err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.description}</Text>
            <Text style={styles.sub}>{item.location || 'Unspecified location'}</Text>
            <Text style={[styles.badge, item.priority === 'High' ? styles.badgeHigh : styles.badgeNormal]}>{item.priority}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => start(item)}>
              <Text style={styles.btnText}>Start</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No maintenance tickets.</Text>}
      />
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#6366f1', marginTop: 12 }]} onPress={raise} disabled={submitting}>
        <Text style={styles.btnText}>{submitting ? 'Submitting...' : 'Raise Ticket with Photo'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 12 },
  card: { backgroundColor: '#16161d', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1f1f2a', marginBottom: 10 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sub: { color: '#8b8ca6', marginTop: 4, fontSize: 12 },
  badge: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 11, fontWeight: '700' },
  badgeHigh: { backgroundColor: '#f43f5e', color: '#2e030c' },
  badgeNormal: { backgroundColor: '#fbbf24', color: '#201400' },
  btn: { marginTop: 10, backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { color: '#8b8ca6', textAlign: 'center', marginTop: 40 }
});

export default MaintenanceScreen;
