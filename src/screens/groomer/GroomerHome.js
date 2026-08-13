import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BigButton, Card, Label, Sub, Pill, StatusBar, STATUS_LABEL } from '../../components/ui';
import { colors, gap } from '../../theme';
import { api } from '../../lib/api';
import { useSession } from '../../lib/SessionContext';

// 绑定模式：客户选人 + 付定金后，订单指派给美容师。
// 美容师在此确认并执行，无抢单大厅。
export default function GroomerHome({ navigation }) {
  const { session } = useSession();
  const [online, setOnline] = useState(true);
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    if (!session?.id) return;
    const list = await api.listAssignedOrders(session.id);
    setOrders(list || []);
  }, [session?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggle = () => setOnline((v) => !v);

  const start = async (id) => {
    await api.advanceStatus(id, 'in_progress');
    load();
  };
  const finish = async (id) => {
    await api.completeOrder(id);
    load();
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>派给我的订单</Text>
        <Pill active={online} onPress={toggle}>
          {online ? '● 接单中' : '○ 已关闭'}
        </Pill>
      </View>

      <Sub style={{ marginBottom: gap }}>你好，{session?.name || '美容师'}</Sub>

      <Label>待处理（{orders.length}）</Label>
      {orders.length === 0 && (
        <Sub>暂无指派订单。客户选择您并支付定金后，订单会出现在这里。</Sub>
      )}
      {orders.map((o) => (
        <Card key={o.id}>
          <StatusBar status={o.status} />
          <Text style={styles.row}>
            {o.pet_type === 'dog' ? '🐶' : '🐱'} {o.pet_size} · {(o.services || []).join('、')}
          </Text>
          <Sub>
            {STATUS_LABEL[o.status] || o.status} · {o.time_window}
          </Sub>
          <Sub>预算：{o.budget_max ? `S$ ${o.budget_max}` : '不限'}</Sub>

          {o.status === 'awaiting_deposit' && (
            <Sub style={styles.wait}>⏳ 客户已选择您，等待客户支付定金…</Sub>
          )}
          {o.status === 'confirmed' && (
            <BigButton label="开始服务" onPress={() => start(o.id)} />
          )}
          {o.status === 'in_progress' && (
            <View>
              {api.chatOpen(o) && (
                <TouchableOpacity onPress={() => navigation.navigate('Chat', { orderId: o.id })}>
                  <Text style={styles.link}>进入聊天 →</Text>
                </TouchableOpacity>
              )}
              <BigButton label="完成服务" onPress={() => finish(o.id)} />
            </View>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('OrderTake', { orderId: o.id })}>
            <Text style={styles.link}>查看详情 →</Text>
          </TouchableOpacity>
        </Card>
      ))}

      <View style={{ height: 12 }} />
      <TouchableOpacity onPress={() => navigation.navigate('ActiveOrders')}>
        <Text style={styles.link}>进行中订单 →</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('GroomerProfile')}>
        <Text style={styles.link}>我的资料 →</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('GroomerIncome')}>
        <Text style={styles.link}>收入与历史 →</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('MyProfile')}>
        <Text style={styles.link}>切换角色 / 退出 →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800' },
  row: { fontSize: 16, fontWeight: '600', marginTop: 6 },
  wait: { color: colors.warn, marginTop: 6, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '700', marginTop: 8 },
});
