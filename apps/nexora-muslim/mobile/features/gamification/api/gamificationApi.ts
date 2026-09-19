import type {
  GamificationEvent,
  XPBalance,
  XPRewardResult,
} from "../types/gamification";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is required for server-authoritative gamification.",
    );
  }

  return API_BASE_URL.replace(/\\/$/, "");
}

export async function awardXP(
  event: GamificationEvent,
  accessToken: string,
): Promise<{ reward: XPRewardResult; balance: XPBalance }> {
  const response = await fetch(`${requireApiBaseUrl()}/gamification/events/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Idempotency-Key": event.eventId,
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Gamification request failed (${response.status}): ${body || "unknown error"}`,
    );
  }

  return response.json();
}
