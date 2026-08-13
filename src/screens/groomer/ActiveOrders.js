import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BigButton, Card, Label, Sub, StatusBar, STATUS_LABEL } from '../../components/ui';
import { colors } from '../../theme';
import { api } from '../../lib/api';
import { useSession } from '../../lib/SessionContext';

// 进行中订单：美容师操作仅两步 —— 开始服务 / 完成服务。
export default function ActiveOrders({ navigation }) {
  const { session } = useSession();
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    if (!session?.id) return;
    const list = await api.listAssignedOrders(session.id);
    setOrders((list || []).filter((o) => ['confirmed', 'in_progress'].includes(o.status)));
  }, [session?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const advance = async (id, next) => {
    if (next === 'completed') {
      await api.completeOrder(id);
    } else {
      await api.advanceStatus(id, next);
    }
    load();
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Label>进行中订单（{orders.length}）</Label>
      {orders.length === 0 && <Sub>暂无进行中订单。</Sub>}
      {orders.map((o) => (
        <Card key={o.id}>
          <StatusBar status={o.status} />
          <Text style={styles.row}>
            {o.pet_type === 'dog' ? '🐶' : '🐱'} {(o.services || []).join('、')}
          </Text>
          <Sub>{STATUS_LABEL[o.status] || o.status}</Sub>

          {api.chatOpen(o) && (
            <TouchableOpacity onPress={() => navigation.navigate('Chat', { orderId: o.id })}>
              <Text style={styles.link}>进入聊天 →</Text>
            </TouchableOpacity>
          )}

          {o.status === 'confirmed' && (
            <BigButton label="开始服务" onPress={() => advance(o.id, 'in_progress')} />
          )}
          {o.status === 'in_progress' && (
            <BigButton label="完成服务" onPress={() => advance(o.id, 'completed')} />
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  row: { fontSize: 16, fontWeight: '600', marginTop: 6 },
  link: { color: colors.primary, fontWeight: '700', marginTop: 8 },
});
