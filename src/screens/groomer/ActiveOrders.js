import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BigButton, Card, Label, Sub, StatusBar } from '../components/ui';
import { colors, gap } from '../theme';
import { api } from '../../lib/api';

export default function ActiveOrders({ navigation, session }) {
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const list = await api.listMyOrders(session?.id || 'u_groomer_demo', 'groomer');
    setOrders(list.filter((o) => ['confirmed', 'in_progress', 'awaiting_deposit'].includes(o.status)));
  };
  useEffect(() => { load(); }, []);

  const advance = async (id, next) => {
    await api.advanceStatus(id, next);
    load();
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Label>进行中订单（{orders.length}）</Label>
      {orders.length === 0 && <Sub>暂无进行中订单。</Sub>}
      {orders.map((o) => (
        <Card key={o.id}>
          <StatusBar status={o.status} />
          <Text style={styles.row}>{o.pet_type === 'dog' ? '🐶' : '🐱'} {o.services.join('、')}</Text>
          <Sub>{o.time_window} · {o.address}</Sub>
          <View style={styles.actions}>
            {o.status === 'confirmed' && <BigButton label="我已出发" onPress={() => advance(o.id, 'in_progress')} />}
            {o.status === 'in_progress' && <BigButton label="标记服务完成" onPress={() => advance(o.id, 'completed')} />}
            <TouchableOpacity onPress={() => navigation.navigate('Chat', { orderId: o.id })}>
              <Text style={styles.link}>进入聊天 →</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  row: { fontSize: 16, fontWeight: '600', marginVertical: 4 },
  actions: { marginTop: 4 },
  link: { color: colors.primary, fontWeight: '700', marginTop: 6 },
});
