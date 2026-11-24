import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/lib/responsive';
import { useTheme } from '@/lib/theme';

export function ResponsiveScaffold({ children }: PropsWithChildren) {
  const { isMobile, isTablet } = useResponsive();
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.background },
        !isMobile && { paddingLeft: isTablet ? 80 : 240 },
      ]}
    >
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, width: '100%' },
});
