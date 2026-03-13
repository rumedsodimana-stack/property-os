import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { tenant } from '../tenant';

type Message = { id: string; text: string; senderId: string; createdAt?: any };

const MessagesScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    let unsub: (() => void) | undefined;
    tenant.getActivePropertyId().then((propertyId) => {
      const q = query(collection(db, `properties/${propertyId}/messages`), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      });
    });
    return () => { if (unsub) unsub(); };
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    const propertyId = await tenant.getActivePropertyId();
    await addDoc(collection(db, `properties/${propertyId}/messages`), {
      text,
      senderId: auth.currentUser?.uid || 'staff',
      createdAt: serverTimestamp()
    });
    setText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messaging</Text>
      <FlatList
        data={messages}
        keyExtractor={(i) => i.id}
        inverted
        renderItem={({ item }) => (
          <View style={item.senderId === auth.currentUser?.uid ? styles.bubbleMe : styles.bubble}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} placeholder="Send a message" placeholderTextColor="#7c7c7c" value={text} onChangeText={setText} />
        <TouchableOpacity style={styles.btn} onPress={send}>
          <Text style={styles.btnText}>Send</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Inbound WhatsApp/SMS can be piped into this collection via Twilio/WhatsApp webhooks.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#9ca3af', marginTop: 8, fontSize: 12 },
  bubble: { alignSelf: 'flex-start', backgroundColor: '#16161d', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1f1f2a' },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#4f46e5', padding: 10, borderRadius: 10 },
  bubbleText: { color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 'auto', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#16161d', color: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#20202a' },
  btn: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#0b0b0f', fontWeight: '700' }
});

export default MessagesScreen;
