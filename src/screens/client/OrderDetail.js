import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BigButton, Card, Label, Sub, StatusBar } from '../components/ui';
import { colors, gap } from '../theme';
import { api } from '../../lib/api';

export default function OrderDetail({ navigation, route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [groomer, setGroomer] = useState(null);

  const load = async () => {
    const o = await api.getOrder(orderId);
    setOrder(o);
    if (o?.groomer_id) {
      const g = await api.getGroomerProfile(o.groomer_id);
      setGroomer(g);
    }
  };
  useEffect(() => { load(); }, []);

  if (!order) return <View style={styles.wrap}><Sub>加载中…</Sub></View>;

  const chatOpen = api.chatOpen(order);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <StatusBar status={order.status} />

      <Card>
        <Label>美容师（脱敏）</Label>
        <Text style={styles.name}>{groomer?.name || '待接单'} · ★ {groomer?.rating ?? '-'}</Text>
        <Sub>不显示真实手机号与完整地址，仅订单页可见</Sub>
      </Card>

      <Card>
        <Label>服务信息</Label>
        <Sub>{order.pet_type === 'dog' ? '🐶' : '🐱'} {order.pet_size} · {order.services.join('、')}</Sub>
        <Sub>时间：{order.time_window}</Sub>
        <Sub>地址：{order.address}</Sub>
        <Sub>定金：S$ {order.deposit_amount || 10}{order.deposit_paid ? '（已付）' : ''}</Sub>
      </Card>

      <BigButton
        label={chatOpen ? '进入聊天' : '聊天未开启'}
        onPress={() => chatOpen && navigation.navigate('Chat', { orderId: order.id })}
        disabled={!chatOpen}
      />
      {!chatOpen && order.status !== 'completed' && (
        <Sub style={{ textAlign: 'center', marginBottom: gap }}>聊天将在支付定金后开启</Sub>
      )}
      {order.status === 'completed' && (
        <BigButton
          label="去评价"
          variant="ghost"
          onPress={() => navigation.navigate('Review', { orderId: order.id })}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
});
