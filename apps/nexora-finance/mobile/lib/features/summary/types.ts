export interface FinanceSummary {
  startDate: string;
  endDate: string;
  currency: 'IDR';
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netCashFlowMinor: number;
  transactionCount: number;
}

export interface FinanceCategoryBreakdown {
  category: string;
  direction: 'income' | 'expense';
  amountMinor: number;
  transactionCount: number;
}

export interface FinanceComparisonMetric {
  current: number;
  previous: number;
  delta: number;
  percentageChange: number | null;
}

export interface FinanceComparison {
  currentStartDate: string;
  currentEndDate: string;
  previousStartDate: string;
  previousEndDate: string;
  currency: 'IDR';
  income: FinanceComparisonMetric;
  expense: FinanceComparisonMetric;
  netCashFlow: FinanceComparisonMetric;
  transactionCount: FinanceComparisonMetric;
}

export interface FinanceProfitLossLine {
  category: string;
  amountMinor: number;
  transactionCount: number;
}

export interface FinanceProfitLoss {
  startDate: string;
  endDate: string;
  currency: 'IDR';
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  netProfitMinor: number;
  incomeLines: FinanceProfitLossLine[];
  expenseLines: FinanceProfitLossLine[];
}

export interface FinanceCashFlowLine {
  category: string;
  amountMinor: number;
  transactionCount: number;
}

export interface FinanceCashFlow {
  startDate: string;
  endDate: string;
  currency: 'IDR';
  cashInflowMinor: number;
  cashOutflowMinor: number;
  netCashFlowMinor: number;
  transactionCount: number;
  inflowLines: FinanceCashFlowLine[];
  outflowLines: FinanceCashFlowLine[];
}

export type FinanceInsightSeverity = 'info' | 'warning';

export interface FinanceInsight {
  code: string;
  severity: FinanceInsightSeverity;
  title: string;
  message: string;
  metric: string;
  valueMinor: number | null;
  deltaMinor: number | null;
  percentageChange: number | null;
  category: string | null;
}

export interface FinanceInsights {
  startDate: string;
  endDate: string;
  currency: 'IDR';
  insights: FinanceInsight[];
}

export type FinanceBudgetStatus = 'on_track' | 'near_limit' | 'over_budget';

export interface FinanceBudgetSummaryItem {
  budgetId: string;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  budgetMinor: number;
  actualMinor: number;
  remainingMinor: number;
  utilizationPercentage: number | null;
  status: FinanceBudgetStatus;
  transactionCount: number;
}

export interface FinanceBudgetSummary {
  startDate: string;
  endDate: string;
  currency: 'IDR';
  totalBudgetMinor: number;
  totalActualMinor: number;
  totalRemainingMinor: number;
  overallUtilizationPercentage: number | null;
  overBudgetCount: number;
  budgets: FinanceBudgetSummaryItem[];
}

export type FinancePlanningStatus =
  | 'on_track'
  | 'saving_gap'
  | 'budget_overage'
  | 'over_planned';

export interface FinancePlanningBudgetItem {
  budgetId: string;
  name: string;
  category: string;
  budgetMinor: number;
  actualMinor: number;
  remainingMinor: number;
  utilizationPercentage: number | null;
  status: FinanceBudgetStatus;
  transactionCount: number;
}

export type FinancePlanningGoalStatus = 'active' | 'overdue' | 'completed';

export interface FinancePlanningGoalItem {
  goalId: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  remainingAmountMinor: number;
  progressPercentage: number | null;
  startDate: string;
  targetDate: string;
  plannedSavingMinor: number;
  actualContributionMinor: number;
  savingGapMinor: number;
  daysRemaining: number;
  status: FinancePlanningGoalStatus;
}

export interface FinancePlanningSummary {
  startDate: string;
  endDate: string;
  currency: 'IDR';
  actualIncomeMinor: number;
  actualExpenseMinor: number;
  actualNetCashFlowMinor: number;
  plannedSpendingMinor: number;
  plannedSavingMinor: number;
  actualGoalContributionMinor: number;
  plannedSpendingGapMinor: number;
  savingGapMinor: number;
  projectedCashAfterPlansMinor: number;
  activeGoalCount: number;
  overBudgetCount: number;
  planningStatus: FinancePlanningStatus;
  budgetItems: FinancePlanningBudgetItem[];
  goalItems: FinancePlanningGoalItem[];
}
