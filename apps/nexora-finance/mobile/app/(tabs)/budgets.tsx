import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AdaptiveHeader, ResponsiveContainer, ResponsiveGrid, ResponsiveScaffold } from '@/components/layout';
import { useResponsive } from '@/lib/responsive';
import { theme } from '@/lib/theme';
import { useBudgets, type FinanceBudget, type CreateBudgetInput } from '@/lib/features/budgets';

const formatIdr = (amount: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(amount);

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type Mode = 'detail' | 'add' | 'edit';

export default function BudgetsScreen() {
  const { isMobile } = useResponsive();
  const [page, setPage] = useState(1);
  const { budgets, loading, error, refresh, create, update, archive, ready, pageInfo } = useBudgets({
    status: 'active',
    page,
    pageSize: 20,
  });

  const [selected, setSelected] = useState<FinanceBudget | null>(null);
  const [mode, setMode] = useState<Mode>('detail');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(todayInput());
  const [endDate, setEndDate] = useState(todayInput());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = (budget?: FinanceBudget) => {
    setName(budget?.name ?? '');
    setCategory(budget?.category ?? '');
    setAmount(budget ? String(budget.amountMinor) : '');
    setStartDate(budget?.startDate ?? todayInput());
    setEndDate(budget?.endDate ?? todayInput());
    setFormError(null);
  };

  const openAdd = () => {
    resetForm();
    setSelected(null);
    setMode('add');
  };

  const openDetail = (budget: FinanceBudget) => {
    setSelected(budget);
    setMode('detail');
    setFormError(null);
  };

  const openEdit = () => {
    if (!selected || selected.status === 'archived') return;
    resetForm(selected);
    setMode('edit');
  };

  const closeModal = () => {
    if (submitting) return;
    setSelected(null);
    setMode('detail');
    setFormError(null);
  };

  const submit = async () => {
    const normalizedAmount = amount.replace(/[^0-9]/g, '');
    const amountMinor = Number(normalizedAmount);
    if (!name.trim()) return setFormError('Name is required.');
    if (!category.trim()) return setFormError('Category is required.');
    if (!normalizedAmount || !Number.isSafeInteger(amountMinor) || amountMinor < 1) {
      return setFormError('Enter a valid budget amount greater than 0.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return setFormError('Dates must use YYYY-MM-DD format.');
    }
    if (endDate < startDate) return setFormError('End date must be on or after start date.');

    setSubmitting(true);
    setFormError(null);
    try {
      const input: CreateBudgetInput = {
        name: name.trim(),
        category: category.trim(),
        amountMinor,
        currency: 'IDR',
        startDate,
        endDate,
      };
      if (mode === 'add') {
        const created = await create(input);
        setSelected(created);
        setMode('detail');
      } else if (selected) {
        const updated = await update(selected.id, input);
        setSelected(updated);
        setMode('detail');
      }
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Unable to save budget.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmArchive = () => {
    if (!selected || selected.status === 'archived' || submitting) return;
    Alert.alert(
      'Archive budget?',
      'Archived budgets are kept for history but are no longer active for Budget vs Actual.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            setFormError(null);
            try {
              await archive(selected.id);
              closeModal();
            } catch (cause) {
              setFormError(cause instanceof Error ? cause.message : 'Unable to archive budget.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const formTitle = mode === 'add' ? 'Add budget' : mode === 'edit' ? 'Edit budget' : 'Budget detail';

  return (
    <ResponsiveScaffold>
      <ResponsiveContainer maxWidth={1200}>
        <ScrollView contentContainerStyle={styles.content}>
          <AdaptiveHeader title="Budgets" subtitle="Set spending limits and manage active budget periods." />

          <View style={styles.toolbar}>
            <View style={styles.toolbarCopy}>
              <Text style={styles.sectionTitle}>Active budgets</Text>
              <Text style={styles.hint}>{pageInfo.total} budget{pageInfo.total === 1 ? '' : 's'}</Text>
            </View>
            <Pressable disabled={!ready} onPress={openAdd} style={[styles.primaryButton, !ready && styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>+ Add budget</Text>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.alert}>
              <Text style={styles.alertTitle}>Unable to load budgets</Text>
              <Text style={styles.hint}>{error.message}</Text>
              <Pressable onPress={() => void refresh()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {loading && budgets.length === 0 ? (
            <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.hint}>Loading budgets…</Text></View>
          ) : budgets.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.emptyTitle}>No active budgets</Text>
              <Text style={styles.hint}>Create a budget to start tracking planned spending.</Text>
              <Pressable disabled={!ready} onPress={openAdd} style={[styles.primaryButton, !ready && styles.disabledButton]}>
                <Text style={styles.primaryButtonText}>Create your first budget</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listCard}>
              {budgets.map((item) => (
                <Pressable key={item.id} onPress={() => openDetail(item)} style={styles.budgetRow}>
                  <View style={styles.budgetMain}>
                    <Text style={styles.budgetTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.hint}>{item.category} · {item.startDate} → {item.endDate}</Text>
                  </View>
                  <Text style={styles.budgetAmount}>{formatIdr(item.amountMinor)}</Text>
                </Pressable>
              ))}
              {pageInfo.totalPages > 1 ? (
                <View style={styles.pagination}>
                  <Pressable disabled={page <= 1 || loading} onPress={() => setPage((value) => value - 1)} style={[styles.secondaryButton, (page <= 1 || loading) && styles.disabledButton]}>
                    <Text style={styles.secondaryButtonText}>Previous</Text>
                  </Pressable>
                  <Text style={styles.hint}>Page {pageInfo.page} of {pageInfo.totalPages}</Text>
                  <Pressable disabled={page >= pageInfo.totalPages || loading} onPress={() => setPage((value) => value + 1)} style={[styles.secondaryButton, (page >= pageInfo.totalPages || loading) && styles.disabledButton]}>
                    <Text style={styles.secondaryButtonText}>Next</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </ResponsiveContainer>

      <Modal visible={mode !== 'detail' || selected !== null} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isMobile ? styles.modalMobile : styles.modalDesktop]}>
            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <View style={styles.toolbarCopy}>
                  <Text style={styles.modalTitle}>{formTitle}</Text>
                  <Text style={styles.hint}>
                    {mode === 'detail' ? 'Review the budget and its active period.' : 'Budget changes apply to the active organization.'}
                  </Text>
                </View>
                <Pressable disabled={submitting} onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>

              {mode === 'detail' && selected ? (
                <>
                  <View style={styles.detailHero}>
                    <Text style={styles.detailAmount}>{formatIdr(selected.amountMinor)}</Text>
                    <Text style={styles.detailDirection}>{selected.category} · {selected.status === 'active' ? 'Active' : 'Archived'}</Text>
                  </View>
                  <View style={styles.detailGrid}>
                    {[
                      ['Name', selected.name],
                      ['Category', selected.category],
                      ['Period', `${selected.startDate} → ${selected.endDate}`],
                      ['Currency', selected.currency],
                      ['Created', new Date(selected.createdAt).toLocaleString('id-ID')],
                      ['Updated', new Date(selected.updatedAt).toLocaleString('id-ID')],
                    ].map(([label, value]) => (
                      <View key={label} style={styles.detailItem}>
                        <Text style={styles.fieldLabel}>{label}</Text>
                        <Text style={styles.detailValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                  {formError ? <View style={styles.formAlert}><Text style={styles.formAlertText}>{formError}</Text></View> : null}
                  <View style={styles.formActions}>
                    {selected.status === 'active' ? (
                      <>
                        <Pressable disabled={submitting} onPress={openEdit} style={styles.secondaryButton}>
                          <Text style={styles.secondaryButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable disabled={submitting} onPress={confirmArchive} style={styles.dangerButton}>
                          <Text style={styles.dangerButtonText}>Archive</Text>
                        </Pressable>
                      </>
                    ) : <Text style={styles.hint}>Archived budgets are read-only.</Text>}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Budget name *</Text>
                  <TextInput value={name} onChangeText={setName} placeholder="Monthly operating budget" placeholderTextColor={theme.colors.muted} style={styles.input} />
                  <ResponsiveGrid gap={12}>
                    <View style={styles.field}><Text style={styles.fieldLabel}>Category *</Text><TextInput value={category} onChangeText={setCategory} placeholder="Marketing" placeholderTextColor={theme.colors.muted} style={styles.input} /></View>
                    <View style={styles.field}><Text style={styles.fieldLabel}>Amount (IDR) *</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="5000000" placeholderTextColor={theme.colors.muted} style={styles.input} /></View>
                  </ResponsiveGrid>
                  <ResponsiveGrid gap={12}>
                    <View style={styles.field}><Text style={styles.fieldLabel}>Start date *</Text><TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.muted} style={styles.input} /></View>
                    <View style={styles.field}><Text style={styles.fieldLabel}>End date *</Text><TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.muted} style={styles.input} /></View>
                  </ResponsiveGrid>
                  {formError ? <View style={styles.formAlert}><Text style={styles.formAlertText}>{formError}</Text></View> : null}
                  <View style={styles.formActions}>
                    <Pressable disabled={submitting} onPress={closeModal} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable>
                    <Pressable disabled={submitting} onPress={() => void submit()} style={styles.primaryButton}>
                      {submitting ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>{mode === 'edit' ? 'Save changes' : 'Save budget'}</Text>}
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ResponsiveScaffold>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 40, gap: 16 },
  toolbar: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  toolbarCopy: { flex: 1, gap: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  hint: { fontSize: 14, lineHeight: 20, color: theme.colors.muted },
  primaryButton: { minHeight: 44, paddingHorizontal: 16, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: theme.colors.surface, fontSize: 14, fontWeight: '700' },
  secondaryButton: { minHeight: 44, paddingHorizontal: 16, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  dangerButton: { minHeight: 44, paddingHorizontal: 16, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  dangerButtonText: { color: theme.colors.text, fontSize: 14, fontWeight: '800' },
  disabledButton: { opacity: 0.5 },
  alert: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, gap: 8 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  stateCard: { minHeight: 180, padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  listCard: { paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  budgetRow: { minHeight: 76, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  budgetMain: { flex: 1, gap: 4 },
  budgetTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  budgetAmount: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  pagination: { minHeight: 64, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: theme.colors.surface },
  modalMobile: { width: '100%' },
  modalDesktop: { alignSelf: 'center', width: '92%', maxWidth: 720, borderRadius: 24, marginBottom: 24 },
  formContent: { padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 4 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 28, lineHeight: 30, color: theme.colors.muted },
  field: { flex: 1, gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  input: { minHeight: 46, paddingHorizontal: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, color: theme.colors.text, fontSize: 15 },
  formAlert: { padding: 12, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  formAlertText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  detailHero: { padding: 20, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, alignItems: 'center', gap: 6 },
  detailAmount: { fontSize: 30, fontWeight: '900', color: theme.colors.text },
  detailDirection: { fontSize: 14, fontWeight: '700', color: theme.colors.muted },
  detailGrid: { gap: 12 },
  detailItem: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 3 },
  detailValue: { fontSize: 15, lineHeight: 21, color: theme.colors.text },
});
