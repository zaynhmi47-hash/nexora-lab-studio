import type { AuthSession } from "@/lib/auth/types";
import type { ZakatCalculation, ZakatPort } from "./types";

const baseUrl = process.env.EXPO_PUBLIC_NEXORA_CORE_URL ?? "http://localhost:8000";

export const nexoraCoreZakatRepository = (session: AuthSession): ZakatPort => ({
  history: async () => {
    const response = await fetch(baseUrl + "/api/v1/zakat/", {
      headers: { Authorization: "Bearer " + session.accessToken },
    });
    if (!response.ok) throw new Error("Zakat request failed.");
    return response.json() as Promise<ZakatCalculation[]>;
  },
  calculate: async (input) => {
    const response = await fetch(baseUrl + "/api/v1/zakat/", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + session.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Zakat calculation failed.");
    return response.json() as Promise<ZakatCalculation>;
  },
});
