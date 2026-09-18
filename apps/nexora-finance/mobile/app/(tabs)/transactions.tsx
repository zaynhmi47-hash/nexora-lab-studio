import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { AdaptiveHeader, ResponsiveContainer, ResponsiveGrid, ResponsiveScaffold } from '@/components/layout';
import { useResponsive } from '@/lib/responsive';
import { theme } from '@/lib/theme';
import { useTransactions } from '@/lib/features/transactions';
import type { FinanceTransaction, TransactionDirection, TransactionStatus } from '@/lib/features/transactions';
import type { TransactionListFilters } from '@/lib/features/transactions/transactionApi';
import type { UpdateTransactionInput } from '@/lib/features/transactions/transactionApi';

const formatIdr = (amountMinor: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(amountMinor);

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const createIdempotencyKey = () => `finance-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

type ModalMode = 'detail' | 'add' | 'edit';

export default function TransactionsScreen() {
  const { isMobile } = useResponsive();
  const [filterDirection, setFilterDirection] = useState<TransactionDirection | undefined>();
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | undefined>();
  const [page, setPage] = useState(1);
  const filters = useMemo<TransactionListFilters>(() => ({ direction: filterDirection, status: filterStatus, page, pageSize: 20 }), [filterDirection, filterStatus, page]);
  const { transactions, loading, error, create, update, voidTransaction, refresh, ready, pageInfo } = useTransactions(filters);
  const [selected, setSelected] = useState<FinanceTransaction | null>(null);
  const [mode, setMode] = useState<ModalMode>('detail');
  const [direction, setDirection] = useState<TransactionDirection>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [occurredDate, setOccurredDate] = useState(todayInput());
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const postedCount = useMemo(() => transactions.filter((item) => item.status === 'posted').length, [transactions]);

  const fillForm = (item?: FinanceTransaction) => {
    setDirection(item?.direction ?? 'income');
    setAmount(item ? String(item.amountMinor) : '');
    setCategory(item?.category ?? '');
    setDescription(item?.description ?? '');
    setOccurredDate(item ? item.occurredAt.slice(0, 10) : todayInput());
    setReference(item?.reference ?? '');
    setFormError(null);
  };

  const openAdd = () => {
    fillForm();
    setSelected(null);
    setMode('add');
  };

  const openDetail = (item: FinanceTransaction) => {
    setSelected(item);
    setMode('detail');
    setFormError(null);
  };

  const openEdit = () => {
    if (!selected || selected.status === 'void') return;
    fillForm(selected);
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
    if (!normalizedAmount || !Number.isSafeInteger(amountMinor) || amountMinor < 1) {
      setFormError('Enter a valid amount greater than 0.'); return;
    }
    if (!category.trim()) { setFormError('Category is required.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredDate)) {
      setFormError('Date must use YYYY-MM-DD format.'); return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const input: UpdateTransactionInput = {
        direction, amountMinor, currency: 'IDR', category: category.trim(),
        description: description.trim(), occurredAt: `${occurredDate}T12:00:00`,
        reference: reference.trim(),
      };
      if (mode === 'add') {
        const created = await create({ ...input, idempotencyKey: createIdempotencyKey() } as Parameters<typeof create>[0]);
        setSelected(created);
        setMode('detail');
      } else if (selected) {
        const updated = await update(selected.id, input);
        setSelected(updated);
        setMode('detail');
      }
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Unable to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmVoid = () => {
    if (!selected || selected.status === 'void' || submitting) return;
    Alert.alert(
      'Void transaction?',
      'This keeps the transaction record but removes it from posted financial totals.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void transaction',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            setFormError(null);
            try {
              const voided = await voidTransaction(selected.id);
              setSelected(voided);
              setMode('detail');
            } catch (cause) {
              setFormError(cause instanceof Error ? cause.message : 'Unable to void transaction.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const formTitle = mode === 'add' ? 'Add transaction' : mode === 'edit' ? 'Edit transaction' : 'Transaction detail';

  return (
    <ResponsiveScaffold>
      <ResponsiveContainer maxWidth={1200}>
        <ScrollView contentContainerStyle={styles.content}>
          <AdaptiveHeader title="Transactions" subtitle="Track income and expenses in your active organization." />

          <View style={styles.filterBar}>
            {(['all', 'income', 'expense'] as const).map((label) => {
              const value = label === 'all' ? undefined : label;
              return <Pressable key={label} onPress={() => { setFilterDirection(value); setPage(1); }} style={[styles.filterChip, filterDirection === value && styles.filterChipActive]}><Text style={[styles.filterChipText, filterDirection === value && styles.filterChipTextActive]}>{label[0].toUpperCase() + label.slice(1)}</Text></Pressable>;
            })}
            {(['posted', 'void'] as const).map((value) => (
              <Pressable key={value} onPress={() => { setFilterStatus(filterStatus === value ? undefined : value); setPage(1); }} style={[styles.filterChip, filterStatus === value && styles.filterChipActive]}><Text style={[styles.filterChipText, filterStatus === value && styles.filterChipTextActive]}>{value.toUpperCase()}</Text></Pressable>
            ))}
          </View>

          <View style={styles.toolbar}>
            <View style={styles.toolbarCopy}>
              <Text style={styles.sectionTitle}>All transactions</Text>
              <Text style={styles.hint}>{postedCount} posted transaction{postedCount === 1 ? '' : 's'}</Text>
            </View>
            <Pressable disabled={!ready} onPress={openAdd} style={[styles.primaryButton, !ready && styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>+ Add transaction</Text>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.alert}>
              <Text style={styles.alertTitle}>Unable to load transactions</Text>
              <Text style={styles.hint}>{error.message}</Text>
              <Pressable onPress={() => void refresh()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Retry</Text></Pressable>
            </View>
          ) : null}

          {loading && transactions.length === 0 ? (
            <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.hint}>Loading transactions…</Text></View>
          ) : transactions.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.hint}>Add your first income or expense.</Text>
              <Pressable disabled={!ready} onPress={openAdd} style={[styles.primaryButton, !ready && styles.disabledButton]}>
                <Text style={styles.primaryButtonText}>Add your first transaction</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listCard}>
              {transactions.map((item) => (
                <Pressable key={item.id} onPress={() => openDetail(item)} style={styles.transactionRow}>
                  <View style={styles.transactionMain}>
                    <View style={styles.titleRow}>
                      <View style={[styles.directionBadge, item.direction === 'expense' && styles.expenseBadge]}>
                        <Text style={styles.directionBadgeText}>{item.direction === 'income' ? 'IN' : 'OUT'}</Text>
                      </View>
                      <Text style={styles.transactionTitle} numberOfLines={1}>{item.description || item.category}</Text>
                      {item.status === 'void' ? <Text style={styles.voidLabel}>VOID</Text> : null}
                    </View>
                    <Text style={styles.hint}>
                      {item.category} · {new Date(item.occurredAt).toLocaleDateString('id-ID')}
                      {item.reference ? ` · ${item.reference}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, item.direction === 'expense' && styles.expenseAmount]}>
                    {item.direction === 'expense' ? '−' : '+'}{formatIdr(item.amountMinor)}
                  </Text>
                </Pressable>
              ))}
              {pageInfo.totalPages > 1 ? (
                <View style={styles.pagination}>
                  <Pressable disabled={page <= 1 || loading} onPress={() => setPage((current) => current - 1)} style={[styles.secondaryButton, (page <= 1 || loading) && styles.disabledButton]}><Text style={styles.secondaryButtonText}>Previous</Text></Pressable>
                  <Text style={styles.hint}>Page {pageInfo.page} of {pageInfo.totalPages} · {pageInfo.total} total</Text>
                  <Pressable disabled={page >= pageInfo.totalPages || loading} onPress={() => setPage((current) => current + 1)} style={[styles.secondaryButton, (page >= pageInfo.totalPages || loading) && styles.disabledButton]}><Text style={styles.secondaryButtonText}>Next</Text></Pressable>
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
                    {mode === 'detail' ? 'Review the transaction and its current status.' : 'Changes are saved to the active organization.'}
                  </Text>
                </View>
                <Pressable disabled={submitting} onPress={closeModal} style={styles.closeButton}><Text style={styles.closeButtonText}>×</Text></Pressable>
              </View>

              {mode === 'detail' && selected ? (
                <>
                  <View style={styles.detailHero}>
                    <Text style={styles.detailAmount}>{formatIdr(selected.amountMinor)}</Text>
                    <Text style={styles.detailDirection}>{selected.direction === 'income' ? 'Income' : 'Expense'} · {selected.status === 'posted' ? 'Posted' : 'Void'}</Text>
                  </View>
                  <View style={styles.detailGrid}>
                    {[
                      ['Category', selected.category],
                      ['Date', new Date(selected.occurredAt).toLocaleString('id-ID')],
                      ['Description', selected.description || '—'],
                      ['Reference', selected.reference || '—'],
                      ['Created', new Date(selected.createdAt).toLocaleString('id-ID')],
                      ['Updated', new Date(selected.updatedAt).toLocaleString('id-ID')],
                    ].map(([label, value]) => (
                      <View key={label} style={styles.detailItem}>
                        <Text style={styles.fieldLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                  {formError ? <View style={styles.formAlert}><Text style={styles.formAlertText}>{formError}</Text></View> : null}
                  <View style={styles.formActions}>
                    {selected.status === 'posted' ? (
                      <>
                        <Pressable disabled={submitting} onPress={openEdit} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Edit</Text></Pressable>
                        <Pressable disabled={submitting} onPress={confirmVoid} style={styles.dangerButton}><Text style={styles.dangerButtonText}>Void</Text></Pressable>
                      </>
                    ) : <Text style={styles.hint}>Void transactions are read-only.</Text>}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Type</Text>
                  <View style={styles.segmentRow}>
                    {(['income', 'expense'] as const).map((item) => {
                      const active = direction === item;
                      return <Pressable key={item} onPress={() => setDirection(item)} style={[styles.segment, active && styles.segmentSelected]}>
                        <Text style={[styles.segmentText, active && styles.segmentTextSelected]}>{item === 'income' ? 'Income' : 'Expense'}</Text>
                      </Pressable>;
                    })}
                  </View>
                  <Text style={styles.fieldLabel}>Amount (IDR)</Text>
                  <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="250000" placeholderTextColor={theme.colors.muted} style={styles.input} />
                  <ResponsiveGrid gap={12}>
                    <View style={styles.field}><Text style={styles.fieldLabel}>Category *</Text><TextInput value={category} onChangeText={setCategory} placeholder="Sales" placeholderTextColor={theme.colors.muted} style={styles.input} /></View>
                    <View style={styles.field}><Text style={styles.fieldLabel}>Date *</Text><TextInput value={occurredDate} onChangeText={setOccurredDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.muted} style={styles.input} /></View>
                  </ResponsiveGrid>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput value={description} onChangeText={setDescription} placeholder="Optional description" placeholderTextColor={theme.colors.muted} style={[styles.input, styles.textArea]} multiline />
                  <Text style={styles.fieldLabel}>Reference</Text>
                  <TextInput value={reference} onChangeText={setReference} placeholder="Invoice or receipt reference" placeholderTextColor={theme.colors.muted} style={styles.input} />
                  {formError ? <View style={styles.formAlert}><Text style={styles.formAlertText}>{formError}</Text></View> : null}
                  <View style={styles.formActions}>
                    <Pressable disabled={submitting} onPress={closeModal} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable>
                    <Pressable disabled={submitting} onPress={() => void submit()} style={styles.primaryButton}>
                      {submitting ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>{mode === 'edit' ? 'Save changes' : 'Save transaction'}</Text>}
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
  filterBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { minHeight: 38, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  filterChipTextActive: { color: theme.colors.surface },
  pagination: { minHeight: 64, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
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
  transactionRow: { minHeight: 76, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  transactionMain: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  transactionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text },
  transactionAmount: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  expenseAmount: { color: theme.colors.muted },
  directionBadge: { minWidth: 32, height: 24, paddingHorizontal: 7, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  expenseBadge: { opacity: 0.65 },
  directionBadgeText: { fontSize: 10, fontWeight: '800', color: theme.colors.surface },
  voidLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.muted },
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
  textArea: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, minHeight: 44, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  segmentText: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  segmentTextSelected: { color: theme.colors.surface },
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
