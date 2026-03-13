import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../firebase';
import { tenant } from '../tenant';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ensureInsideGeofence } from '../geofence';

const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const user = auth.currentUser;
  const [busy, setBusy] = useState(false);

  const clock = async (type: 'in' | 'out') => {
    try {
      setBusy(true);
      const propertyId = await tenant.getActivePropertyId();
      const lat = Number(process.env.EXPO_PUBLIC_PROPERTY_LAT || 0);
      const lon = Number(process.env.EXPO_PUBLIC_PROPERTY_LON || 0);
      if (lat && lon) await ensureInsideGeofence(lat, lon, 150);
      await addDoc(collection(db, `properties/${propertyId}/shifts`), {
        userId: user?.uid || 'unknown',
        type,
        at: serverTimestamp()
      });
      Alert.alert('Shift', `Clock ${type} recorded`);
    } catch (err: any) {
      Alert.alert('Shift', err.message || 'Failed to record shift');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await auth.signOut();
    await tenant.clear();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.label}>User</Text>
      <Text style={styles.value}>{user?.email || 'Unknown'}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#10b981' }]} onPress={() => clock('in')} disabled={busy}>
          <Text style={styles.btnText}>Clock In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#f59e0b' }]} onPress={() => clock('out')} disabled={busy}>
          <Text style={styles.btnText}>Clock Out</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.btn, { marginTop: 24, backgroundColor: '#ef4444' }]} onPress={logout}>
        <Text style={styles.btnText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 },
  value: { color: '#fff', fontSize: 16, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, marginTop: 0, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' }
});

export default ProfileScreen;
