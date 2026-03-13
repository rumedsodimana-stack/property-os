import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { tenant } from '../tenant';

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const pid = propertyId.trim() || process.env.EXPO_PUBLIC_DEFAULT_PROPERTY_ID || 'demo_property_h1';
      await tenant.setActivePropertyId(pid);
      navigation.replace('Home');
    } catch (err: any) {
      Alert.alert('Login failed', err.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Sign In</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#7c7c7c" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#7c7c7c" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Property ID (optional)" placeholderTextColor="#7c7c7c" value={propertyId} onChangeText={setPropertyId} />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: '600', marginBottom: 24 },
  input: { backgroundColor: '#16161d', color: '#fff', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#20202a' },
  button: { backgroundColor: '#6366f1', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' }
});

export default LoginScreen;
