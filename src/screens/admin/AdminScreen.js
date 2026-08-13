import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Label, Sub, STATUS_LABEL } from '../../components/ui';
import { colors } from '../../theme';
import { api } from '../../lib/api';

// 极简后台（只读）：数据概览 / 订单列表 / 聊天记录(纠纷处理)。
// 不做管理操作，MVP 阶段仅用于监控与纠纷取证。
export default function AdminScreen() {
  const [overview, setOverview] = useState(null);
  const [groomerCount, setGroomerCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [chat, setChat] = useState(null);

  const load = async () => {
    setOverview(await api.adminOverview());
    setGroomerCount((await api.adminGroomers()).length);
    setOrders(await api.adminOrders());
  };
  useEffect(() => { load(); }, []);

  const viewChat = async (orderId) => {
    const m = await api.adminChat(orderId);
    setChat({ orderId, messages: m });
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Label>数据概览</Label>
      <Card>
        <Sub>累计订单:{overview?.total ?? 0}</Sub>
        <Sub>已完成:{overview?.completed ?? 0}</Sub>
        <Sub>完成率:{((overview?.completion_rate ?? 0) * 100).toFixed(0)}%</Sub>
        <Sub>入驻美容师:{groomerCount}</Sub>
      </Card>

      <Label>订单列表（只读）</Label>
      {orders.length === 0 && <Sub>暂无订单。</Sub>}
      {orders.map((o) => (
        <Card key={o.id}>
          <Text style={styles.row}>
            {o.pet_type === 'dog' ? '🐶' : '🐱'} {(o.services || []).join('、')} · {STATUS_LABEL[o.status] || o.status}
          </Text>
          <Sub>订单号:{o.id.slice(-6)} · 定金:{o.deposit_paid ? '已付' : '未付'}</Sub>
          <TouchableOpacity onPress={() => viewChat(o.id)}>
            <Text style={styles.link}>查看聊天记录（纠纷） →</Text>
          </TouchableOpacity>
        </Card>
      ))}

      {chat && (
        <Card>
          <Label>聊天记录（订单 {chat.orderId.slice(-6)}）</Label>
          {chat.messages.length === 0 && <Sub>无消息</Sub>}
          {chat.messages.map((m) => (
            <Sub key={m.id}>{m.text}</Sub>
          ))}
          <Sub style={{ marginTop: 6 }}>平台保留记录仅用于纠纷处理</Sub>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  row: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  link: { color: colors.primary, fontWeight: '700', marginTop: 4 },
});
