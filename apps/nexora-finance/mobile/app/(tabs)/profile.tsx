import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { AdaptiveHeader, ResponsiveContainer, ResponsiveScaffold } from '@/components/layout';
import { useAuth } from '@/lib/auth';
import { useOrganization } from '@/lib/organization';
import { useTheme } from '@/lib/theme';

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.trim() || 'N';
  return source
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfileScreen() {
  const { user, status, firebaseConfigured, signOut } = useAuth();
  const {
    organizations,
    activeOrganization,
    activeMembership,
    loading: organizationsLoading,
    error: organizationError,
    refresh,
    selectOrganization,
  } = useOrganization();
  const { mode, theme, setMode } = useTheme();
  const [busyOrganizationId, setBusyOrganizationId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refreshOrganizations = async () => {
    setFeedback(null);
    try {
      await refresh();
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'Unable to refresh workspaces.');
    }
  };

  const changeOrganization = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id || busyOrganizationId) return;
    setBusyOrganizationId(organizationId);
    setFeedback(null);
    try {
      await selectOrganization(organizationId);
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'Unable to switch workspace.');
    } finally {
      setBusyOrganizationId(null);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign out of Nexora Finance?',
      'You will need to sign in again to access your financial workspaces.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
              router.replace('/auth');
            } catch (cause) {
              setFeedback(cause instanceof Error ? cause.message : 'Unable to sign out.');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    );
  };

  const styles = createStyles(theme);

  return (
    <ResponsiveScaffold>
      <ResponsiveContainer maxWidth={1000}>
        <ScrollView contentContainerStyle={styles.content}>
          <AdaptiveHeader
            title="Profile & Settings"
            subtitle="Manage your Nexora account, active workspace, and app preferences."
          />

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.displayName, user?.email)}</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>{user?.displayName || 'Nexora user'}</Text>
              <Text style={styles.mutedText}>{user?.email || 'No email available'}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: status === 'authenticated' ? theme.colors.success : theme.colors.warning }]} />
                <Text style={styles.statusText}>
                  {user?.emailVerified ? 'Email verified' : 'Email verification pending'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>Active workspace</Text>
                <Text style={styles.mutedText}>Financial data is scoped to the selected organization.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh workspaces"
                disabled={organizationsLoading}
                onPress={() => void refreshOrganizations()}
                style={styles.textButton}
              >
                {organizationsLoading
                  ? <ActivityIndicator size="small" color={theme.colors.primary} />
                  : <Text style={styles.textButtonLabel}>Refresh</Text>}
              </Pressable>
            </View>

            {activeOrganization ? (
              <View style={styles.activeWorkspace}>
                <View style={styles.workspaceIcon}><Text style={styles.workspaceIconText}>W</Text></View>
                <View style={styles.workspaceCopy}>
                  <Text style={styles.workspaceName}>{activeOrganization.name}</Text>
                  <Text style={styles.mutedText}>{activeMembership?.role ?? 'Member'} · {activeOrganization.status}</Text>
                </View>
                <View style={styles.activePill}><Text style={styles.activePillText}>Active</Text></View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No active workspace</Text>
                <Text style={styles.mutedText}>Create or join an organization to start managing its finances.</Text>
                <Pressable onPress={() => router.push('/workspace')} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Open workspace setup</Text>
                </Pressable>
              </View>
            )}

            {organizations.length > 1 ? (
              <View style={styles.workspaceList}>
                <Text style={styles.fieldLabel}>Switch workspace</Text>
                {organizations.map((organization) => {
                  const selected = organization.id === activeOrganization?.id;
                  const changing = busyOrganizationId === organization.id;
                  return (
                    <Pressable
                      key={organization.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: Boolean(busyOrganizationId) || selected }}
                      disabled={Boolean(busyOrganizationId) || selected}
                      onPress={() => void changeOrganization(organization.id)}
                      style={[styles.workspaceOption, selected && styles.workspaceOptionSelected]}
                    >
                      <View style={styles.workspaceCopy}>
                        <Text style={styles.workspaceOptionName}>{organization.name}</Text>
                        <Text style={styles.mutedText}>{organization.slug}</Text>
                      </View>
                      {changing
                        ? <ActivityIndicator size="small" color={theme.colors.primary} />
                        : <Text style={selected ? styles.selectedLabel : styles.mutedText}>{selected ? 'Selected' : 'Switch'}</Text>}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App preferences</Text>
            <View style={styles.preferenceRow}>
              <View style={styles.sectionCopy}>
                <Text style={styles.preferenceTitle}>Dark appearance</Text>
                <Text style={styles.mutedText}>Use a darker color scheme in the app.</Text>
              </View>
              <Switch
                value={mode === 'dark'}
                onValueChange={(enabled) => setMode(enabled ? 'dark' : 'light')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
                accessibilityLabel="Enable dark appearance"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account & security</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account status</Text>
              <Text style={styles.infoValue}>{status.replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Authentication provider</Text>
              <Text style={styles.infoValue}>{firebaseConfigured ? 'Firebase Auth' : 'Not configured'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text selectable style={styles.infoValue}>{user?.id ?? '—'}</Text>
            </View>
          </View>

          {organizationError || feedback ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Something needs attention</Text>
              <Text style={styles.errorText}>{feedback || organizationError?.message}</Text>
              <Pressable onPress={() => void refreshOrganizations()} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={signingOut}
            onPress={confirmSignOut}
            style={[styles.signOutButton, signingOut && styles.disabledButton]}
          >
            {signingOut
              ? <ActivityIndicator color={theme.colors.danger} />
              : <Text style={styles.signOutText}>Sign out</Text>}
          </Pressable>

          <Text style={styles.footer}>Nexora Finance · Account and workspace settings</Text>
        </ScrollView>
      </ResponsiveContainer>
    </ResponsiveScaffold>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { paddingTop: 20, paddingBottom: 48, gap: 16 },
    profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
    avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
    avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
    profileCopy: { flex: 1, gap: 4 },
    profileName: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
    mutedText: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { color: theme.colors.textSecondary, fontSize: 12, textTransform: 'capitalize' },
    section: { padding: 20, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sectionCopy: { flex: 1, gap: 4 },
    sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
    textButton: { minHeight: 40, minWidth: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    textButtonLabel: { color: theme.colors.primary, fontSize: 13, fontWeight: '700' },
    activeWorkspace: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: theme.colors.surfaceMuted },
    workspaceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
    workspaceIconText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
    workspaceCopy: { flex: 1, gap: 3 },
    workspaceName: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
    activePill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: theme.colors.success + '18' },
    activePillText: { color: theme.colors.success, fontSize: 11, fontWeight: '800' },
    emptyState: { padding: 16, borderRadius: 14, backgroundColor: theme.colors.surfaceMuted, gap: 8 },
    emptyTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
    secondaryButton: { alignSelf: 'flex-start', minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, marginTop: 4 },
    secondaryButtonText: { color: theme.colors.text, fontSize: 13, fontWeight: '700' },
    workspaceList: { gap: 8 },
    fieldLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 2 },
    workspaceOption: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12 },
    workspaceOptionSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '0D' },
    workspaceOptionName: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    selectedLabel: { color: theme.colors.primary, fontSize: 12, fontWeight: '800' },
    preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    preferenceTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    infoLabel: { flex: 1, color: theme.colors.muted, fontSize: 13 },
    infoValue: { flex: 1, color: theme.colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right', textTransform: 'capitalize' },
    errorCard: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.danger, backgroundColor: theme.colors.surface, gap: 8 },
    errorTitle: { color: theme.colors.danger, fontSize: 14, fontWeight: '800' },
    errorText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19 },
    signOutButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.danger, borderRadius: 14, backgroundColor: theme.colors.surface },
    signOutText: { color: theme.colors.danger, fontSize: 14, fontWeight: '800' },
    disabledButton: { opacity: 0.55 },
    footer: { color: theme.colors.muted, fontSize: 11, textAlign: 'center', paddingTop: 4 },
  });
}
