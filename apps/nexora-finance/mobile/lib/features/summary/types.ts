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
