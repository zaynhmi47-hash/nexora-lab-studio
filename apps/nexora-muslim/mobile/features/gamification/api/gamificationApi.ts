import type {
  GamificationEvent,
  XPBalance,
  XPRewardResult,
} from "../types/gamification";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export interface GamificationProfile {
  xp: number;
  level: number;
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string | null;
  };
  quests: Array<{
    key: string;
    progress: number;
    target: number;
    completed: boolean;
    rewardClaimed: boolean;
  }>;
  achievements: string[];
  dailyReward: {
    claimed: boolean;
    date: string | null;
  };
  streakMilestones: number[];
  timezone: string;
}

export interface GamificationEventResponse {
  success: boolean;
  reward: XPRewardResult;
  gamification: GamificationProfile & {
    newAchievements: Array<{
      key: string;
      name: string;
      description: string;
    }>;
  };
  rewards: Array<{
    awarded: boolean;
    xp: number;
    reason: string | null;
  }>;
}

function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is required for server-authoritative gamification.",
    );
  }

  return API_BASE_URL.replace(/\/$/, "");
}

async function request<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${requireApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Gamification request failed (${response.status}): ${body || "unknown error"}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function awardXP(
  event: GamificationEvent,
  accessToken: string,
): Promise<GamificationEventResponse> {
  return request<GamificationEventResponse>("/gamification/events/", accessToken, {
    method: "POST",
    headers: {
      "Idempotency-Key": event.eventId,
    },
    body: JSON.stringify(event),
  });
}

export async function getGamificationProfile(
  accessToken: string,
): Promise<{ success: true; gamification: GamificationProfile }> {
  return request("/gamification/profile/", accessToken);
}

export async function claimDailyReward(
  accessToken: string,
): Promise<GamificationEventResponse> {
  return request("/gamification/daily-reward/claim/", accessToken, {
    method: "POST",
  });
}

export async function setGamificationTimezone(
  timezoneName: string,
  accessToken: string,
): Promise<{ success: true; timezone: string }> {
  return request("/gamification/timezone/", accessToken, {
    method: "POST",
    body: JSON.stringify({ timezone: timezoneName }),
  });
}
