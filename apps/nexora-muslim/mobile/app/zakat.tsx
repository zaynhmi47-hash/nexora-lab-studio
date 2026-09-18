import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";

import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth/AuthProvider";
import { mockZakat, nexoraCoreZakatRepository, type ZakatPort } from "@/lib/zakat";

export default function ZakatScreen() {
  const { session } = useAuth();
  const repository = useMemo<ZakatPort>(
    () => session?.user.provider === "firebase"
      ? nexoraCoreZakatRepository(session)
      : mockZakat,
    [session],
  );
  const [assets, setAssets] = useState("");
  const [debts, setDebts] = useState("");
  const [nisab, setNisab] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calculate = async () => {
    const calculation = await repository.calculate({ assets, debts, nisab });
    setResult(calculation.zakatAmount + " " + calculation.currency);
  };

  return (
    <Screen>
      <Text style={styles.eyebrow}>WORSHIP</Text>
      <Text style={styles.heading}>Zakat Calculator</Text>
      <Text style={styles.muted}>
        Estimate zakat from assets, eligible debts, and the selected nisab.
      </Text>

      <TextInput style={styles.input} placeholder="Total assets" placeholderTextColor={colors.textMuted} value={assets} onChangeText={setAssets} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Eligible debts" placeholderTextColor={colors.textMuted} value={debts} onChangeText={setDebts} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Nisab" placeholderTextColor={colors.textMuted} value={nisab} onChangeText={setNisab} keyboardType="decimal-pad" />

      <Pressable style={styles.button} onPress={calculate}>
        <Text style={styles.buttonText}>Calculate</Text>
      </Pressable>

      {result ? (
        <Card style={styles.resultCard}>
          <Text style={styles.muted}>Estimated zakat</Text>
          <Text style={styles.result}>{result}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  heading: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: spacing.sm },
  muted: { color: colors.textMuted, lineHeight: 20 },
  input: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text },
  button: { marginTop: spacing.md, padding: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center" },
  buttonText: { color: colors.white, fontWeight: "800" },
  resultCard: { marginTop: spacing.lg },
  result: { color: colors.text, fontSize: 28, fontWeight: "900", marginTop: spacing.sm },
});
