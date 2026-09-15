import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';

export default function TravelScreen() {
  return (
    <Screen>
      <Text style={styles.eyebrow}>TRAVEL</Text>
      <Text style={styles.heading}>Umrah Journey</Text>
      <Text style={styles.subtitle}>A structured path from preparation to the journey and continued learning.</Text>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Prepare spiritually and practically.</Text>
        <Text style={styles.heroText}>
          Build your preparation checklist, review learning topics, and keep travel information organized.
        </Text>
      </View>

      <Text style={styles.section}>Journey</Text>
      <Pressable onPress={() => router.push('/umrah')} accessibilityRole="button">
        <Card style={styles.item}>
          <View style={styles.flex}>
            <Text style={styles.title}>Open Umrah Journey</Text>
            <Text style={styles.muted}>Follow your preparation stages and checklist</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Card>
      </Pressable>

      <Text style={styles.section}>Preparation</Text>
      {['Umrah Learning Path', 'Document Checklist', 'Packing List', 'Arabic for Umrah'].map((item) => (
        <Card key={item} style={styles.item}>
          <Text style={styles.title}>{item}</Text>
          <Text style={styles.muted}>Coming in the next journey module</Text>
        </Card>
      ))}

      <Text style={styles.section}>Explore</Text>
      <Card style={styles.item}>
        <View style={styles.flex}>
          <Text style={styles.title}>Umrah Packages</Text>
          <Text style={styles.muted}>Partner discovery will use verified providers before production launch.</Text>
        </View>
      </Card>

      <Text style={styles.disclaimer}>
        Nexora Muslim is designed to provide preparation and discovery tools. Travel booking will be connected only to appropriately verified and compliant partners.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1.2 },
  heading: { marginTop: spacing.xs, color: colors.text, fontSize: typography.title, fontWeight: '800' },
  subtitle: { marginTop: spacing.xs, color: colors.textMuted, lineHeight: 20 },
  hero: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.primary },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800' },
  heroText: { marginTop: spacing.sm, color: colors.primarySoft, lineHeight: 20 },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm, color: colors.text, fontSize: typography.heading, fontWeight: '800' },
  item: { marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  title: { color: colors.text, fontWeight: '700' },
  muted: { marginTop: spacing.xs, color: colors.textMuted, lineHeight: 18 },
  arrow: { color: colors.primary, fontSize: 28 },
  disclaimer: { marginVertical: spacing.lg, color: colors.textMuted, fontSize: typography.small, lineHeight: 18 },
});
