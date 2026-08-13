import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BigButton, Card, Sub, STATUS_LABEL } from '../../components/ui';
import { colors, gap } from '../../theme';
import { api } from '../../lib/api';
import { useSession } from '../../lib/SessionContext';

export default function ClientHome({ navigation }) {
  const { session } = useSession();
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    if (!session?.id) return;
    const list = await api.listMyOrders(session.id, 'client');
    setOrders(list || []);
  }, [session?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const active = orders.find((o) =>
    ['confirmed', 'in_progress', 'matching', 'awaiting_deposit'].includes(o.status)
  );

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>上门宠物美容</Text>
      <Sub style={{ marginBottom: gap }}>新加坡 · 双向匹配 · 隐私临时聊天</Sub>

      <BigButton label="🐶 发布上门美容需求" onPress={() => navigation.navigate('PostRequest')} />

      {active && (
        <Card>
          <Sub>进行中订单</Sub>
          <Text style={styles.big}>{STATUS_LABEL[active.status] || active.status}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { orderId: active.id })}>
            <Text style={styles.link}>查看订单详情 →</Text>
          </TouchableOpacity>
        </Card>
      )}

      <Text style={styles.section}>历史订单</Text>
      {orders.length === 0 && <Sub>还没有订单，发布第一个需求吧。</Sub>}
      {orders.map((o) => (
        <TouchableOpacity key={o.id} onPress={() => navigation.navigate('OrderDetail', { orderId: o.id })}>
          <Card>
            <Text style={styles.row}>
              {o.pet_type === 'dog' ? '🐶' : '🐱'} {(o.services || []).join('、')}
            </Text>
            <Sub>{STATUS_LABEL[o.status] || o.status}</Sub>
          </Card>
        </TouchableOpacity>
      ))}

      <View style={{ height: 12 }} />
      <TouchableOpacity onPress={() => navigation.navigate('MyProfile')}>
        <Text style={styles.link}>我的 / 切换角色 →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  section: { fontSize: 16, fontWeight: '700', marginVertical: gap / 2 },
  big: { fontSize: 20, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  link: { color: colors.primary, fontWeight: '700', marginTop: 6 },
  row: { fontSize: 16, fontWeight: '600' },
});

