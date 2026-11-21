import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/dignity/Screen';
import { SurfaceCard } from '@/components/dignity/SurfaceCard';
import { OrganizationContextCard } from '@/components/dignity/OrganizationContextCard';
import { useAuth } from '@/lib/auth';
import { useDignityProfile } from '@/lib/profile/DignityProfileProvider';
import { colors, radius, spacing } from '@/theme/tokens';
export default function ProfileScreen() {
  const { status: authStatus, identity, signOut } = useAuth();
  const { profile, status: profileStatus, error: profileError, refresh } = useDignityProfile();
  const displayName = profile?.displayName ?? identity?.displayName ?? 'Dignity member';
  const email = profile?.email ?? identity?.email ?? 'Account email unavailable';
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return <Screen>
    <Text style={styles.eyebrow}>YOUR DIGNITY PROFILE</Text><Text style={styles.title}>A picture of your journey.</Text>
    <SurfaceCard style={styles.profileCard}>
      {profile?.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} /> : <View style={styles.avatar}><Text style={styles.initials}>{initials || 'D'}</Text></View>}
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.email}>{email}</Text>
      <View style={styles.identityPill}><Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} /><Text style={styles.identityText}>Nexora Identity · {profileStatus === 'ready' ? profile?.status ?? 'verified' : profileStatus === 'loading' ? 'syncing' : authStatus}</Text></View>
      {profileError ? <Pressable onPress={() => void refresh()} style={styles.retry}><Text style={styles.retryText}>Profile sync failed · Tap to retry</Text></Pressable> : null}
    </SurfaceCard>
    <OrganizationContextCard />
    <Pressable onPress={() => router.push('/skills')} style={styles.settings}>
      <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
      <View style={{ flex: 1 }}><Text style={styles.settingsText}>Skill profile & evidence</Text><Text style={styles.rowDetail}>Competencies, portfolio and assessed mastery</Text></View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
    <Pressable onPress={() => router.push('/evidence-review')} style={styles.settings}>
      <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
      <View style={{ flex: 1 }}><Text style={styles.settingsText}>Organization evidence review</Text><Text style={styles.rowDetail}>For organization owners and authorized reviewers</Text></View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
    <Text style={styles.sectionTitle}>Your profile connects</Text>
    <ProfileRow icon="school-outline" title="Learning evidence" detail="Courses, practice and demonstrated skills" />
    <ProfileRow icon="leaf-outline" title="Personal growth" detail="Goals, habits and reflections — private by default" />
    <ProfileRow icon="briefcase-outline" title="Career & portfolio" detail="Projects and professional evidence" />
    <ProfileRow icon="document-text-outline" title="Academic context" detail="Institutional records only when authorized" />
    <SurfaceCard style={styles.privacy}><Ionicons name="lock-closed-outline" size={19} color={colors.primary} /><View style={{ flex: 1 }}><Text style={styles.privacyTitle}>You control your development story</Text><Text style={styles.privacyText}>A unified profile does not merge private data or grant organizations automatic access.</Text></View></SurfaceCard>
    <Pressable onPress={() => router.push('/(tabs)/mentor')} style={styles.settings}><Ionicons name="sparkles-outline" size={18} color={colors.primary} /><Text style={styles.settingsText}>Dignity AI Mentor</Text><Ionicons name="chevron-forward" size={16} color={colors.muted} /></Pressable>
    {identity ? <Pressable onPress={() => void signOut()} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable> : null}
  </Screen>;
}
function ProfileRow({ icon, title, detail }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string }) {
  return <View style={styles.row}><View style={styles.rowIcon}><Ionicons name={icon} size={18} color={colors.primaryDark} /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDetail}>{detail}</Text></View></View>;
}
const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '900', letterSpacing: -0.7, marginTop: 8, marginBottom: spacing.xl },
  profileCard: { alignItems: 'center', paddingVertical: 24, marginBottom: spacing.xl },
  avatar: { width: 68, height: 68, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 68, height: 68, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  retry: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.roseSoft },
  retryText: { color: colors.danger, fontSize: 10, fontWeight: '800' },
  initials: { color: colors.primaryDark, fontSize: 22, fontWeight: '900' },
  name: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 12 },
  email: { color: colors.muted, fontSize: 12, marginTop: 4 },
  identityPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 7, marginTop: 13 },
  identityText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  rowDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  privacy: { flexDirection: 'row', gap: 12, backgroundColor: colors.primarySoft, borderColor: '#D5E5D9', marginTop: spacing.xl },
  privacyTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  privacyText: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 4 },
  settings: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, marginTop: spacing.md },
  settingsText: { color: colors.ink, fontSize: 12, fontWeight: '800', flex: 1 },
  signOut: { alignItems: 'center', padding: 15, marginTop: spacing.md, backgroundColor: '#F8EAE7', borderRadius: radius.medium },
  signOutText: { color: colors.danger, fontSize: 12, fontWeight: '900' },
});