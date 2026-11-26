import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useOrganization } from '@/lib/organization/OrganizationProvider';
import { Eyebrow, Heading, Panel, Screen, Tag, palette } from '@/components/ui';

export default function ProfileScreen() {
  const { status, identity, signOut } = useAuth();
  const { organization, membership } = useOrganization();
  const displayName = identity?.displayName?.trim() || 'Dignity learner';
  const initial = displayName.charAt(0).toUpperCase();

  const confirmSignOut = () => Alert.alert(
    'Sign out of Dignity?',
    'You can sign in again with your Nexora account at any time.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => void signOut() }],
  );

  return (
    <Screen>
      <Eyebrow>YOUR NEXORA ACCOUNT</Eyebrow>
      <Heading title="Profile" subtitle="Manage your learning identity and account preferences." />
      <Panel style={styles.identityCard}>
        <View style={styles.identityTop}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{identity?.email ?? 'Email not available'}</Text>
            <Tag label={status === 'signed_in' ? 'NEXORA ACCOUNT CONNECTED' : 'NOT SIGNED IN'} tone={status === 'signed_in' ? 'green' : 'orange'} />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.accountRow}><Text style={styles.accountLabel}>Identity provider</Text><Text style={styles.accountValue}>Nexora Identity</Text></View>
        <View style={styles.accountRow}><Text style={styles.accountLabel}>Session status</Text><Text style={styles.accountValue}>{status.replace('_', ' ')}</Text></View>
      </Panel>

      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Learning environment</Text></View>
      <Panel style={{ gap: 12 }}>
        <View style={styles.orgRow}>
          <View style={styles.orgIcon}><Ionicons name="business-outline" size={20} color={palette.primary} /></View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.orgName}>{organization?.name ?? 'No institution connected'}</Text>
            <Text style={styles.orgDetail}>{organization ? 'Your active learning workspace' : 'Your school or campus workspace will appear here.'}</Text>
          </View>
          <Tag label={membership?.status?.toUpperCase() ?? 'PERSONAL'} tone={membership?.status === 'active' ? 'green' : 'neutral'} />
        </View>
        <View style={styles.divider} />
        <View style={styles.privacyRow}>
          <Ionicons name="shield-checkmark-outline" size={19} color={palette.green} />
          <View style={{ flex: 1, gap: 3 }}><Text style={styles.privacyTitle}>Your data, your context</Text><Text style={styles.privacyText}>Institutional access and official academic records are governed by server-side permissions.</Text></View>
        </View>
      </Panel>

      <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Account settings</Text></View>
      <Panel style={{ gap: 2 }}>
        <View style={styles.settingRow}><Ionicons name="person-circle-outline" size={20} color={palette.muted} /><Text style={styles.settingText}>Personal information</Text><Tag label="COMING NEXT" tone="neutral" /></View>
        <View style={styles.divider} />
        <View style={styles.settingRow}><Ionicons name="notifications-outline" size={20} color={palette.muted} /><Text style={styles.settingText}>Notifications</Text><Tag label="COMING NEXT" tone="neutral" /></View>
        <View style={styles.divider} />
        <View style={styles.settingRow}><Ionicons name="lock-closed-outline" size={20} color={palette.muted} /><Text style={styles.settingText}>Privacy & security</Text><Tag label="COMING NEXT" tone="neutral" /></View>
      </Panel>

      {identity ? <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.75 }]}><Ionicons name="log-out-outline" size={18} color="#C34F6B" /><Text style={styles.signOutText}>Sign out</Text></Pressable> : null}
      <Text style={styles.footer}>Dignity is part of the Nexora ecosystem. One account, connected learning experiences.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identityCard: { gap: 15 },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: palette.primary, fontSize: 25, fontWeight: '900' },
  name: { color: palette.ink, fontSize: 16, fontWeight: '900' },
  email: { color: palette.muted, fontSize: 10 },
  divider: { height: 1, backgroundColor: palette.line },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountLabel: { color: palette.muted, fontSize: 10 },
  accountValue: { color: palette.ink, fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  sectionHead: { marginBottom: -10 },
  sectionTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orgIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center' },
  orgName: { color: palette.ink, fontSize: 11, fontWeight: '800' },
  orgDetail: { color: palette.muted, fontSize: 9, lineHeight: 14 },
  privacyRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  privacyTitle: { color: '#176D55', fontSize: 11, fontWeight: '800' },
  privacyText: { color: '#397D69', fontSize: 9, lineHeight: 14 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  settingText: { flex: 1, color: palette.ink, fontSize: 11, fontWeight: '700' },
  signOut: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#F3D8DF', backgroundColor: '#FFF7F8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signOutText: { color: '#C34F6B', fontSize: 12, fontWeight: '800' },
  footer: { color: '#9AA3B6', fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 10 },
});