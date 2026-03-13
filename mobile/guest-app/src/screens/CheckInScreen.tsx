import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CheckInScreen: React.FC = () => {
  const [reservationId, setReservationId] = useState('');
  const [lastName, setLastName] = useState('');
  const [mode, setMode] = useState<'checkin' | 'checkout'>('checkin');

  const submit = async () => {
    if (!reservationId || !lastName) {
      Alert.alert('Missing info', 'Reservation ID and last name are required.');
      return;
    }
    // Capture intent to check-in; backend/front desk completes verification.
    const propertyId = process.env.EXPO_PUBLIC_DEFAULT_PROPERTY_ID || 'demo_property_h1';
    const collectionName = mode === 'checkin' ? 'precheckins' : 'checkout_requests';
    await setDoc(doc(db, `properties/${propertyId}/${collectionName}`, reservationId), {
        reservationId,
        propertyId,
        lastName,
        requestedAt: Date.now(),
        status: 'Pending',
        type: mode
    }, { merge: true });
    Alert.alert('Submitted', `Your mobile ${mode === 'checkin' ? 'check-in' : 'check-out'} request has been sent.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile {mode === 'checkin' ? 'Check-In' : 'Check-Out'}</Text>
      <TextInput style={styles.input} placeholder="Reservation ID" placeholderTextColor="#7c7c7c" value={reservationId} onChangeText={setReservationId} />
      <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#7c7c7c" value={lastName} onChangeText={setLastName} />
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, mode === 'checkin' && styles.btnActive]} onPress={() => setMode('checkin')}>
          <Text style={styles.btnText}>Check-In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, mode === 'checkout' && styles.btnActive]} onPress={() => setMode('checkout')}>
          <Text style={styles.btnText}>Check-Out</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.btn, styles.submit]} onPress={submit}>
        <Text style={styles.btnText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 24 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#16161d', color: '#fff', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#20202a' },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btn: { flex: 1, backgroundColor: '#1f2937', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  btnActive: { backgroundColor: '#111827', borderColor: '#10b981' },
  submit: { backgroundColor: '#10b981', borderColor: '#10b981', marginTop: 12 },
  btnText: { color: '#fff', fontWeight: '700' }
});

export default CheckInScreen;
