import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { functions, storage } from '../firebase';
import { tenant } from '../tenant';

const QualityScreen: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyze = async () => {
    try {
      if (!roomId.trim()) {
        Alert.alert('Room required', 'Enter a room number before capture.');
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') throw new Error('Camera permission required');

      const capture = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
      if (capture.canceled || !capture.assets?.length) return;

      setLoading(true);
      const propertyId = await tenant.getActivePropertyId();
      const asset = capture.assets[0];
      const base64 = asset.base64;
      let imageUrl: string | undefined;

      if (base64) {
        const buffer = Buffer.from(base64, 'base64');
        const fileRef = ref(storage, `properties/${propertyId}/room_quality/${roomId}_${Date.now()}.jpg`);
        await uploadBytes(fileRef, buffer, { contentType: 'image/jpeg' });
        imageUrl = await getDownloadURL(fileRef);
      } else if (asset.uri) {
        imageUrl = asset.uri;
      }

      const callable = httpsCallable(functions, 'analyzeRoomQuality');
      const res: any = await callable({ propertyId, roomId, imageUrl });
      setResult(res.data);
    } catch (err: any) {
      Alert.alert('Quality Check', err.message || 'Failed to analyze room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Room Quality QA</Text>
      <Text style={styles.caption}>Capture a room photo to auto-check bed, linens, towels, minibar, and clutter.</Text>

      <TextInput
        placeholder="Room number"
        placeholderTextColor="#8b8ca6"
        value={roomId}
        onChangeText={setRoomId}
        style={styles.input}
      />

      <TouchableOpacity style={styles.btn} onPress={analyze} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Capture & Analyze</Text>}
      </TouchableOpacity>

      {result && (
        <View style={styles.card}>
          <Text style={styles.resultTitle}>Score: {result.score ?? '-'} / 100</Text>
          <Text style={[styles.badge, result.pass ? styles.badgePass : styles.badgeFail]}>
            {result.pass ? 'PASS' : 'FAIL'}
          </Text>
          <Text style={styles.section}>Findings</Text>
          {(result.findings || []).map((f: string, idx: number) => (
            <Text key={idx} style={styles.textItem}>• {f}</Text>
          ))}
          <Text style={styles.section}>Recommendations</Text>
          {(result.recommendations || []).map((f: string, idx: number) => (
            <Text key={idx} style={styles.textItem}>• {f}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  caption: { color: '#8b8ca6', fontSize: 13, marginBottom: 16 },
  input: { backgroundColor: '#16161d', color: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1f1f2a', marginBottom: 12 },
  btn: { backgroundColor: '#8b5cf6', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  card: { marginTop: 16, backgroundColor: '#16161d', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1f1f2a' },
  resultTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  badge: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 11, fontWeight: '800' },
  badgePass: { backgroundColor: '#10b981', color: '#02100a' },
  badgeFail: { backgroundColor: '#f43f5e', color: '#2e030c' },
  section: { color: '#cbd5f5', fontSize: 13, marginTop: 10, fontWeight: '700' },
  textItem: { color: '#e5e7eb', fontSize: 13, marginTop: 4 }
});

export default QualityScreen;
