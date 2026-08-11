import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, gap } from '../theme';

export function BigButton({ label, onPress, disabled, variant = 'primary' }) {
  const bg = variant === 'primary' ? colors.primary : variant === 'ghost' ? '#fff' : colors.primaryDark;
  const fg = variant === 'ghost' ? colors.primary : '#fff';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: colors.primary, opacity: disabled ? 0.5 : 1 },
        variant === 'ghost' && { borderWidth: 2 },
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Sub({ children }) {
  return <Text style={styles.sub}>{children}</Text>;
}

export function Row({ children, style }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Pill({ active, onPress, children }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.pillText, active && { color: '#fff' }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: gap / 2,
  },
  btnText: { fontSize: 18, fontWeight: '700' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: gap,
    marginVertical: gap / 2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
  sub: { fontSize: 13, color: colors.sub },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: { color: colors.text, fontWeight: '600' },
  bar: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  barItem: { alignItems: 'center', flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 7, marginBottom: 4 },
  barText: { fontSize: 12, color: colors.sub },
});

// 订单状态进度条（已确认 -> 出发 -> 到达 -> 服务中 -> 完成）
export const STATUS_FLOW = ['confirmed', 'in_progress', 'completed'];
export const STATUS_LABEL = {
  matching: '匹配中',
  awaiting_deposit: '待付定金',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

export function StatusBar({ status }) {
  const order = ['confirmed', 'in_progress', 'completed'];
  const idx = order.indexOf(status);
  return (
    <View style={styles.bar}>
      {order.map((s, i) => (
        <View key={s} style={styles.barItem}>
          <View style={[styles.dot, i <= idx ? { backgroundColor: colors.success } : { backgroundColor: colors.line }]} />
          <Text style={[styles.barText, i <= idx && { color: colors.text, fontWeight: '700' }]}>
            {STATUS_LABEL[s]}
          </Text>
        </View>
      ))}
    </View>
  );
}
