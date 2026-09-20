import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockQiblaProvider, type QiblaDirection } from '@/lib/qibla';

export default function QiblaScreen() {
  const [direction, setDirection] = useState<QiblaDirection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    mockQiblaProvider.getDirection().then((value) => {
      if (mounted) setDirection(value);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const rotate = direction ? `${direction.bearingDegrees}deg` : '0deg';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>IBADAH</Text>
          <Text style={styles.title}>Qibla</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Direction to Kaaba</Text>
        <Text style={styles.location}>{direction?.locationLabel ?? 'Loading location...'}</Text>

        <View style={styles.compass}>
          <View style={styles.compassRing}>
            <Text style={[styles.marker, styles.north]}>N</Text>
            <Text style={[styles.marker, styles.east]}>E</Text>
            <Text style={[styles.marker, styles.south]}>S</Text>
            <Text style={[styles.marker, styles.west]}>W</Text>
            <View style={[styles.needle, { transform: [{ rotate: rotate }] }]}>
              <View style={styles.needleArrow} />
              <View style={styles.needleTail} />
            </View>
            <View style={styles.centerDot} />
          </View>
        </View>

        <View style={styles.degreeRow}>
          <Text style={styles.degree}>{loading ? '--' : `${direction?.bearingDegrees ?? 0}°`}</Text>
          <Text style={styles.degreeLabel}>bearing from true north</Text>
        </View>

        <View style={styles.infoRow}>
          <View>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{direction ? `${direction.distanceKm.toLocaleString()} km` : '--'}</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{direction?.calibrated ? 'Calibrated' : 'Demo mode'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.noticeText}>Compass, GPS, calibration and a production Qibla calculation provider will be connected in a later integration step.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  backButton: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center' },
  cardTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '800' },
  location: { color: colors.textMuted, fontSize: typography.caption, marginTop: spacing.xs },
  compass: { marginVertical: spacing.xl },
  compassRing: { width: 230, height: 230, borderRadius: 115, borderWidth: 10, borderColor: colors.primarySoft, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  marker: { position: 'absolute', color: colors.textMuted, fontSize: typography.caption, fontWeight: '800' },
  north: { top: 12 }, east: { right: 15 }, south: { bottom: 12 }, west: { left: 15 },
  needle: { position: 'absolute', width: 6, height: 170, alignItems: 'center' },
  needleArrow: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 32, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: colors.primary },
  needleTail: { width: 4, height: 68, backgroundColor: colors.primaryDark },
  centerDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, borderWidth: 4, borderColor: colors.white },
  degreeRow: { alignItems: 'center' },
  degree: { color: colors.primaryDark, fontSize: 34, fontWeight: '900' },
  degreeLabel: { color: colors.textMuted, fontSize: typography.small, marginTop: 2 },
  infoRow: { flexDirection: 'row', width: '100%', marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, justifyContent: 'space-around', alignItems: 'center' },
  divider: { width: 1, height: 36, backgroundColor: colors.border },
  infoLabel: { color: colors.textMuted, fontSize: typography.small },
  infoValue: { color: colors.text, fontSize: typography.body, fontWeight: '800', marginTop: 3 },
  notice: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.primarySoft, borderRadius: radius.md },
  noticeText: { flex: 1, color: colors.primaryDark, fontSize: typography.caption, lineHeight: 19 },
});
