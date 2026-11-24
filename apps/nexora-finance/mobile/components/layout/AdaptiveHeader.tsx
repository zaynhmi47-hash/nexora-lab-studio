import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useResponsive } from '@/lib/responsive';
import { useTheme } from '@/lib/theme';

interface Props {
  title: string;
  subtitle?: string;
}

export function AdaptiveHeader({ title, subtitle }: Props) {
  const { isMobile } = useResponsive();
  const { theme } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.colors.text }, isMobile && styles.mobileTitle]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{subtitle}</Text> : null}
      </View>
      {!isMobile ? (
        <View style={styles.actions}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          <Ionicons name="search-outline" size={22} color={theme.colors.text} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 26, fontWeight: '800' },
  mobileTitle: { fontSize: 22 },
  subtitle: { fontSize: 14 },
  actions: { flexDirection: 'row', gap: 20 },
});
