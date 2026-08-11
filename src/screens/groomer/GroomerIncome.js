import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Label, Sub } from '../components/ui';
import { colors, gap } from '../theme';
import { api } from '../../lib/api';

export default function GroomerIncome({ session }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.listMyOrders(session?.id || 'u_groomer_demo', 'groomer').then(setOrders);
  }, []);

  const completed = orders.filter((o) => o.status === 'completed');
  const income = completed.length * 45; // 演示：每单估算 S$45

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card>
        <Label>累计收入（估算）</Label>
        <Text style={styles.big}>S$ {income}</Text>
        <Sub>已完成订单 {completed.length} 单</Sub>
      </Card>

      <Label>历史订单</Label>
      {orders.length === 0 && <Sub>暂无订单。</Sub>}
      {orders.map((o) => (
        <Card key={o.id}>
          <Text style={styles.row}>{o.pet_type === 'dog' ? '🐶' : '🐱'} {o.services.join('、')}</Text>
          <Sub>状态：{o.status} · {o.time_window}</Sub>
          {o.review && <Sub>评价：★ {o.review.rating}</Sub>}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  big: { fontSize: 28, fontWeight: '800', color: colors.primary },
  row: { fontSize: 16, fontWeight: '600' },
});
