import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BigButton, Card, Label, Sub } from '../components/ui';
import { colors, gap } from '../theme';
import { api } from '../../lib/api';

export default function OrderTake({ navigation, route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.getOrder(orderId).then(setOrder);
  }, []);

  if (!order) return <View style={styles.wrap}><Sub>加载中…</Sub></View>;

  const take = async () => {
    await api.confirmGroomer(order.id, 'u_groomer_demo'); // 演示：当前美容师接单
    await api.payDeposit(order.id); // 客户定金已由系统标记（演示）
    navigation.replace('ActiveOrders');
  };

  return (
    <View style={styles.wrap}>
      <Label>订单详情（未接单）</Label>
      <Card>
        <Text style={styles.row}>{order.pet_type === 'dog' ? '🐶' : '🐱'} {order.pet_size} · {order.services.join('、')}</Text>
        <Sub>客户偏好时间：{order.time_window}</Sub>
        <Sub>大致区域：{order.address}</Sub>
        <Sub>预算：{order.budget_max ? `S$ ${order.budget_max}` : '不限'}</Sub>
        <Sub>备注：{order.note || '无'}</Sub>
      </Card>
      <BigButton label="接单" onPress={take} />
      <Sub style={{ textAlign: 'center' }}>接单后订单进入「进行中」，可开启临时聊天</Sub>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.bg },
  row: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
});
