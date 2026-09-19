export type FinanceBudgetStatus = 'active' | 'archived';

export interface FinanceBudget {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  amountMinor: number;
  currency: 'IDR';
  startDate: string;
  endDate: string;
  status: FinanceBudgetStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetInput {
  name: string;
  category: string;
  amountMinor: number;
  currency?: 'IDR';
  startDate: string;
  endDate: string;
  metadata?: Record<string, unknown>;
}

export type UpdateBudgetInput = Partial<CreateBudgetInput>;

export interface BudgetListFilters {
  status?: FinanceBudgetStatus;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface BudgetListResult {
  budgets: FinanceBudget[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
