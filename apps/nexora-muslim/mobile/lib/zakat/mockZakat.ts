import type { ZakatPort } from "./types";

export const mockZakat: ZakatPort = {
  history: async () => [],
  calculate: async (input) => {
    const assets = Number(input.assets || 0);
    const debts = Number(input.debts || 0);
    const nisab = Number(input.nisab || 0);
    const rate = Number(input.rate || "0.025");
    const amount = Math.max(0, assets - debts);
    const zakat = amount >= nisab ? amount * rate : 0;
    return {
      id: "mock",
      assets: String(assets),
      debts: String(debts),
      nisab: String(nisab),
      rate: String(rate),
      zakatableAmount: String(amount),
      zakatAmount: String(zakat),
      currency: input.currency || "IDR",
      createdAt: new Date().toISOString(),
    };
  },
};
