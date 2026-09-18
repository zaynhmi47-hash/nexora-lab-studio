import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockTajwid, nexoraCoreTajwidRepository, type TajwidPracticeItem, type TajwidTopicId } from '@/lib/tajwid';
import { useAuth } from '@/lib/auth/AuthProvider';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function TajwidTopicScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const [items, setItems] = useState<TajwidPracticeItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!topicId) return;
    const repository = session?.user.provider === 'firebase' ? nexoraCoreTajwidRepository(session) : mockTajwid;
    void repository.getPractice(topicId as TajwidTopicId).then(setItems);
  }, [topicId, session]);

  const item = items[index];
  const topicTitle = topicId?.replaceAll('-', ' ') ?? 'Tajwid';

  const check = () => {
    if (selected === null || checked || !item) return;
    setChecked(true);
    if (selected === item.correctOptionIndex) setCorrect((value) => value + 1);
  };

  const next = async () => {
    if (!item) return;
    if (index + 1 < items.length) {
      setIndex((value) => value + 1);
      setSelected(null);
      setChecked(false);
      return;
    }

    const repository = session?.user.provider === 'firebase' ? nexoraCoreTajwidRepository(session) : mockTajwid;
    await repository.completeTopic(session?.user.id ?? DEMO_USER_ID, topicId as TajwidTopicId);
    setFinished(true);
  };

  if (finished) {
    const score = items.length ? Math.round((correct / items.length) * 100) : 0;
    return (
      <Screen>
        <Text style={styles.eyebrow}>SELESAI</Text>
        <Text style={styles.title}>Latihan selesai 🎉</Text>
        <Card>
          <Text style={styles.score}>{score}%</Text>
          <Text style={styles.result}>{correct} dari {items.length} jawaban benar</Text>
          <Text style={styles.explanation}>Materi berikutnya akan terbuka sesuai progres pembelajaran.</Text>
        </Card>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Kembali ke Tajwid</Text>
        </Pressable>
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen>
        <Text style={styles.title}>Materi belum tersedia</Text>
        <Text style={styles.subtitle}>Latihan untuk {topicTitle} belum memiliki konten demo.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>TAJWID • {index + 1}/{items.length}</Text>
      <Text style={styles.title}>{topicTitle}</Text>
      <Text style={styles.subtitle}>{item.prompt}</Text>

      <View style={styles.options}>
        {item.options.map((option, optionIndex) => {
          const isSelected = selected === optionIndex;
          const isCorrect = checked && optionIndex === item.correctOptionIndex;
          return (
            <Pressable
              key={option}
              onPress={() => !checked && setSelected(optionIndex)}
              style={[styles.option, isSelected && styles.selectedOption, isCorrect && styles.correctOption]}
            >
              <Text style={styles.optionIndex}>{String.fromCharCode(65 + optionIndex)}</Text>
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {checked && (
        <Card>
          <Text style={[styles.feedback, selected === item.correctOptionIndex ? styles.correctText : styles.wrongText]}>
            {selected === item.correctOptionIndex ? 'Jawaban benar' : 'Belum tepat'}
          </Text>
          <Text style={styles.explanation}>{item.explanation}</Text>
        </Card>
      )}

      <View style={styles.footer}>
        {!checked ? (
          <Pressable disabled={selected === null} onPress={check} style={[styles.primaryButton, selected === null && styles.disabled]}>
            <Text style={styles.primaryText}>Periksa Jawaban</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => void next()} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{index + 1 < items.length ? 'Lanjut' : 'Selesaikan Topik'}</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', marginTop: spacing.sm, textTransform: 'capitalize' },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, marginTop: spacing.sm },
  options: { gap: spacing.sm, marginTop: spacing.xl },
  option: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', padding: spacing.md },
  selectedOption: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  correctOption: { borderColor: colors.success },
  optionIndex: { color: colors.primaryDark, fontWeight: '800', marginRight: spacing.md },
  optionText: { color: colors.text, flex: 1, fontSize: typography.body, lineHeight: 20 },
  feedback: { fontSize: typography.body, fontWeight: '800' },
  correctText: { color: colors.success },
  wrongText: { color: colors.danger },
  explanation: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 19, marginTop: spacing.sm },
  footer: { marginTop: spacing.xl },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14 },
  primaryText: { color: colors.white, fontSize: typography.body, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  score: { color: colors.primaryDark, fontSize: 42, fontWeight: '900', textAlign: 'center' },
  result: { color: colors.text, fontSize: typography.body, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
});
