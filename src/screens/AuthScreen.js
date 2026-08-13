import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { BigButton, Pill, Label, Sub } from '../components/ui';
import { colors, gap } from '../theme';
import { useSession } from '../lib/SessionContext';

export default function AuthScreen() {
  const { signIn, isDemo } = useSession();
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn(phone, role);
    } catch (e) {
      setError(e?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.logo}>🐾 PawGo</Text>
      <Text style={styles.slogan}>像叫 Grab 一样叫上门宠物理发师</Text>

      <Label>手机号（OTP 一键登录）</Label>
      <TextInput
        style={styles.input}
        placeholder="+65 9xxx xxxx"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
      />

      <Label>我是</Label>
      <View style={styles.row}>
        <Pill active={role === 'client'} onPress={() => setRole('client')}>宠物主人</Pill>
        <Pill active={role === 'groomer'} onPress={() => setRole('groomer')}>美容师</Pill>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <BigButton label={loading ? '登录中…' : '登录 / 注册'} onPress={onSubmit} disabled={loading} />

      {isDemo && (
        <>
          <Sub style={{ textAlign: 'center', marginTop: gap }}>
            演示模式已开启：可不填手机号，直接点登录体验完整闭环
          </Sub>
          <View style={{ height: 8 }} />
          <BigButton
            label="一键体验（客户）"
            variant="ghost"
            onPress={async () => {
              setRole('client');
              setLoading(true);
              try {
                await signIn('+6599999999', 'client');
              } finally {
                setLoading(false);
              }
            }}
          />
          <BigButton
            label="一键体验（美容师）"
            variant="ghost"
            onPress={async () => {
              setRole('groomer');
              setLoading(true);
              try {
                await signIn('+6588888888', 'groomer');
              } finally {
                setLoading(false);
              }
            }}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, paddingTop: 80, backgroundColor: colors.bg, minHeight: '100%' },
  logo: { fontSize: 40, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  slogan: { fontSize: 16, color: colors.sub, textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: gap,
  },
  row: { flexDirection: 'row', marginBottom: gap, flexWrap: 'wrap' },
  error: { color: colors.danger, marginBottom: 8, textAlign: 'center' },
});

