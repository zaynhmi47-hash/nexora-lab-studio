import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/lib/responsive';

interface Props extends PropsWithChildren {
  gap?: number;
}

export function ResponsiveGrid({ children, gap = 12 }: Props) {
  const { isMobile } = useResponsive();

  return (
    <View style={[styles.grid, { gap }, isMobile ? styles.mobile : styles.desktop]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap' },
  mobile: { flexDirection: 'column' },
  desktop: {},
});
