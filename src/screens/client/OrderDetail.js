import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BigButton, Card, Label, Sub, StatusBar } from '../../components/ui';
import { colors, gap } from '../../theme';
import { api, API_MODE } from '../../lib/api';
import { useSession } from '../../lib/SessionContext';

export default function OrderDetail({ navigation, route }) {
  const { orderId } = route.params || {};
  const { session } = useSession();
  const [order, setOrder] = useState(null);
  const [groomer, setGroomer] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    const o = await api.getOrder(orderId);
    setOrder(o);
    if (o?.groomer_id) {
      const g = await api.getGroomerProfile(o.groomer_id);
      setGroomer(g);
    }
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

  const chatOpen = api.chatOpen(order);

  // Demo：客户侧也可模拟推进状态，方便 Expo Go 单端走完整闭环
  const demoAdvance = async (next) => {
    setBusy(true);
    try {
      if (next === 'completed') {
        await api.completeOrder(order.id);
      } else {
        await api.advanceStatus(order.id, next);
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <StatusBar status={order.status} />

      <Card>
        <Label>美容师（脱敏）</Label>
        <Text style={styles.name}>
          {groomer?.name || '待接单'} · ★ {groomer?.rating ?? '-'}
        </Text>
        <Sub>不显示真实手机号与完整地址，仅订单页可见</Sub>
      </Card>

      <Card>
        <Label>服务信息</Label>
        <Sub>
          {order.pet_type === 'dog' ? '🐶' : '🐱'} {order.pet_size} · {(order.services || []).join('、')}
        </Sub>
        <Sub>时间：{order.time_window}</Sub>
        <Sub>地址：{order.address}</Sub>
        <Sub>
          定金：S$ {order.deposit_amount || 10}
          {order.deposit_paid ? '（已付）' : ''}
        </Sub>
      </Card>

      <BigButton
        label={chatOpen ? '进入聊天' : '聊天未开启'}
        onPress={() => chatOpen && navigation.navigate('Chat', { orderId: order.id })}
        disabled={!chatOpen}
      />
      {!chatOpen && order.status !== 'completed' && (
        <Sub style={{ textAlign: 'center', marginBottom: gap }}>聊天将在支付定金后开启，服务完成后自动关闭</Sub>
      )}

      {order.status === 'confirmed' && API_MODE === 'demo' && (
        <BigButton
          label={busy ? '处理中…' : '【演示】模拟美容师出发/服务中'}
          variant="ghost"
          disabled={busy}
          onPress={() => demoAdvance('in_progress')}
        />
      )}
      {order.status === 'in_progress' && API_MODE === 'demo' && (
        <BigButton
          label={busy ? '处理中…' : '【演示】模拟服务完成'}
          variant="ghost"
          disabled={busy}
          onPress={() => demoAdvance('completed')}
        />
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

