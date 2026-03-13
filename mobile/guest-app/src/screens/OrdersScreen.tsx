import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const MENU = [
  { id: 'burger', name: 'Wagyu Burger', price: 28 },
  { id: 'salad', name: 'Caesar Salad', price: 18 },
  { id: 'mocktail', name: 'Cucumber Cooler', price: 12 },
];

const OrdersScreen: React.FC = () => {
  const [items, setItems] = useState<string[]>([]);

  const toggle = (id: string) => {
    setItems((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const submit = async () => {
    if (items.length === 0) {
      Alert.alert('No items', 'Add at least one item.');
      return;
    }
    try {
      const propertyId = process.env.EXPO_PUBLIC_DEFAULT_PROPERTY_ID || 'demo_property_h1';
      await addDoc(collection(db, `properties/${propertyId}/room_service_orders`), {
        items: MENU.filter((m) => items.includes(m.id)),
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      Alert.alert('Order placed', 'Room service will confirm shortly.');
      setItems([]);
    } catch (err: any) {
      Alert.alert('Order failed', err.message || 'Unable to place order');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Food & Beverage</Text>
      <FlatList
        data={MENU}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const selected = items.includes(item.id);
          return (
            <TouchableOpacity style={[styles.card, selected && styles.cardSelected]} onPress={() => toggle(item.id)}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price}</Text>
            </TouchableOpacity>
          );
        }}
      />
      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Place Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#16161d', borderColor: '#1f1f2a', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  cardSelected: { borderColor: '#10b981' },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  price: { color: '#9ca3af', marginTop: 4 },
  btn: { marginTop: 'auto', backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' }
});

export default OrdersScreen;
