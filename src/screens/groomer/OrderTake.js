import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BigButton, Card, Label, Sub, StatusBar, STATUS_LABEL } from '../../components/ui';
import { colors } from '../../theme';
import { api } from '../../lib/api';

// 指派订单详情（绑定模式）：订单由客户选定本美容师后派入。
// 操作仅两步：开始服务（confirmed -> in_progress）、完成服务（-> completed）。
export default function OrderTake({ navigation, route }) {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (orderId) api.getOrder(orderId).then(setOrder);
    }, [orderId])
  );

  if (!order) {
    return (
      <View style={styles.wrap}>
        <Sub>加载中…</Sub>
      </View>
    );
  }

  const start = async () => {
    setBusy(true);
    try {
      await api.advanceStatus(order.id, 'in_progress');
      navigation.replace('ActiveOrders');
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      await api.completeOrder(order.id);
      navigation.replace('GroomerHome');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Label>指派订单详情</Label>
      <Card>
        <StatusBar status={order.status} />
        <Text style={styles.row}>
          {order.pet_type === 'dog' ? '🐶' : '🐱'} {order.pet_size} · {(order.services || []).join('、')}
        </Text>
        <Sub>状态:{STATUS_LABEL[order.status] || order.status}</Sub>
        <Sub>客户偏好时间:{order.time_window}</Sub>
        <Sub>大致区域:{order.address}</Sub>
        <Sub>预算:{order.budget_max ? `S$ ${order.budget_max}` : '不限'}</Sub>
        <Sub>定金:{order.deposit_paid ? '已支付' : '待支付'}</Sub>
        <Sub>备注:{order.note || '无'}</Sub>
      </Card>

      {order.status === 'awaiting_deposit' && (
        <Sub style={styles.hint}>客户已选择您。待客户支付定金后，即可开始服务并开启临时聊天。</Sub>
      )}
      {order.status === 'confirmed' && (
        <BigButton label={busy ? '处理中…' : '开始服务'} onPress={start} disabled={busy} />
      )}
      {order.status === 'in_progress' && (
        <View>
          {api.chatOpen(order) && (
            <BigButton
              label="进入聊天"
              variant="ghost"
              onPress={() => navigation.navigate('Chat', { orderId: order.id })}
            />
          )}
          <BigButton label={busy ? '处理中…' : '完成服务'} onPress={finish} disabled={busy} />
        </View>
      )}
      {(order.status === 'completed' || order.status === 'cancelled') && (
        <Sub style={styles.hint}>该订单已结束。</Sub>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.bg },
  row: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  hint: { textAlign: 'center', marginTop: 8 },
});
