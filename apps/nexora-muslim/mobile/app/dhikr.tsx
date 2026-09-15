import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockDhikrList } from '@/lib/dhikr';

export default function DhikrScreen() {
  const [items, setItems] = useState(mockDhikrList);

  const increment = (id: string) => {
    setItems((current) => current.map((item) => item.id === id
      ? { ...item, completed: Math.min(item.completed + 1, item.target) }
      : item));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>IBADAH</Text>
          <Text style={styles.title}>Dhikr</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="leaf-outline" size={26} color={colors.primary} /></View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Daily remembrance</Text>
          <Text style={styles.heroText}>Build a simple, consistent dhikr routine.</Text>
        </View>
      </View>

      {items.map((item) => {
        const progress = item.target === 0 ? 0 : item.completed / item.target;
        const done = item.completed >= item.target;
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.titleCopy}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
              <Text style={styles.count}>{item.completed}/{item.target}</Text>
            </View>
            <Text style={styles.arabic}>{item.arabic}</Text>
            <Text style={styles.transliteration}>{item.transliteration}</Text>
            <Text style={styles.translation}>{item.translation}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(progress, 1) * 100}%` }]} /></View>
            <Pressable disabled={done} onPress={() => increment(item.id)} style={[styles.button, done && styles.buttonDone]}>
              <Ionicons name={done ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={done ? colors.success : colors.white} />
              <Text style={[styles.buttonText, done && styles.buttonTextDone]}>{done ? 'Completed' : 'Count +1'}</Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.disclaimer}>Content shown here is demo data for the app prototype. Verified content and source metadata will be added before production.</Text>
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
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  heroIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { color: colors.primaryDark, fontSize: typography.heading, fontWeight: '800' },
  heroText: { color: colors.primaryDark, fontSize: typography.caption, marginTop: 3, lineHeight: 18 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '800' },
  category: { color: colors.textMuted, fontSize: typography.small, textTransform: 'capitalize', marginTop: 2 },
  count: { color: colors.primary, fontSize: typography.body, fontWeight: '900' },
  arabic: { color: colors.text, fontSize: 27, textAlign: 'right', lineHeight: 48, marginTop: spacing.lg },
  transliteration: { color: colors.primaryDark, fontSize: typography.body, fontStyle: 'italic', marginTop: spacing.sm },
  translation: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 18, marginTop: spacing.xs },
  track: { height: 7, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.lg },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  button: { minHeight: 46, marginTop: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  buttonDone: { backgroundColor: colors.surfaceMuted },
  buttonText: { color: colors.white, fontSize: typography.body, fontWeight: '800' },
  buttonTextDone: { color: colors.success },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, lineHeight: 17, textAlign: 'center', marginTop: spacing.sm },
});
