import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useOrganization } from '../../lib/organization/OrganizationProvider';

export function OrganizationSwitcher() {
  const {
    organizations,
    activeOrganization,
    loading,
    error,
    selectOrganization,
  } = useOrganization();
  const [open, setOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const canSwitch = organizations.length > 1 && Boolean(activeOrganization) && !loading;

  const handleSelect = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id) {
      setOpen(false);
      return;
    }

    setSwitchingId(organizationId);
    setSwitchError(null);
    try {
      await selectOrganization(organizationId);
      setOpen(false);
    } catch (cause) {
      setSwitchError(cause instanceof Error ? cause.message : 'Gagal mengganti workspace.');
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pilih workspace organisasi"
        accessibilityState={{ disabled: !canSwitch, expanded: open }}
        disabled={!canSwitch}
        onPress={() => {
          setSwitchError(null);
          setOpen(true);
        }}
        style={({ pressed }) => [styles.trigger, pressed && canSwitch && styles.triggerPressed]}
      >
        <View style={styles.triggerCopy}>
          <Text style={styles.eyebrow}>WORKSPACE</Text>
          <Text numberOfLines={1} style={styles.name}>
            {loading ? 'Memuat...' : activeOrganization?.name ?? 'Belum dipilih'}
          </Text>
        </View>
        {canSwitch ? <Text style={styles.chevron}>⌄</Text> : null}
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetCopy}>
                <Text style={styles.sheetTitle}>Pilih workspace</Text>
                <Text style={styles.sheetSubtitle}>
                  Hanya organisasi aktif yang sudah terverifikasi dapat dipilih.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup pemilih workspace"
                hitSlop={10}
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            {switchError || error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{switchError ?? error?.message}</Text>
              </View>
            ) : null}

            <View style={styles.list}>
              {organizations.map((organization) => {
                const selected = organization.id === activeOrganization?.id;
                const switching = switchingId === organization.id;
                return (
                  <Pressable
                    key={organization.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: Boolean(switchingId) }}
                    disabled={Boolean(switchingId)}
                    onPress={() => void handleSelect(organization.id)}
                    style={({ pressed }) => [
                      styles.organizationRow,
                      selected && styles.organizationRowSelected,
                      pressed && styles.organizationRowPressed,
                    ]}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {organization.name.trim().charAt(0).toUpperCase() || 'N'}
                      </Text>
                    </View>
                    <View style={styles.organizationCopy}>
                      <Text numberOfLines={1} style={styles.organizationName}>
                        {organization.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.organizationSlug}>
                        {organization.slug}
                      </Text>
                    </View>
                    {switching ? (
                      <ActivityIndicator color="#38bdf8" />
                    ) : selected ? (
                      <Text style={styles.selectedMark}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minWidth: 150,
    maxWidth: 220,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
  },
  triggerPressed: { backgroundColor: '#0f172a' },
  triggerCopy: { flex: 1, marginRight: 8 },
  eyebrow: { color: '#38bdf8', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  name: { color: '#ffffff', fontSize: 13, fontWeight: '800', marginTop: 1 },
  chevron: { color: '#94a3b8', fontSize: 18, lineHeight: 18 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 6, 23, 0.72)' },
  sheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '80%',
  },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 999, backgroundColor: '#334155', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  sheetCopy: { flex: 1, paddingRight: 12 },
  sheetTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '900' },
  sheetSubtitle: { color: '#94a3b8', fontSize: 12, lineHeight: 17, marginTop: 4 },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b' },
  closeText: { color: '#cbd5e1', fontSize: 24, lineHeight: 25 },
  errorBox: { backgroundColor: '#3f1d24', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { color: '#fecdd3', fontSize: 12, lineHeight: 17 },
  list: { gap: 8 },
  organizationRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#020617' },
  organizationRowSelected: { borderColor: '#38bdf8', backgroundColor: '#082f49' },
  organizationRowPressed: { opacity: 0.82 },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', marginRight: 12 },
  avatarText: { color: '#38bdf8', fontSize: 16, fontWeight: '900' },
  organizationCopy: { flex: 1, marginRight: 8 },
  organizationName: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
  organizationSlug: { color: '#64748b', fontSize: 11, marginTop: 3 },
  selectedMark: { color: '#38bdf8', fontSize: 20, fontWeight: '900' },
});
