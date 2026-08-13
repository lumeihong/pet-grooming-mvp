import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BigButton, Card, Label, Sub } from '../../components/ui';
import { colors } from '../../theme';
import { api } from '../../lib/api';
import { useSession } from '../../lib/SessionContext';

export default function OrderTake({ navigation, route }) {
  const { orderId } = route.params || {};
  const { session } = useSession();
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (orderId) api.getOrder(orderId).then(setOrder);
  }, [orderId]);

  if (!order) {
    return (
      <View style={styles.wrap}>
        <Sub>加载中…</Sub>
      </View>
    );
  }

  const take = async () => {
    setBusy(true);
    try {
      const gid = session?.id || 'u_groomer_demo';
      // 演示路径：接单后直接进入 confirmed（客户侧通常已付定金；若从大厅直接接则一并模拟）
      await api.confirmGroomer(order.id, gid);
      const o = await api.getOrder(order.id);
      if (o && o.status === 'awaiting_deposit') {
        await api.payDeposit(order.id);
      }
      navigation.replace('ActiveOrders');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Label>订单详情（未接单）</Label>
      <Card>
        <Text style={styles.row}>
          {order.pet_type === 'dog' ? '🐶' : '🐱'} {order.pet_size} · {(order.services || []).join('、')}
        </Text>
        <Sub>客户偏好时间：{order.time_window}</Sub>
        <Sub>大致区域：{order.address}</Sub>
        <Sub>预算：{order.budget_max ? `S$ ${order.budget_max}` : '不限'}</Sub>
        <Sub>备注：{order.note || '无'}</Sub>
      </Card>
      <BigButton label={busy ? '接单中…' : '接单'} onPress={take} disabled={busy} />
      <Sub style={{ textAlign: 'center' }}>接单后订单进入进行中，可与客户临时聊天</Sub>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.bg },
  row: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
});

