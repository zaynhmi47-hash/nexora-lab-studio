import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useTransactionApi } from './transactionApi';
import type { CreateTransactionInput, FinanceTransaction } from './types';
import type { UpdateTransactionInput } from './transactionApi';

export function useTransactions() {
  const { status } = useAuth();
  const api = useTransactionApi();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (status !== 'authenticated' || !api.ready) {
      setTransactions([]);
      return;
    }
    setLoading(true); setError(null);
    try { setTransactions(await api.listTransactions()); }
    catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load transactions.'));
    } finally { setLoading(false); }
  }, [api, status]);

  const create = useCallback(async (input: CreateTransactionInput) => {
    setError(null);
    const created = await api.createTransaction(input);
    setTransactions((current) => [created, ...current.filter((item) => item.id !== created.id)]);
    return created;
  }, [api]);

  const update = useCallback(async (id: string, input: UpdateTransactionInput) => {
    setError(null);
    const updated = await api.updateTransaction(id, input);
    setTransactions((current) => current.map((item) => item.id === updated.id ? updated : item));
    return updated;
  }, [api]);

  const voidTransaction = useCallback(async (id: string) => {
    setError(null);
    const voided = await api.voidTransaction(id);
    setTransactions((current) => current.map((item) => item.id === voided.id ? voided : item));
    return voided;
  }, [api]);

  const getTransaction = useCallback(async (id: string) => {
    setError(null);
    return api.getTransaction(id);
  }, [api]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { transactions, loading, error, refresh, create, update, voidTransaction, getTransaction, ready: api.ready };
}
