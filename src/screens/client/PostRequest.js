import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ScrollView } from 'react-native';
import { BigButton, Card, Label, Sub, Pill } from '../../components/ui';
import { colors, gap } from '../../theme';
import { api } from '../../lib/api';
import { useSession } from '../../lib/SessionContext';

const SERVICES = [
  { id: 'bath', label: '洗澡' },
  { id: 'haircut', label: '剪毛' },
  { id: 'nails', label: '修甲' },
  { id: 'spa', label: '全套/SPA' },
];
const SIZES = ['small', 'medium', 'large'];
const SIZE_LABEL = { small: '小型', medium: '中型', large: '大型' };
const SG_CENTER = { lat: 1.2868, lng: 103.8545 };

export default function PostRequest({ navigation }) {
  const { session } = useSession();
  const [petType, setPetType] = useState('dog');
  const [size, setSize] = useState('medium');
  const [services, setServices] = useState(['bath', 'haircut']);
  const [date, setDate] = useState('');
  const [window, setWindow] = useState('09:00-12:00');
  const [budget, setBudget] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id) =>
    setServices((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async () => {
    if (!session?.id) {
      setError('请先登录');
      return;
    }
    if (services.length === 0) {
      setError('请至少选择一项服务');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
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
    } catch (e) {
      setError(e?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Label>宠物类型</Label>
      <View style={styles.row}>
        <Pill active={petType === 'dog'} onPress={() => setPetType('dog')}>🐶 狗</Pill>
        <Pill active={petType === 'cat'} onPress={() => setPetType('cat')}>🐱 猫</Pill>
      </View>

      <Label>体型</Label>
      <View style={styles.row}>
        {SIZES.map((s) => (
          <Pill key={s} active={size === s} onPress={() => setSize(s)}>
            {SIZE_LABEL[s]}
          </Pill>
        ))}
      </View>

      <Label>服务项目（多选）</Label>
      <View style={styles.row}>
        {SERVICES.map((s) => (
          <Pill key={s.id} active={services.includes(s.id)} onPress={() => toggle(s.id)}>
            {s.label}
          </Pill>
        ))}
      </View>

      <Card>
        <Label>偏好日期</Label>
        <TextInput style={styles.input} placeholder="2026-08-15（可选）" value={date} onChangeText={setDate} />
        <Label>时间窗口</Label>
        <TextInput style={styles.input} placeholder="09:00-12:00" value={window} onChangeText={setWindow} />
        <Label>服务地址</Label>
        <Sub>已定位：Tanjong Pagar（演示）。真实版接入 Google Maps 选点。</Sub>
        <Label>预算上限 (S$)，可选</Label>
        <TextInput
          style={styles.input}
          placeholder="60"
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
        />
        <Label>备注（可选）</Label>
        <TextInput
          style={[styles.input, { height: 64 }]}
          placeholder="例如：狗狗较怕生"
          value={note}
          onChangeText={setNote}
          multiline
        />
      </Card>

      {!!error && <Sub style={{ color: colors.danger, marginBottom: 8 }}>{error}</Sub>}
      <BigButton label={submitting ? '匹配中…' : '提交并匹配'} onPress={submit} disabled={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: gap / 2 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
  },
});

