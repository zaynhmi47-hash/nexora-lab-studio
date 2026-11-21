import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrganization } from '@/lib/organization/OrganizationProvider';
import { colors, radius, spacing } from '@/theme/tokens';

export function OrganizationContextCard() {
  const { organizations, organization, status, error, selectOrganization } = useOrganization();

  const cycleOrganization = () => {
    if (organizations.length < 2 || !organization) return;
    const currentIndex = organizations.findIndex((item) => item.id === organization.id);
    const nextOrganization = organizations[(currentIndex + 1) % organizations.length];
    if (nextOrganization) selectOrganization(nextOrganization.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="layers-outline" size={19} color={colors.primaryDark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>ORGANIZATION CONTEXT</Text>
        <Text style={styles.name}>
          {status === 'loading' ? 'Loading your spaces…' : organization?.name ?? 'Personal space'}
        </Text>
        <Text style={styles.detail}>
          {status === 'error'
            ? 'Organization list could not be loaded.'
            : organizations.length > 0
              ? `${organizations.length} active organization membership${organizations.length === 1 ? '' : 's'}`
              : status === 'ready'
                ? 'Personal Dignity space'
                : 'Organization membership context is not available yet'}
        </Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Text style={styles.hint}>
          Selection is a navigation preference. API permissions are checked independently for every request.
        </Text>
      </View>
      {organizations.length > 1 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select organization"
          onPress={cycleOrganization}
          style={styles.switch}
        >
          <Ionicons name="swap-horizontal" size={17} color={colors.primary} />
          <Text style={styles.switchText}>Change</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.medium, padding: spacing.md, marginBottom: spacing.section },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  name: { color: colors.ink, fontSize: 13, fontWeight: '900', marginTop: 4 },
  detail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  error: { color: colors.danger, fontSize: 10, marginTop: 4 },
  hint: { color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 5 },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingLeft: 4 },
  switchText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
});
