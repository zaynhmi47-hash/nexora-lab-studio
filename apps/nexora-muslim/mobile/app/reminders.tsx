import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text } from "react-native";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth/AuthProvider";
import { mockReminders, nexoraCoreReminderRepository, type ReminderPort } from "@/lib/reminders";

export default function RemindersScreen() {
  const { session } = useAuth();
  const repository = useMemo<ReminderPort>(() => session?.user.provider === "firebase" ? nexoraCoreReminderRepository(session) : mockReminders, [session]);
  const [enabled, setEnabled] = useState(false);
  const [beforeMinutes, setBeforeMinutes] = useState(10);
  useEffect(() => { void repository.getPrayerPreference().then((x) => { setEnabled(x.enabled); setBeforeMinutes(x.beforeMinutes); }).catch(() => {}); }, [repository]);
  const save = async (next: boolean) => { setEnabled(next); await repository.updatePrayerPreference({ enabled: next, beforeMinutes }); };
  return <Screen>
    <Text style={s.eyebrow}>REMINDERS</Text><Text style={s.heading}>Prayer Reminders</Text>
    <Text style={s.muted}>Configure when the app should remind you before prayer time.</Text>
    <Card style={s.card}><Text style={s.title}>Prayer notifications</Text><Switch value={enabled} onValueChange={save} trackColor={{ true: colors.primary }} /></Card>
    <Text style={s.label}>Reminder lead time</Text>
    <Card style={s.options}>{[5,10,15,30].map((minutes) => <Pressable key={minutes} onPress={async()=>{setBeforeMinutes(minutes);await repository.updatePrayerPreference({enabled,beforeMinutes:minutes});}} style={[s.option,beforeMinutes===minutes&&s.selected]}><Text style={beforeMinutes===minutes?s.selectedText:s.optionText}>{minutes} minutes</Text></Pressable>)}</Card>
  </Screen>;
}
const s=StyleSheet.create({eyebrow:{color:colors.primary,fontSize:11,fontWeight:"800"},heading:{color:colors.text,fontSize:28,fontWeight:"800",marginTop:spacing.sm},muted:{color:colors.textMuted,lineHeight:20,marginTop:spacing.xs},card:{marginTop:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},title:{color:colors.text,fontWeight:"800"},label:{color:colors.text,fontWeight:"800",marginTop:spacing.xl},options:{marginTop:spacing.sm},option:{padding:12,borderBottomWidth:1,borderBottomColor:colors.border},selected:{backgroundColor:colors.primarySoft},optionText:{color:colors.text},selectedText:{color:colors.primary,fontWeight:"800"}});
