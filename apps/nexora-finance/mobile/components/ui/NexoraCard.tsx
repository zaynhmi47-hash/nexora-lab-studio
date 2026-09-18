import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/theme';

export function NexoraCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const { theme } = useTheme();
  return <View style={[styles.base, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.lg }, style]}>{children}</View>;
}
const styles = StyleSheet.create({ base: { borderWidth: 1, padding: 16 } });
