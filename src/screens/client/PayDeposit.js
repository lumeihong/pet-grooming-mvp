import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BigButton, Card, Label, Sub, Pill } from '../../components/ui';
import { colors, gap } from '../../theme';
import { api } from '../../lib/api';

export default function PayDeposit({ navigation, route }) {
  const { orderId } = route.params || {};
  const [method, setMethod] = useState('paynow');
  const [paying, setPaying] = useState(false);

  const deposit = 10;

  const pay = async () => {
    if (!orderId) return;
    setPaying(true);
    try {
      // 演示：模拟支付成功。真实版在此调用 PayNow / Stripe
      await new Promise((r) => setTimeout(r, 500));
      const order = await api.payDeposit(orderId);
      navigation.replace('OrderDetail', { orderId: order.id });
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Label>订单摘要</Label>
      <Card>
        <Sub>订单号：{orderId}</Sub>
        <Sub>定金金额：S$ {deposit}</Sub>
        <Sub>支付后开启临时聊天，服务结束后自动关闭。</Sub>
      </Card>

      <Label>支付方式</Label>
      <View style={styles.row}>
        <Pill active={method === 'paynow'} onPress={() => setMethod('paynow')}>
          PayNow（优先）
        </Pill>
        <Pill active={method === 'card'} onPress={() => setMethod('card')}>
          信用卡
        </Pill>
      </View>

      <BigButton
        label={paying ? '支付中…' : `确认支付 S$ ${deposit}`}
        onPress={pay}
        disabled={paying}
      />
      <Sub style={{ textAlign: 'center' }}>演示环境：点击即模拟支付成功</Sub>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, flex: 1 },
  row: { flexDirection: 'row', marginBottom: gap, flexWrap: 'wrap' },
});

