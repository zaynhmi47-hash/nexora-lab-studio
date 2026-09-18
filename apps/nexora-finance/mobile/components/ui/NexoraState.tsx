import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

export function NexoraLoading({ label = 'Loading…' }: { label?: string }) {
  const { theme } = useTheme();
  return <View accessibilityLiveRegion="polite" style={styles.center}><ActivityIndicator /><Text style={{ color: theme.colors.muted }}>{label}</Text></View>;
}
export function NexoraEmpty({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  const { theme } = useTheme();
  return <View style={styles.center}><Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>{description ? <Text style={[styles.description, { color: theme.colors.muted }]}>{description}</Text> : null}{action}</View>;
}
export function NexoraError({ title = 'Something went wrong', description, action }: { title?: string; description?: string; action?: ReactNode }) {
  const { theme } = useTheme();
  return <View style={styles.center}><Text accessibilityRole="alert" style={[styles.title, { color: theme.colors.danger }]}>{title}</Text>{description ? <Text style={[styles.description, { color: theme.colors.muted }]}>{description}</Text> : null}{action}</View>;
}
const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }, title: { fontSize: 18, fontWeight: '700', textAlign: 'center' }, description: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 520 } });
