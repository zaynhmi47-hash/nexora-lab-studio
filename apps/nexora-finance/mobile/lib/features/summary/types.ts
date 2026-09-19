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
