import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  action: { color: colors.primary, fontSize: 12, fontWeight: '700', paddingTop: 4 },
});
