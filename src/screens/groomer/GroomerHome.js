import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BigButton, Card, Label, Sub, Pill } from '../../components/ui';
import { colors, gap } from '../../theme';
import { api } from '../../lib/api';
import { useSession } from '../../lib/SessionContext';

const G_LAT = 1.2766;
const G_LNG = 103.845;

export default function GroomerHome({ navigation }) {
  const { session } = useSession();
  const [online, setOnline] = useState(true);
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    const list = await api.listOpenOrders(G_LAT, G_LNG);
    setOrders(list || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggle = () => setOnline((v) => !v);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>接单大厅</Text>
        <Pill active={online} onPress={toggle}>
          {online ? '● 接单中' : '○ 已关闭'}
        </Pill>
      </View>

      <Sub style={{ marginBottom: gap }}>你好，{session?.name || '美容师'}</Sub>

      <BigButton
        label={online ? '正在接收附近订单' : '点击开启接单'}
        onPress={toggle}
        variant={online ? 'primary' : 'ghost'}
      />

      <Label>附近可接订单（{orders.length}）</Label>
      {orders.length === 0 && <Sub>暂无新订单。请先用客户账号发布需求，再切回美容师查看。</Sub>}
      {orders.map((o) => (
        <Card key={o.id}>
          <Text style={styles.row}>
            {o.pet_type === 'dog' ? '🐶' : '🐱'} {o.pet_size} · {(o.services || []).join('、')}
          </Text>
          <Sub>
            距您约 {typeof o.dist === 'number' ? o.dist.toFixed(1) : '-'} km · {o.time_window}
          </Sub>
          <Sub>预算：{o.budget_max ? `S$ ${o.budget_max}` : '不限'}</Sub>
          <TouchableOpacity onPress={() => navigation.navigate('OrderTake', { orderId: o.id })}>
            <Text style={styles.link}>查看并接单 →</Text>
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
  row: { fontSize: 16, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '700', marginTop: 6 },
});

