import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

const ConciergeScreen: React.FC = () => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ role: 'guest' | 'ai'; text: string }[]>([]);

  const send = () => {
    if (!message.trim()) return;
    const updated = [...history, { role: 'guest', text: message }];
    setHistory(updated);
    setMessage('');
    // Placeholder: call existing AI concierge endpoint/LLM here
    setHistory([
      ...updated,
      { role: 'ai', text: 'Thanks! A concierge will reply shortly. (Wire to AI concierge API).' }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Concierge</Text>
      <FlatList
        data={history}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <Text style={item.role === 'guest' ? styles.guest : styles.ai}>{item.text}</Text>
        )}
        contentContainerStyle={{ paddingVertical: 12 }}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask anything..."
          placeholderTextColor="#7c7c7c"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.send} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0f', padding: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  guest: { alignSelf: 'flex-end', backgroundColor: '#6366f1', color: '#fff', padding: 10, borderRadius: 10, marginVertical: 4, maxWidth: '80%' },
  ai: { alignSelf: 'flex-start', backgroundColor: '#16161d', color: '#fff', padding: 10, borderRadius: 10, marginVertical: 4, maxWidth: '80%' },
  inputRow: { flexDirection: 'row', marginTop: 'auto', alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: '#16161d', color: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#20202a' },
  send: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  sendText: { color: '#0b0b0f', fontWeight: '700' }
});

export default ConciergeScreen;
