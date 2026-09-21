import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useTenantApi } from '@/lib/api/tenant';
import type { FinanceProfitLoss } from './types';

interface ApiLine {
  category: string;
  amount_minor: number;
  transaction_count: number;
}

interface ApiProfitLoss {
  start_date: string;
  end_date: string;
  currency: 'IDR';
  total_income_minor: number;
  total_expense_minor: number;
  net_profit_minor: number;
  income_lines: ApiLine[];
  expense_lines: ApiLine[];
}

const mapLine = (line: ApiLine) => ({
  category: line.category,
  amountMinor: line.amount_minor,
  transactionCount: line.transaction_count,
});

const mapReport = (item: ApiProfitLoss): FinanceProfitLoss => ({
  startDate: item.start_date,
  endDate: item.end_date,
  currency: item.currency,
  totalIncomeMinor: item.total_income_minor,
  totalExpenseMinor: item.total_expense_minor,
  netProfitMinor: item.net_profit_minor,
  incomeLines: item.income_lines.map(mapLine),
  expenseLines: item.expense_lines.map(mapLine),
});

export function useFinanceProfitLoss(period?: { startDate?: string; endDate?: string }) {
  const { user, status } = useAuth();
  const tenantApi = useTenantApi();
  const [report, setReport] = useState<FinanceProfitLoss | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (status !== 'authenticated' || !user || !tenantApi.ready) {
      setReport(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (period?.startDate) params.set('start_date', period.startDate);
      if (period?.endDate) params.set('end_date', period.endDate);
      const query = params.toString();
      const path = query
        ? '/finance/reporting/profit-loss/?' + query
        : '/finance/reporting/profit-loss/';
      const response = await tenantApi.request<ApiProfitLoss>(path);
      setReport(mapReport(response.data));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Unable to load profit and loss report.'));
    } finally {
      setLoading(false);
    }
  }, [period?.startDate, period?.endDate, status, tenantApi, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { report, loading, error, refresh: load };
}
