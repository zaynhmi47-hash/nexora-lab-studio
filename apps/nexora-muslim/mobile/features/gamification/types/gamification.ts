export type GamificationEventType =
  | "LESSON_COMPLETED"
  | "QUIZ_COMPLETED"
  | "TAJWID_PRACTICE_COMPLETED"
  | "TAJWID_ASSESSMENT_COMPLETED"
  | "ARABIC_LESSON_COMPLETED"
  | "DAILY_ACTIVITY_COMPLETED"
  | "STREAK_MILESTONE"
  | "DAILY_REWARD_CLAIMED";

export type RewardRejectionReason =
  | "ALREADY_PROCESSED"
  | "DAILY_LIMIT_REACHED"
  | "ACTIVITY_NOT_ELIGIBLE"
  | "COOLDOWN_ACTIVE";

export interface GamificationEvent {
  eventId: string;
  eventType: GamificationEventType;
  activityId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface XPRewardPolicy {
  eventType: GamificationEventType;
  baseXP: number;
  repeatable: boolean;
  idempotent: boolean;
  maxPerDay?: number;
  cooldownSeconds?: number;
}

export interface XPRewardResult {
  awarded: boolean;
  xp: number;
  reason?: RewardRejectionReason;
}

export interface XPBalance {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
}
