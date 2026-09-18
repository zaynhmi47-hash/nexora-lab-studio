import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useResponsive } from '@/lib/responsive';

interface Props extends PropsWithChildren {
  style?: ViewStyle;
  maxWidth?: number;
}

export function ResponsiveContainer({ children, style, maxWidth = 1440 }: Props) {
  const { isDesktop } = useResponsive();

  return (
    <View style={[styles.outer, isDesktop && styles.desktopOuter, style]}>
      <View style={[styles.inner, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, width: '100%' },
  desktopOuter: { alignItems: 'center' },
  inner: { flex: 1, width: '100%', paddingHorizontal: 16 },
});
