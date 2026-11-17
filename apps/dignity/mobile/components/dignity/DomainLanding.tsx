import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { colors, radius, spacing } from '@/theme/tokens';

export interface DomainLandingProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  features: string[];
  boundary: string;
  status?: string;
}
export function DomainLanding({ eyebrow, title, description, icon, features, boundary, status = 'DOMAIN FOUNDATION' }: DomainLandingProps) {
  return <Screen>
    <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={17} color={colors.primary} /><Text style={styles.backText}>Back</Text></Pressable>
    <View style={styles.heroIcon}><Ionicons name={icon} size={25} color={colors.primaryDark} /></View>
    <Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text>
    <View style={styles.status}><View style={styles.statusDot} /><Text style={styles.statusText}>{status}</Text></View>
    <Text style={styles.sectionTitle}>What this space will support</Text>
    <SurfaceCard style={styles.featureCard}>{features.map((feature, index) => <View key={feature} style={styles.featureRow}>
      <View style={styles.featureNumber}><Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text></View><Text style={styles.featureText}>{feature}</Text>
    </View>)}</SurfaceCard>
    <SurfaceCard style={styles.boundary}><Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} /><Text style={styles.boundaryText}>{boundary}</Text></SurfaceCard>
    <Text style={styles.footnote}>This screen establishes the parent-app information architecture. Domain workflows, API persistence and role-specific experiences are delivered in their own implementation stages.</Text>
  </Screen>;
}
const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 20 },
  backText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  heroIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 },
  description: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 9 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 7, marginTop: 17, marginBottom: spacing.xl },
  statusDot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: '#B17A27' },
  statusText: { color: '#80551C', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginBottom: 10 },
  featureCard: { paddingVertical: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  featureNumber: { width: 31, height: 31, borderRadius: 11, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  number: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  featureText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  boundary: { flexDirection: 'row', gap: 10, backgroundColor: colors.primarySoft, borderColor: '#D5E5D9', marginTop: spacing.xl },
  boundaryText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 17 },
  footnote: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: spacing.lg, marginBottom: 20 },
});