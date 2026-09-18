export type ZakatCalculation = {
  id: string;
  assets: string;
  debts: string;
  nisab: string;
  rate: string;
  zakatableAmount: string;
  zakatAmount: string;
  currency: string;
  createdAt: string;
};

export interface ZakatPort {
  history(): Promise<ZakatCalculation[]>;
  calculate(input: {
    assets: string;
    debts: string;
    nisab: string;
    currency?: string;
    rate?: string;
  }): Promise<ZakatCalculation>;
}
