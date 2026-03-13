import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const KeyScreen: React.FC = () => {
  const requestKey = () => {
    Alert.alert('Digital Key', 'Your digital key request has been sent. (Integrate with ASSA ABLOY/Dormakaba SDKs.)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digital Room Key</Text>
      <Text style={styles.subtitle}>Secure BLE keys are issued after check-in. Keep Bluetooth enabled.</Text>
      <TouchableOpacity style={styles.btn} onPress={requestKey}>
        <Text style={styles.btnText}>Request Key</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 24 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#9ca3af', marginBottom: 16 },
  btn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' }
});

export default KeyScreen;
