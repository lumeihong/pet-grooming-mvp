import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BigButton, Card, Sub } from '../components/ui';
import { colors, gap } from '../theme';

export default function MatchResult({ navigation, route }) {
  const { order } = route.params;
  const matches = order.matches || [];

  const confirm = async (groomerId) => {
    await api.confirmGroomer(order.id, groomerId);
    navigation.navigate('PayDeposit', { orderId: order.id });
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>为你推荐 {matches.length} 位美容师</Text>
      <Sub>按距离、评分、价格综合排序（隐私保护：不显示真实手机号）</Sub>

      {matches.length === 0 && (
        <Card><Sub>暂无附近在线美容师，可稍后再试或扩大范围。</Sub></Card>
      )}

      {matches.map((g, i) => (
        <Card key={g.id}>
          <View style={styles.top}>
            <Text style={styles.name}>{i + 1}. {g.name}</Text>
            <Text style={styles.rating}>★ {g.rating}</Text>
          </View>
          <Sub>距您约 {g.dist} km · {g.area}</Sub>
          <Sub>起步价 S${g.base_price}{g.in_budget ? ' · 在预算内' : ''}</Sub>
          <Sub>服务：{g.services.join('、')}</Sub>
          <Sub>{g.bio}</Sub>
          <BigButton label="选择并预约" onPress={() => confirm(g.id)} />
        </Card>
      ))}

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>继续等待更多接单 →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// api 需在此文件可用
import { api } from '../../lib/api';

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700' },
  rating: { fontSize: 16, fontWeight: '700', color: colors.warn },
  link: { color: colors.primary, fontWeight: '700', textAlign: 'center', marginTop: gap },
});
