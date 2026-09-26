import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useDatingApi, type DatingNotificationPreferences } from '@/src/api/provider';

const options: Array<{ key: keyof DatingNotificationPreferences; title: string; description: string }> = [
  { key: 'push_enabled', title: 'Push notifications', description: 'Master switch for dating push notifications.' },
  { key: 'match_push_enabled', title: 'New matches', description: 'Notify when a new mutual match is created.' },
  { key: 'message_push_enabled', title: 'Messages', description: 'Notify about new messages when you are not viewing that conversation.' },
  { key: 'safety_push_enabled', title: 'Safety', description: 'Allow important safety and moderation notifications.' },
];

export default function NotificationSettingsScreen() {
  const api = useDatingApi();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['dating', 'notification-preferences'], queryFn: () => api.getNotificationPreferences() });
  const [preferences, setPreferences] = useState<DatingNotificationPreferences | null>(null);

  useEffect(() => {
    if (query.data) setPreferences(query.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: (payload: Partial<DatingNotificationPreferences>) => api.updateNotificationPreferences(payload),
    onSuccess: (next) => {
      setPreferences(next);
      client.setQueryData(['dating', 'notification-preferences'], next);
    },
  });

  const toggle = (key: keyof DatingNotificationPreferences) => {
    if (!preferences) return;
    const value = !preferences[key];
    setPreferences({ ...preferences, [key]: value });
    save.mutate({ [key]: value });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text>Back</Text></Pressable>
        <Text style={styles.title}>Notification settings</Text>
      </View>
      {query.isLoading ? <Text>Loading…</Text> : null}
      {preferences ? options.map((option) => (
        <View key={option.key} style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.description}>{option.description}</Text>
          </View>
          <Switch
            value={preferences[option.key]}
            onValueChange={() => toggle(option.key)}
            disabled={save.isPending || (option.key !== 'push_enabled' && !preferences.push_enabled)}
          />
        </View>
      )) : null}
      <Text style={styles.note}>Message push notifications are suppressed while you are actively viewing the conversation.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  back: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  title: { fontSize: 24, fontWeight: '800', flex: 1 },
  row: { borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 4 },
  optionTitle: { fontWeight: '800' },
  description: { opacity: 0.6, lineHeight: 18 },
  note: { opacity: 0.55, lineHeight: 19 },
});
