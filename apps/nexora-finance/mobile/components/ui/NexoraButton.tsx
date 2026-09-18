import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/lib/theme';

interface Props extends PropsWithChildren {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  accessibilityLabel?: string;
}

export function NexoraButton({ children, onPress, disabled, loading, variant = 'primary', accessibilityLabel }: Props) {
  const { theme } = useTheme();
  const background = variant === 'primary' ? theme.colors.primary : variant === 'danger' ? theme.colors.danger : variant === 'secondary' ? theme.colors.surfaceMuted : 'transparent';
  const color = variant === 'ghost' ? theme.colors.primary : variant === 'secondary' ? theme.colors.text : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.base, { backgroundColor: background, borderColor: theme.colors.border, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 }]}
    >
      {loading ? <ActivityIndicator /> : <Text style={[styles.text, { color }]}>{children}</Text>}
    </Pressable>
  );
}
const styles = StyleSheet.create({ base: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, text: { fontSize: 14, fontWeight: '700' } });
