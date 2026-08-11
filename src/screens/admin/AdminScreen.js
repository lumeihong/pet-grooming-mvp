import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Label, Sub } from '../components/ui';
import { colors, gap } from '../theme';
import { api } from '../../lib/api';

// 极简后台：美容师审核 / 订单总览 / 聊天记录(纠纷) / 基础数据
export default function AdminScreen() {
  const [overview, setOverview] = useState(null);
  const [groomers, setGroomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chat, setChat] = useState(null);

  const load = async () => {
    setOverview(await api.adminOverview());
    setGroomers(await api.adminGroomers());
    setOrders(await api.adminOrders());
  };
  useEffect(() => { load(); }, []);

  const viewChat = async (orderId) => {
    const m = await api.adminChat(orderId);
    setChat({ orderId, messages: m });
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Label>基础数据</Label>
      <Card>
        <Sub>今日/累计订单：{overview?.total ?? 0}</Sub>
        <Sub>已完成：{overview?.completed ?? 0}</Sub>
        <Sub>完成率：{((overview?.completion_rate ?? 0) * 100).toFixed(0)}%</Sub>
        <Sub>入驻美容师：{groomers.length}</Sub>
      </Card>

      <Label>美容师审核</Label>
      {groomers.map((g) => (
        <Card key={g.id}>
          <Text style={styles.row}>{g.name} · ★ {g.rating}</Text>
          <Sub>{g.area} · {g.services.join('、')} · {g.approved ? '✅ 已通过' : '⏳ 待审核'}</Sub>
        </Card>
      ))}

      <Label>订单总览</Label>
      {orders.map((o) => (
        <Card key={o.id}>
          <Text style={styles.row}>{o.pet_type === 'dog' ? '🐶' : '🐱'} {o.services.join('、')} · {o.status}</Text>
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
