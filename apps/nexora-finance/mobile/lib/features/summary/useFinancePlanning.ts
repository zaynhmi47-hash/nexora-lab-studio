import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { useTenantApi } from '@/lib/api/tenant';
import type { FinancePlanningSummary } from './types';

interface ApiPlanningBudgetItem {
  budget_id: string;
  name: string;
  category: string;
  budget_minor: number;
  actual_minor: number;
  remaining_minor: number;
  utilization_percentage: number | null;
  status: FinancePlanningSummary['budgetItems'][number]['status'];
  transaction_count: number;
}

interface ApiPlanningGoalItem {
  goal_id: string;
  name: string;
  target_amount_minor: number;
  current_amount_minor: number;
  remaining_amount_minor: number;
  progress_percentage: number | null;
  start_date: string;
  target_date: string;
  planned_saving_minor: number;
  saving_gap_minor: number;
  days_remaining: number;
  status: FinancePlanningSummary['goalItems'][number]['status'];
}

interface ApiPlanningSummary {
  start_date: string;
  end_date: string;
  currency: 'IDR';
  actual_income_minor: number;
  actual_expense_minor: number;
  actual_net_cash_flow_minor: number;
  planned_spending_minor: number;
  planned_saving_minor: number;
  actual_goal_contribution_minor: number;
  planned_spending_gap_minor: number;
  saving_gap_minor: number;
  projected_cash_after_plans_minor: number;
  active_goal_count: number;
  over_budget_count: number;
  planning_status: FinancePlanningSummary['planningStatus'];
  budget_items: ApiPlanningBudgetItem[];
  goal_items: ApiPlanningGoalItem[];
}

const mapSummary = (item: ApiPlanningSummary): FinancePlanningSummary => ({
  startDate: item.start_date,
  endDate: item.end_date,
  currency: item.currency,
  actualIncomeMinor: item.actual_income_minor,
  actualExpenseMinor: item.actual_expense_minor,
  actualNetCashFlowMinor: item.actual_net_cash_flow_minor,
  plannedSpendingMinor: item.planned_spending_minor,
  plannedSavingMinor: item.planned_saving_minor,
  actualGoalContributionMinor: item.actual_goal_contribution_minor,
  plannedSpendingGapMinor: item.planned_spending_gap_minor,
  savingGapMinor: item.saving_gap_minor,
  projectedCashAfterPlansMinor: item.projected_cash_after_plans_minor,
  activeGoalCount: item.active_goal_count,
  overBudgetCount: item.over_budget_count,
  planningStatus: item.planning_status,
  budgetItems: item.budget_items.map((budget) => ({
    budgetId: budget.budget_id,
    name: budget.name,
    category: budget.category,
    budgetMinor: budget.budget_minor,
    actualMinor: budget.actual_minor,
    remainingMinor: budget.remaining_minor,
    utilizationPercentage: budget.utilization_percentage,
    status: budget.status,
    transactionCount: budget.transaction_count,
  })),
  goalItems: item.goal_items.map((goal) => ({
    goalId: goal.goal_id,
    name: goal.name,
    targetAmountMinor: goal.target_amount_minor,
    currentAmountMinor: goal.current_amount_minor,
    remainingAmountMinor: goal.remaining_amount_minor,
    progressPercentage: goal.progress_percentage,
    startDate: goal.start_date,
    targetDate: goal.target_date,
    plannedSavingMinor: goal.planned_saving_minor,
    savingGapMinor: goal.saving_gap_minor,
    daysRemaining: goal.days_remaining,
    status: goal.status,
  })),
});

export function useFinancePlanning(period?: { startDate?: string; endDate?: string }) {
  const { user, initializing } = useAuth();
  const tenantApi = useTenantApi();
  const [summary, setSummary] = useState<FinancePlanningSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startDate = period?.startDate;
  const endDate = period?.endDate;

  const refresh = useCallback(async () => {
    if (initializing || !user || !tenantApi.ready) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      const query = params.toString();
      const path = query
        ? '/finance/planning/summary/?' + query
        : '/finance/planning/summary/';
      const response = await tenantApi.request<ApiPlanningSummary>(path);
      setSummary(mapSummary(response.data));
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Unable to load finance planning.'));
    } finally {
      setLoading(false);
    }
  }, [endDate, initializing, startDate, tenantApi, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { summary, loading, error, refresh, ready: tenantApi.ready };
}
