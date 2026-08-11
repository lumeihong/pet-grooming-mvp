import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { BigButton, Pill, Label, Sub } from '../components/ui';
import { colors, gap } from '../theme';
import { api } from '../lib/api';

export default function AuthScreen({ navigation, onAuthenticated }) {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    try {
      const { user } = await api.signIn(phone || '+6599999999', role);
      onAuthenticated?.(user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.logo}>🐾 PawGo</Text>
      <Text style={styles.slogan}>像叫 Grab 一样叫上门宠物理发师</Text>

      <Label>手机号（OTP 一键登录）</Label>
      <TextInput
        style={styles.input}
        placeholder="+65 9xxx xxxx"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Label>我是</Label>
      <View style={styles.row}>
        <Pill active={role === 'client'} onPress={() => setRole('client')}>宠物主人</Pill>
        <Pill active={role === 'groomer'} onPress={() => setRole('groomer')}>美容师</Pill>
      </View>

      <BigButton label={loading ? '登录中…' : '登录 / 注册'} onPress={signIn} disabled={loading} />
      <Sub style={{ textAlign: 'center', marginTop: gap }}>
        演示模式：可直接进入体验完整闭环（无需真实短信）
      </Sub>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, paddingTop: 80, backgroundColor: colors.bg, minHeight: '100%' },
  logo: { fontSize: 40, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  slogan: { fontSize: 16, color: colors.sub, textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 14, fontSize: 16, marginBottom: gap,
  },
  row: { flexDirection: 'row', marginBottom: gap },
});
