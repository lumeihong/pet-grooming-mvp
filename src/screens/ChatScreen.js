import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView } from 'react-native';
import { BigButton, Sub } from '../components/ui';
import { colors, gap } from '../theme';
import { api } from '../lib/api';

// 隐私核心：仅 confirmed / in_progress 可收发；completed 后自动关闭，禁止发送
export default function ChatScreen({ route, session }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const load = async () => {
    const o = await api.getOrder(orderId);
    setOrder(o);
    const m = await api.getMessages(orderId);
    setMessages(m);
  };
  useEffect(() => { load(); }, []);

  if (!order) return <View style={styles.wrap}><Sub>加载中…</Sub></View>;

  const open = api.chatOpen(order);

  const send = async () => {
    if (!text.trim() || !open) return;
    const msg = await api.sendMessage(orderId, session?.id || 'u_client_demo', text.trim());
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setText('');
    }
  };

  if (!open) {
    return (
      <View style={styles.wrap}>
        <View style={styles.closed}>
          <Text style={styles.lock}>🔒</Text>
          <Text style={styles.closedTitle}>聊天已自动关闭</Text>
          <Sub style={{ textAlign: 'center' }}>
            服务结束后聊天自动关闭，以保护双方隐私。仅平台后台可查看记录（用于纠纷处理）。
          </Sub>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior="padding">
      <View style={styles.notice}>
        <Sub>🔒 服务结束后聊天将自动关闭，以保护双方隐私（不显示真实手机号/完整地址）</Sub>
      </View>
      <FlatList
        style={styles.list}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, (item.from === (session?.id || 'u_client_demo')) ? styles.mine : styles.theirs]}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="输入消息…"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.send} onPress={send}><Text style={{ color: '#fff', fontWeight: '700' }}>发送</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 12 },
  notice: { backgroundColor: colors.chat, borderRadius: 12, padding: 10, marginBottom: 8 },
  list: { flex: 1 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 14, marginVertical: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, color: '#fff' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  input: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 12, fontSize: 15, marginRight: 8,
  },
  send: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 },
  closed: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  lock: { fontSize: 48, marginBottom: 12 },
  closedTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
});
