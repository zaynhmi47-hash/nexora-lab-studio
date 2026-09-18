import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text } from "react-native";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth/AuthProvider";
import { mockPrayerRepository, nexoraCorePrayerRepository } from "@/lib/prayer";
import {
  cancelPrayerReminders,
  hasNotificationPermission,
  mockReminders,
  nexoraCoreReminderRepository,
  requestNotificationPermission,
  schedulePrayerReminders,
  syncPrayerReminders,
  subscribeToPrayerReminderResync,
  type ReminderPort,
} from "@/lib/reminders";

export default function RemindersScreen() {
  const { session } = useAuth();
  const reminderRepository = useMemo<ReminderPort>(
    () => session?.user.provider === "firebase" ? nexoraCoreReminderRepository(session) : mockReminders,
    [session],
  );
  const prayerRepository = useMemo(
    () => session?.user.provider === "firebase" ? nexoraCorePrayerRepository(session) : mockPrayerRepository,
    [session],
  );
  const [enabled, setEnabled] = useState(false);
  const [beforeMinutes, setBeforeMinutes] = useState(10);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void hasNotificationPermission().then(setPermissionGranted).catch(() => setPermissionGranted(false));
    void reminderRepository.getPrayerPreference()
      .then((value) => {
        setEnabled(value.enabled);
        setBeforeMinutes(value.beforeMinutes);
      })
      .catch(() => setError("Unable to load reminder settings."));
  }, [reminderRepository]);

  useEffect(() => subscribeToPrayerReminderResync(() => syncPrayerReminders(reminderRepository, prayerRepository)), [reminderRepository, prayerRepository]);

  const syncSchedule = async (nextEnabled: boolean, minutes: number) => {
    if (!nextEnabled) {
      await cancelPrayerReminders();
      return;
    }
    const schedule = await prayerRepository.getDailySchedule();
    await schedulePrayerReminders(schedule, minutes);
  };

  const updatePreference = async (nextEnabled: boolean, minutes: number) => {
    setSaving(true);
    setError(null);
    try {
      if (nextEnabled) {
        const permission = await requestNotificationPermission();
        const granted = permission.granted || permission.ios?.status === 3;
        setPermissionGranted(granted);
        if (!granted) {
          setError("Notification permission was not granted.");
          return;
        }
      }
      const saved = await reminderRepository.updatePrayerPreference({
        enabled: nextEnabled,
        beforeMinutes: minutes,
      });
      await syncSchedule(saved.enabled, saved.beforeMinutes);
      setEnabled(saved.enabled);
      setBeforeMinutes(saved.beforeMinutes);
    } catch {
      setError("Unable to update prayer reminders.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={s.eyebrow}>REMINDERS</Text>
      <Text style={s.heading}>Prayer Reminders</Text>
      <Text style={s.muted}>Get a notification before each daily prayer time.</Text>
      {!permissionGranted && (
        <Text style={s.warning}>Notification permission is required to receive prayer reminders.</Text>
      )}
      <Card style={s.card}>
        <Text style={s.title}>Prayer notifications</Text>
        <Switch disabled={saving} value={enabled} onValueChange={(value) => void updatePreference(value, beforeMinutes)} trackColor={{ true: colors.primary }} />
      </Card>
      <Text style={s.label}>Reminder lead time</Text>
      <Card style={s.options}>
        {[5, 10, 15, 30].map((minutes) => (
          <Pressable
            key={minutes}
            disabled={saving}
            onPress={() => void updatePreference(enabled, minutes)}
            style={[s.option, beforeMinutes === minutes && s.selected]}
          >
            <Text style={beforeMinutes === minutes ? s.selectedText : s.optionText}>{minutes} minutes</Text>
          </Pressable>
        ))}
      </Card>
      {error && <Text style={s.error}>{error}</Text>}
      <Text style={s.note}>Reminder delivery uses the device notification system. Prayer times currently come from the existing PrayerRepository.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  eyebrow:{color:colors.primary,fontSize:11,fontWeight:"800"},
  heading:{color:colors.text,fontSize:28,fontWeight:"800",marginTop:spacing.sm},
  muted:{color:colors.textMuted,lineHeight:20,marginTop:spacing.xs},
  warning:{color:colors.warning ?? colors.primary,marginTop:spacing.md,lineHeight:20},
  card:{marginTop:spacing.lg,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  title:{color:colors.text,fontWeight:"800"},
  label:{color:colors.text,fontWeight:"800",marginTop:spacing.xl},
  options:{marginTop:spacing.sm},
  option:{padding:12,borderBottomWidth:1,borderBottomColor:colors.border},
  selected:{backgroundColor:colors.primarySoft},
  optionText:{color:colors.text},
  selectedText:{color:colors.primary,fontWeight:"800"},
  error:{color:colors.danger ?? colors.primary,marginTop:spacing.md},
  note:{color:colors.textMuted,fontSize:12,lineHeight:18,marginTop:spacing.xl},
});
