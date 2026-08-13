import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BigButton, Card, Label, Sub } from '../../components/ui';
import { colors, gap } from '../../theme';
import { API_MODE } from '../../lib/api';
import { useSession } from '../../lib/SessionContext';

export default function MyProfile() {
  const { session, signOut, switchRole, isDemo } = useSession();

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Card>
        <Label>当前账号</Label>
        <Text style={styles.name}>{session?.name || '用户'}</Text>
        <Sub>{session?.phone}</Sub>
        <Sub>
          角色：
          {session?.role === 'client' ? '宠物主人' : session?.role === 'groomer' ? '美容师' : '管理员'}
        </Sub>
        <Sub>模式：{API_MODE === 'demo' ? '演示（内存数据）' : 'Supabase 真实后端'}</Sub>
      </Card>

      {isDemo && (
        <Card>
          <Label>演示：快速切换角色</Label>
          <Sub>可在客户 / 美容师 / 后台之间切换，完整走通双边流程。</Sub>
          <BigButton label="切换为宠物主人" variant="ghost" onPress={() => switchRole('client')} />
          <BigButton label="切换为美容师" variant="ghost" onPress={() => switchRole('groomer')} />
          <BigButton label="切换为后台管理" variant="ghost" onPress={() => switchRole('admin')} />
        </Card>
      )}

      <Card>
        <Label>帮助</Label>
        <Sub>· 发布需求 → 匹配 → 支付定金 → 临时聊天 → 完成评价</Sub>
        <Sub>· 聊天仅在定金支付后开启，服务完成后自动关闭</Sub>
        <Sub>· 双方不暴露真实手机号与完整地址</Sub>
      </Card>

      <BigButton label="退出登录" variant="ghost" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
});

