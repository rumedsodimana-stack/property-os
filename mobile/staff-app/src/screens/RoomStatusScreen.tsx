import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { tenant } from '../tenant';

type Room = {
  id: string;
  number?: string;
  status?: string;
  type?: string;
};

const RoomStatusScreen: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    tenant.getActivePropertyId().then((propertyId) => {
      unsub = onSnapshot(collection(db, `properties/${propertyId}/rooms`), (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Room[];
        setRooms(rows);
      });
    });
    return () => { if (unsub) unsub(); };
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>Room {item.number || item.id}</Text>
            <Text style={styles.sub}>{item.type || 'Unknown type'}</Text>
            <Text style={[styles.badge, item.status?.includes('Dirty') ? styles.badgeDirty : styles.badgeClean]}>
              {item.status || 'Unknown'}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No rooms loaded.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 12 },
  card: { backgroundColor: '#16161d', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1f1f2a', marginBottom: 10 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sub: { color: '#8b8ca6', marginTop: 4, fontSize: 12 },
  badge: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, fontSize: 11, fontWeight: '700' },
  badgeClean: { backgroundColor: '#10b981', color: '#02100a' },
  badgeDirty: { backgroundColor: '#f43f5e', color: '#2e030c' },
  empty: { color: '#8b8ca6', textAlign: 'center', marginTop: 40 }
});

export default RoomStatusScreen;
