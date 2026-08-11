import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { BigButton, Card, Label, Pill, Sub } from '../components/ui';
import { colors, gap } from '../theme';
import { api } from '../../lib/api';

const SERVICES = [
  { id: 'bath', label: '洗澡' },
  { id: 'haircut', label: '剪毛' },
  { id: 'nails', label: '修甲' },
  { id: 'spa', label: '全套SPA' },
];
const SIZES = ['small', 'medium', 'large'];
const SIZE_LABEL = { small: '小型(<10kg)', medium: '中型(10-25kg)', large: '大型(>25kg)' };

// 新加坡中心默认坐标（演示用，真实接入 Google Maps 选点）
const SG_CENTER = { lat: 1.2868, lng: 103.8545 };

export default function PostRequest({ navigation, session }) {
  const [petType, setPetType] = useState('dog');
  const [size, setSize] = useState('medium');
  const [services, setServices] = useState(['bath', 'haircut']);
  const [date, setDate] = useState('');
  const [window, setWindow] = useState('09:00-12:00');
  const [budget, setBudget] = useState('');
  const [note, setNote] = useState('');

  const toggle = (id) =>
    setServices((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async () => {
    const order = await api.createOrder({
      client_id: session.id,
      pet_type: petType,
      pet_size: size,
      services,
      preferred_date: date || null,
      time_window: window,
      lat: SG_CENTER.lat,
      lng: SG_CENTER.lng,
      address: 'Tanjong Pagar (脱敏)',
      budget_max: budget ? Number(budget) : null,
      note: note || null,
    });
    navigation.navigate('MatchResult', { order });
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Label>宠物类型</Label>
      <View style={styles.row}>
        <Pill active={petType === 'dog'} onPress={() => setPetType('dog')}>🐶 狗</Pill>
        <Pill active={petType === 'cat'} onPress={() => setPetType('cat')}>🐱 猫</Pill>
      </View>

      <Label>体型</Label>
      <View style={styles.row}>
        {SIZES.map((s) => (
          <Pill key={s} active={size === s} onPress={() => setSize(s)}>{SIZE_LABEL[s]}</Pill>
        ))}
      </View>

      <Label>服务项目（多选）</Label>
      <View style={styles.row}>
        {SERVICES.map((s) => (
          <Pill key={s.id} active={services.includes(s.id)} onPress={() => toggle(s.id)}>{s.label}</Pill>
        ))}
      </View>

      <Card>
        <Label>偏好日期</Label>
        <TextInput style={styles.input} placeholder="2026-08-15（可选）" value={date} onChangeText={setDate} />
        <Label>时间窗口</Label>
        <TextInput style={styles.input} placeholder="09:00-12:00" value={window} onChangeText={setWindow} />
        <Label>服务地址（自动定位 + 可微调）</Label>
        <Sub>已定位：Tanjong Pagar（演示）。真实版接入 Google Maps 选点。</Sub>
        <Label>预算上限 (S$)，可选</Label>
        <TextInput style={styles.input} placeholder="60" keyboardType="numeric" value={budget} onChangeText={setBudget} />
        <Label>备注（可选）</Label>
        <TextInput style={[styles.input, { height: 64 }]} placeholder="例如：狗狗较怕生" value={note} onChangeText={setNote} multiline />
      </Card>

      <BigButton label="提交并匹配" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: gap / 2 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 8,
  },
});
