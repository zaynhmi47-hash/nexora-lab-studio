import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const palette = {
  ink: '#17213B',
  muted: '#77819A',
  canvas: '#F5F7FC',
  surface: '#FFFFFF',
  line: '#E8ECF4',
  primary: '#6257E8',
  primarySoft: '#EFEEFF',
  cyan: '#27B8B0',
  cyanSoft: '#E6F8F6',
  orange: '#F2A65A',
  orangeSoft: '#FFF3E7',
  rose: '#E87991',
  roseSoft: '#FFF0F3',
  green: '#239B78',
  greenSoft: '#E8F7F1',
};

export function Screen({ children, scroll = true, contentStyle }: {
  children: ReactNode; scroll?: boolean; contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, contentStyle]}>
          {children}
        </ScrollView>
      ) : <View style={[styles.content, contentStyle]}>{children}</View>}
    </SafeAreaView>
  );
}

export function Eyebrow({ children, color = palette.primary }: { children: ReactNode; color?: string }) {
  return <Text style={[styles.eyebrow, { color }]}>{children}</Text>;
}

export function Heading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        <Text style={styles.heading}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Tag({ label, tone = 'purple' }: { label: string; tone?: 'purple' | 'green' | 'orange' | 'cyan' | 'rose' | 'neutral' }) {
  const tones = {
    purple: [palette.primarySoft, palette.primary],
    green: [palette.greenSoft, palette.green],
    orange: [palette.orangeSoft, '#B66B25'],
    cyan: [palette.cyanSoft, '#168B85'],
    rose: [palette.roseSoft, '#C34F6B'],
    neutral: ['#F0F2F7', palette.muted],
  } as const;
  return <View style={[styles.tag, { backgroundColor: tones[tone][0] }]}><Text style={[styles.tagText, { color: tones[tone][1] }]}>{label}</Text></View>;
}

export function ProgressBar({ value, color = palette.primary, track = '#ECEEF5', height = 7 }: {
  value: number; color?: string; track?: string; height?: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return <View style={[styles.progressTrack, { height, backgroundColor: track }]}><View style={[styles.progressFill, { width: `${safeValue}%` as `${number}%`, backgroundColor: color }]} /></View>;
}

export function ActionRow({ icon, title, detail, onPress, color = palette.primary, trailing }: {
  icon: ReactNode; title: string; detail?: string; onPress?: () => void; color?: string; trailing?: ReactNode;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
      <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>{icon}</View>
      <View style={styles.actionCopy}><Text style={styles.actionTitle}>{title}</Text>{detail ? <Text style={styles.actionDetail}>{detail}</Text> : null}</View>
      {trailing ?? <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

export function Metric({ value, label, color = palette.ink }: { value: string; label: string; color?: string }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, { color }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 34, gap: 22 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1, gap: 5 },
  heading: { color: palette.ink, fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  panel: { backgroundColor: palette.surface, borderRadius: 20, padding: 17, borderWidth: 1, borderColor: palette.line, gap: 13 },
  tag: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
  progressTrack: { width: '100%', borderRadius: 20, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 20 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  actionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1, gap: 3 },
  actionTitle: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  actionDetail: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  chevron: { color: '#A6AEC0', fontSize: 25, fontWeight: '300' },
  pressed: { opacity: 0.72 },
  metric: { flex: 1, gap: 3 },
  metricValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  metricLabel: { color: palette.muted, fontSize: 10, fontWeight: '600' },
});