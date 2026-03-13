import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { tenant } from '../tenant';
import { offlineQueue } from '../offlineQueue';

type Task = {
  id: string;
  title: string;
  status: string;
  roomId?: string;
  assignedTo?: string;
};

const TasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    tenant.getActivePropertyId().then((propertyId) => {
      const q = query(collection(db, `properties/${propertyId}/tasks`), where('status', 'in', ['Open', 'In Progress', 'Pending']));
      unsubscribe = onSnapshot(q, (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Task[];
        setTasks(rows);
      });
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const markDone = async (task: Task) => {
    const propertyId = await tenant.getActivePropertyId();
    const path = `properties/${propertyId}/tasks/${task.id}`;
    try {
      await updateDoc(doc(db, path), { status: 'Completed', completedAt: Date.now() });
    } catch (err) {
      await offlineQueue.enqueue({ id: `task-${task.id}`, path, data: { status: 'Completed', completedAt: Date.now() }, merge: true });
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            {item.roomId && <Text style={styles.sub}>Room {item.roomId}</Text>}
            <View style={styles.footer}>
              <Text style={styles.status}>{item.status}</Text>
              <TouchableOpacity style={styles.btn} onPress={() => markDone(item)}>
                <Text style={styles.btnText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No open tasks.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 12 },
  card: { backgroundColor: '#16161d', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#1f1f2a' },
  title: { color: '#fff', fontWeight: '600', fontSize: 16 },
  sub: { color: '#8b8ca6', marginTop: 4, fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  status: { color: '#cbd5e1', fontSize: 12 },
  btn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: '#0b0b0f', fontWeight: '700', fontSize: 12 },
  empty: { color: '#8b8ca6', textAlign: 'center', marginTop: 40 }
});

export default TasksScreen;
