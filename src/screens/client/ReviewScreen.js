import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { BigButton, Card, Label, Sub } from '../../components/ui';
import { colors, gap } from '../../theme';
import { api } from '../../lib/api';

export default function ReviewScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!orderId) return;
    setBusy(true);
    try {
      await api.addReview(orderId, rating, comment);
      // 评价时订单可能已是 completed；再调一次无害
      try {
        await api.completeOrder(orderId);
      } catch (_) {}
      navigation.navigate('ClientHome');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Label>为本次服务评分</Label>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, n <= rating && { color: colors.warn }]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Card>
        <Label>简短评价（可选）</Label>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="服务很满意…"
          value={comment}
          onChangeText={setComment}
          multiline
        />
      </Card>
      <BigButton label={busy ? '提交中…' : '提交评价'} onPress={submit} disabled={busy} />
      <Sub style={{ textAlign: 'center' }}>提交后聊天入口变灰并提示「已关闭」</Sub>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: colors.bg },
  stars: { flexDirection: 'row', marginVertical: gap },
  star: { fontSize: 36, color: colors.line, marginRight: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, fontSize: 15 },
});

