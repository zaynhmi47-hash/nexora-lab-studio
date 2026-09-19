import { useCallback } from 'react';

import { useTenantApi } from '@/lib/api/tenant';
import type { FinanceCategoryBreakdown, FinanceSummary } from './types';

interface ApiFinanceSummary {
  start_date: string;
  end_date: string;
  currency: 'IDR';
  total_income_minor: number;
  total_expense_minor: number;
  net_cash_flow_minor: number;
  transaction_count: number;
}

interface ApiFinanceCategoryBreakdown {
  category: string;
  direction: 'income' | 'expense';
  amount_minor: number;
  transaction_count: number;
}

function mapSummary(item: ApiFinanceSummary): FinanceSummary {
  return {
    startDate: item.start_date,
    endDate: item.end_date,
    currency: item.currency,
    totalIncomeMinor: item.total_income_minor,
    totalExpenseMinor: item.total_expense_minor,
    netCashFlowMinor: item.net_cash_flow_minor,
    transactionCount: item.transaction_count,
  };
}

function mapBreakdown(item: ApiFinanceCategoryBreakdown): FinanceCategoryBreakdown {
  return {
    category: item.category,
    direction: item.direction,
    amountMinor: item.amount_minor,
    transactionCount: item.transaction_count,
  };
}

export function useFinanceSummaryApi() {
  const tenantApi = useTenantApi();

  const getSummary = useCallback(async (period?: { startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (period?.startDate) params.set('start_date', period.startDate);
    if (period?.endDate) params.set('end_date', period.endDate);
    const query = params.toString();
    const path = query ? '/finance/summary/?' + query : '/finance/summary/';
    const response = await tenantApi.request<ApiFinanceSummary>(path);
    return mapSummary(response.data);
  }, [tenantApi]);

  const getCategoryBreakdown = useCallback(async (period?: { startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (period?.startDate) params.set('start_date', period.startDate);
    if (period?.endDate) params.set('end_date', period.endDate);
    const query = params.toString();
    const path = query
      ? '/finance/reporting/category-breakdown/?' + query
      : '/finance/reporting/category-breakdown/';
    const response = await tenantApi.request<ApiFinanceCategoryBreakdown[]>(path);
    return response.data.map(mapBreakdown);
  }, [tenantApi]);

  return { ...tenantApi, getSummary, getCategoryBreakdown };
}
