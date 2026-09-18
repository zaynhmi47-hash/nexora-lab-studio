import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { mockTajwid, nexoraCoreTajwidRepository, type TajwidPracticeItem } from '@/lib/tajwid';
import { useAuth } from '@/lib/auth/AuthProvider';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function TajwidAssessmentScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [items, setItems] = useState<TajwidPracticeItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const repository = session?.user.provider === 'firebase' ? nexoraCoreTajwidRepository(session) : mockTajwid;
    void Promise.all([
      mockTajwid.getPractice('makharij'),
      mockTajwid.getPractice('sifat-huruf'),
      mockTajwid.getPractice('nun-sukun-tanwin'),
      mockTajwid.getPractice('mim-sukun'),
      mockTajwid.getPractice('mad'),
      mockTajwid.getPractice('qalqalah'),
      mockTajwid.getPractice('waqaf-ibtida'),
    ]).then((groups) => setItems(groups.flat()));
  }, [session]);

  const item = items[index];
  const score = useMemo(() => (items.length ? Math.round((correct / items.length) * 100) : 0), [correct, items.length]);

  const check = () => {
    if (selected === null || checked || !item) return;
    setChecked(true);
    if (selected === item.correctOptionIndex) setCorrect((value) => value + 1);
  };

  const next = async () => {
    if (!item) return;
    const nextCorrect = correct + (selected === item.correctOptionIndex ? 1 : 0);
    if (index + 1 < items.length) {
      setIndex((value) => value + 1);
      setSelected(null);
      setChecked(false);
      return;
    }

    const finalScore = items.length ? Math.round((nextCorrect / items.length) * 100) : 0;
    const didPass = finalScore >= 70;
    const repository = session?.user.provider === 'firebase' ? nexoraCoreTajwidRepository(session) : mockTajwid;
    await repository.completeAssessment(session?.user.id ?? DEMO_USER_ID, nextCorrect, items.length);
    setCorrect(nextCorrect);
    setPassed(didPass);
    setFinished(true);
  };

  if (finished) {
    return (
      <Screen>
        <Text style={styles.eyebrow}>ASSESSMENT SELESAI</Text>
        <Text style={styles.title}>{passed ? 'Assessment lulus 🎉' : 'Terus berlatih'}</Text>
        <Card>
          <Text style={styles.score}>{score}%</Text>
          <Text style={styles.result}>{correct} dari {items.length} jawaban benar</Text>
          <Text style={styles.explanation}>
            {passed ? 'Kamu memenuhi batas kelulusan 70%. Materi berikutnya dapat dikembangkan sebagai tahap lanjutan.' : 'Batas kelulusan adalah 70%. Ulangi latihan topik yang masih terasa sulit.'}
          </Text>
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
        <Text style={styles.title}>Menyiapkan assessment…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.eyebrow}>ASSESSMENT • {index + 1}/{items.length}</Text>
      <Text style={styles.title}>Uji Pemahaman Tajwid</Text>
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
            {selected === item.correctOptionIndex ? 'Benar' : 'Belum tepat'}
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
            <Text style={styles.primaryText}>{index + 1 < items.length ? 'Lanjut' : 'Selesai'}</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800', lineHeight: 34, marginTop: spacing.sm },
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
