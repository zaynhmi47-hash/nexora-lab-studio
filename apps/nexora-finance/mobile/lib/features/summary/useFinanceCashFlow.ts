import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { useTenantApi } from '@/lib/api/tenant';
import type { FinanceCashFlow, FinanceCashFlowLine } from './types';

interface ApiLine {
  category: string;
  amount_minor: number;
  transaction_count: number;
}

interface ApiCashFlow {
  start_date: string;
  end_date: string;
  currency: 'IDR';
  cash_inflow_minor: number;
  cash_outflow_minor: number;
  net_cash_flow_minor: number;
  transaction_count: number;
  inflow_lines: ApiLine[];
  outflow_lines: ApiLine[];
}

const mapLine = (line: ApiLine): FinanceCashFlowLine => ({
  category: line.category,
  amountMinor: line.amount_minor,
  transactionCount: line.transaction_count,
});

const mapReport = (item: ApiCashFlow): FinanceCashFlow => ({
  startDate: item.start_date,
  endDate: item.end_date,
  currency: item.currency,
  cashInflowMinor: item.cash_inflow_minor,
  cashOutflowMinor: item.cash_outflow_minor,
  netCashFlowMinor: item.net_cash_flow_minor,
  transactionCount: item.transaction_count,
  inflowLines: item.inflow_lines.map(mapLine),
  outflowLines: item.outflow_lines.map(mapLine),
});

export function useFinanceCashFlow(period?: { startDate?: string; endDate?: string }) {
  const { user, initializing } = useAuth();
  const tenantApi = useTenantApi();
  const [cashFlow, setCashFlow] = useState<FinanceCashFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (initializing || !user || !tenantApi.isReady) {
      setCashFlow(null);
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
        ? '/finance/reporting/cash-flow/?' + query
        : '/finance/reporting/cash-flow/';
      const response = await tenantApi.request<ApiCashFlow>(path);
      setCashFlow(mapReport(response.data));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Unable to load cash flow report.'));
    } finally {
      setLoading(false);
    }
  }, [initializing, period?.startDate, period?.endDate, tenantApi, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { cashFlow, loading, error, refresh: load };
}
