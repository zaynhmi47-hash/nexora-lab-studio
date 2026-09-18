import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useTransactions } from '@/lib/features/transactions';
import type { TransactionDirection } from '@/lib/features/transactions';

const formatIdr = (amountMinor: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amountMinor);

const todayInput = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createIdempotencyKey = () =>
  `finance-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function TransactionsScreen() {
  const { isMobile } = useResponsive();
  const { transactions, loading, error, create, refresh, ready } = useTransactions();
  const [modalVisible, setModalVisible] = useState(false);
  const [direction, setDirection] = useState<TransactionDirection>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [occurredDate, setOccurredDate] = useState(todayInput());
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const postedTransactions = useMemo(
    () => transactions.filter((item) => item.status === 'posted'),
    [transactions],
  );

  const resetForm = () => {
    setDirection('income');
    setAmount('');
    setCategory('');
    setDescription('');
    setOccurredDate(todayInput());
    setReference('');
    setFormError(null);
  };

  const closeForm = () => {
    if (submitting) return;
    setModalVisible(false);
    resetForm();
  };

  const submit = async () => {
    const normalizedAmount = amount.replace(/[^0-9]/g, '');
    const amountMinor = Number(normalizedAmount);

    if (!normalizedAmount || !Number.isSafeInteger(amountMinor) || amountMinor < 1) {
      setFormError('Enter a valid amount greater than 0.');
      return;
    }
    if (!category.trim()) {
      setFormError('Category is required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredDate)) {
      setFormError('Date must use YYYY-MM-DD format.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await create({
        direction,
        amountMinor,
        currency: 'IDR',
        category: category.trim(),
        description: description.trim(),
        occurredAt: `${occurredDate}T12:00:00`,
        reference: reference.trim(),
        idempotencyKey: createIdempotencyKey(),
      });
      setModalVisible(false);
      resetForm();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Unable to create transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveScaffold>
      <ResponsiveContainer maxWidth={1200}>
        <ScrollView contentContainerStyle={styles.content}>
          <AdaptiveHeader
            title="Transactions"
            subtitle="Track income and expenses in your active organization."
          />

          <View style={styles.toolbar}>
            <View style={styles.toolbarCopy}>
              <Text style={styles.sectionTitle}>All transactions</Text>
              <Text style={styles.hint}>
                {postedTransactions.length} posted transaction{postedTransactions.length === 1 ? '' : 's'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add transaction"
              disabled={!ready}
              onPress={() => {
                setFormError(null);
                setModalVisible(true);
              }}
              style={[styles.primaryButton, !ready && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>+ Add transaction</Text>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.alert}>
              <Text style={styles.alertTitle}>Unable to load transactions</Text>
              <Text style={styles.hint}>{error.message}</Text>
              <Pressable onPress={() => void refresh()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {loading && transactions.length === 0 ? (
            <View style={styles.stateCard}>
              <ActivityIndicator />
              <Text style={styles.hint}>Loading transactions…</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.hint}>
                Add your first income or expense. It will be saved directly to the active organization.
              </Text>
              <Pressable
                disabled={!ready}
                onPress={() => setModalVisible(true)}
                style={[styles.primaryButton, !ready && styles.disabledButton]}
              >
                <Text style={styles.primaryButtonText}>Add your first transaction</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listCard}>
              {transactions.map((item) => (
                <View key={item.id} style={styles.transactionRow}>
                  <View style={styles.transactionMain}>
                    <View style={styles.titleRow}>
                      <View style={[styles.directionBadge, item.direction === 'expense' && styles.expenseBadge]}>
                        <Text style={styles.directionBadgeText}>
                          {item.direction === 'income' ? 'IN' : 'OUT'}
                        </Text>
                      </View>
                      <Text style={styles.transactionTitle} numberOfLines={1}>
                        {item.description || item.category}
                      </Text>
                    </View>
                    <Text style={styles.hint}>
                      {item.category} · {new Date(item.occurredAt).toLocaleDateString('id-ID')}
                      {item.reference ? ` · ${item.reference}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.transactionAmount, item.direction === 'expense' && styles.expenseAmount]}>
                    {item.direction === 'expense' ? '−' : '+'}
                    {formatIdr(item.amountMinor)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </ResponsiveContainer>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, isMobile ? styles.modalMobile : styles.modalDesktop]}>
            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <View style={styles.toolbarCopy}>
                  <Text style={styles.modalTitle}>Add transaction</Text>
                  <Text style={styles.hint}>Create an income or expense for the active organization.</Text>
                </View>
                <Pressable disabled={submitting} onPress={closeForm} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.segmentRow}>
                {(['income', 'expense'] as const).map((item) => {
                  const selected = direction === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setDirection(item)}
                      style={[styles.segment, selected && styles.segmentSelected]}
                    >
                      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                        {item === 'income' ? 'Income' : 'Expense'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Amount (IDR)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="250000"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
              />

              <ResponsiveGrid gap={12}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Category *</Text>
                  <TextInput
                    value={category}
                    onChangeText={setCategory}
                    placeholder="Sales"
                    placeholderTextColor={theme.colors.muted}
                    style={styles.input}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Date *</Text>
                  <TextInput
                    value={occurredDate}
                    onChangeText={setOccurredDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.muted}
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </ResponsiveGrid>

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional transaction description"
                placeholderTextColor={theme.colors.muted}
                style={[styles.input, styles.textArea]}
                multiline
              />

              <Text style={styles.fieldLabel}>Reference</Text>
              <TextInput
                value={reference}
                onChangeText={setReference}
                placeholder="Invoice, receipt, or other reference"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
              />

              {formError ? (
                <View style={styles.formAlert}>
                  <Text style={styles.formAlertText}>{formError}</Text>
                </View>
              ) : null}

              <View style={styles.formActions}>
                <Pressable disabled={submitting} onPress={closeForm} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable disabled={submitting} onPress={() => void submit()} style={styles.primaryButton}>
                  {submitting ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.primaryButtonText}>Save transaction</Text>}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ResponsiveScaffold>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 40, gap: 16 },
  toolbar: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toolbarCopy: { flex: 1, gap: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  hint: { fontSize: 14, lineHeight: 20, color: theme.colors.muted },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: theme.colors.surface, fontSize: 14, fontWeight: '700' },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  disabledButton: { opacity: 0.5 },
  alert: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  alertTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  stateCard: {
    minHeight: 180,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  listCard: {
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  transactionRow: {
    minHeight: 76,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  transactionMain: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  transactionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text },
  transactionAmount: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  expenseAmount: { color: theme.colors.muted },
  directionBadge: {
    minWidth: 32,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseBadge: { opacity: 0.65 },
  directionBadgeText: { fontSize: 10, fontWeight: '800', color: theme.colors.surface },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: theme.colors.surface,
  },
  modalMobile: { width: '100%' },
  modalDesktop: {
    alignSelf: 'center',
    width: 'min(720px, 92%)',
    borderRadius: 24,
    marginBottom: 24,
  },
  formContent: { padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 4 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 28, lineHeight: 30, color: theme.colors.muted },
  field: { flex: 1, gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  input: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontSize: 15,
  },
  textArea: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  segmentText: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  segmentTextSelected: { color: theme.colors.surface },
  formAlert: {
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  formAlertText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
});
