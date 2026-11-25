import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useTransactionApi, type TransactionListFilters, type UpdateTransactionInput } from './transactionApi';
import type { CreateTransactionInput, FinanceTransaction } from './types';

export function useTransactions(filters: TransactionListFilters = {}) {
  const { status } = useAuth();
  const api = useTransactionApi();
  const requestRef = useRef(0);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [dataOrganizationId, setDataOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pageInfo, setPageInfo] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    const requestedOrganizationId = api.organizationId;
    if (status !== 'authenticated' || !api.ready || !requestedOrganizationId) {
      setTransactions([]);
      setDataOrganizationId(null);
      setPageInfo({ page: 1, pageSize: filters.pageSize ?? 20, total: 0, totalPages: 1 });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.listTransactions(filters);
      if (requestId !== requestRef.current || api.organizationId !== requestedOrganizationId) return;
      setTransactions(result.transactions);
      setDataOrganizationId(requestedOrganizationId);
      setPageInfo({ page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages });
    } catch (cause) {
      if (requestId === requestRef.current && api.organizationId === requestedOrganizationId) {
        setError(cause instanceof Error ? cause : new Error('Failed to load transactions.'));
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [api, filters.direction, filters.endDate, filters.page, filters.pageSize, filters.startDate, filters.status, status]);

  const create = useCallback(async (input: CreateTransactionInput) => { setError(null); const value = await api.createTransaction(input); await refresh(); return value; }, [api, refresh]);
  const update = useCallback(async (id: string, input: UpdateTransactionInput) => { setError(null); const value = await api.updateTransaction(id, input); await refresh(); return value; }, [api, refresh]);
  const voidTransaction = useCallback(async (id: string) => { setError(null); const value = await api.voidTransaction(id); await refresh(); return value; }, [api, refresh]);
  const getTransaction = useCallback(async (id: string) => { setError(null); return api.getTransaction(id); }, [api]);

  useEffect(() => {
    void refresh();
    return () => { requestRef.current += 1; };
  }, [refresh]);

  const visible = dataOrganizationId === api.organizationId ? transactions : [];
  return { transactions: visible, loading, error, refresh, create, update, voidTransaction, getTransaction, pageInfo: visible.length ? pageInfo : { page: 1, pageSize: filters.pageSize ?? 20, total: 0, totalPages: 1 }, ready: api.ready };
}
