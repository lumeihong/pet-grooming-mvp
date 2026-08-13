import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Sub } from '../components/ui';
import { colors } from '../theme';
import { api } from '../lib/api';
import { useSession } from '../lib/SessionContext';

export default function ChatScreen({ route }) {
  const { orderId } = route.params || {};
  const { session } = useSession();
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const load = useCallback(async () => {
    if (!orderId) return;
    const o = await api.getOrder(orderId);
    setOrder(o);
    const m = await api.getMessages(orderId);
    setMessages(m || []);
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!order) {
    return (
      <View style={styles.wrap}>
        <Sub>加载中…</Sub>
      </View>
    );
  }

  const open = api.chatOpen(order);
  const myId = session?.id || 'u_client_demo';

  const send = async () => {
    if (!text.trim() || !open) return;
    const msg = await api.sendMessage(orderId, myId, text.trim());
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
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <View style={styles.notice}>
        <Sub>🔒 服务结束后聊天将自动关闭，保护双方隐私（不显示真实手机号/完整地址）</Sub>
      </View>
      <FlatList
        style={styles.list}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => {
          const mine = item.from === myId;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{item.text}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Sub style={{ textAlign: 'center', marginTop: 24 }}>还没有消息，打个招呼吧</Sub>}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="输入消息…"
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.send} onPress={send}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>发送</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 12 },
  notice: {
    backgroundColor: colors.chat,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  list: { flex: 1 },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    marginVertical: 4,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  bubbleText: { color: '#1F2430' },
  mineText: { color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  send: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closed: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  lock: { fontSize: 40, marginBottom: 12 },
  closedTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
});

