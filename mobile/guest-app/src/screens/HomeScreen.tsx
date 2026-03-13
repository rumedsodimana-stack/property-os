import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HomeScreen: React.FC<any> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Hotel Singularity</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('CheckIn')}>
        <Text style={styles.btnText}>Mobile Check-In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Key')}>
        <Text style={styles.btnText}>Digital Key</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Concierge')}>
        <Text style={styles.btnText}>AI Concierge</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Orders')}>
        <Text style={styles.btnText}>Order Food & Beverage</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 32 },
  btn: { width: '100%', backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});

export default HomeScreen;
