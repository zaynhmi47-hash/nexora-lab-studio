import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useTransactionApi } from './transactionApi';
import type { CreateTransactionInput, FinanceTransaction } from './types';

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

  useEffect(() => { void refresh(); }, [refresh]);

  return { transactions, loading, error, refresh, create, ready: api.ready };
}
