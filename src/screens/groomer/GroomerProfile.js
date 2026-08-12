import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { BigButton, Card, Label, Sub, Pill } from '../../components/ui';
import { colors, gap } from '../../theme';
import { api } from '../../lib/api';

const SERVICES = ['bath', 'haircut', 'nails', 'spa'];

export default function GroomerProfile({ session }) {
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState(['bath', 'haircut']);
  const [basePrice, setBasePrice] = useState('45');
  const [area, setArea] = useState('Tanjong Pagar');
  const [bio, setBio] = useState('');
  const [paynow, setPaynow] = useState('');

  useEffect(() => {
    api.getGroomerProfile(session?.id || 'u_groomer_demo').then((g) => {
      if (g) {
        setProfile(g);
        setServices(g.services || services);
        setBasePrice(String(g.base_price || 45));
        setArea(g.area || '');
        setBio(g.bio || '');
        setPaynow(g.paynow || '');
      }
    });
  }, []);

  const toggle = (id) => setServices((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const save = async () => {
    await api.updateGroomerProfile(session?.id || 'u_groomer_demo', {
      services, base_price: Number(basePrice), area, bio, paynow, online: true,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Label>服务项目</Label>
      <View style={styles.row}>
        {SERVICES.map((s) => (
          <Pill key={s} active={services.includes(s)} onPress={() => toggle(s)}>
            {s === 'bath' ? '洗澡' : s === 'haircut' ? '剪毛' : s === 'nails' ? '修甲' : 'SPA'}
          </Pill>
        ))}
      </View>

      <Card>
        <Label>起步价 (S$)</Label>
        <TextInput style={styles.input} keyboardType="numeric" value={basePrice} onChangeText={setBasePrice} />
        <Label>服务区域</Label>
        <TextInput style={styles.input} value={area} onChangeText={setArea} />
        <Label>个人简介</Label>
        <TextInput style={[styles.input, { height: 60 }]} value={bio} onChangeText={setBio} multiline />
        <Label>收款方式 (PayNow)</Label>
        <TextInput style={styles.input} value={paynow} onChangeText={setPaynow} placeholder="name@paynow" />
      </Card>

      <BigButton label="保存资料" onPress={save} />
      <Sub style={{ textAlign: 'center' }}>历史评价与完成订单在「收入与历史」查看</Sub>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: gap / 2 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 8 },
});
