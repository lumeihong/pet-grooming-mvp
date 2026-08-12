import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BigButton, Card, Label, Sub } from '../../components/ui';
import { colors, gap } from '../../theme';
import { api } from '../../lib/api';

export default function MyProfile({ navigation, session }) {
  const logout = async () => {
    await api.signOut();
    // 演示：直接回首页（真实版应清除会话并跳登录）
    navigation.navigate('ClientHome');
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Label>个人资料</Label>
      <Card>
        <Sub>手机号：{session?.phone || '+6599999999'}</Sub>
        <Sub>角色：宠物主人</Sub>
      </Card>

      <Label>历史订单</Label>
      <Card><TouchableOpacity onPress={() => navigation.navigate('ClientHome')}><Sub>查看我的全部订单 →</Sub></TouchableOpacity></Card>

      <Label>帮助 / 客服</Label>
      <Card><Sub>遇到问题？平台客服仅用于纠纷处理与紧急联系。</Sub></Card>

      <BigButton label="退出登录" variant="ghost" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, backgroundColor: colors.bg, minHeight: '100%' },
});
