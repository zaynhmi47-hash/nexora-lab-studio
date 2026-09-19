import type { GamificationEventType, XPRewardPolicy } from "../types/gamification";

export const XP_REWARD_POLICIES: Record<GamificationEventType, XPRewardPolicy> = {
  LESSON_COMPLETED: {
    eventType: "LESSON_COMPLETED",
    baseXP: 20,
    repeatable: true,
    idempotent: true,
    maxPerDay: 20,
  },
  QUIZ_COMPLETED: {
    eventType: "QUIZ_COMPLETED",
    baseXP: 15,
    repeatable: true,
    idempotent: true,
    maxPerDay: 20,
  },
  TAJWID_PRACTICE_COMPLETED: {
    eventType: "TAJWID_PRACTICE_COMPLETED",
    baseXP: 10,
    repeatable: true,
    idempotent: true,
    maxPerDay: 10,
  },
  TAJWID_ASSESSMENT_COMPLETED: {
    eventType: "TAJWID_ASSESSMENT_COMPLETED",
    baseXP: 50,
    repeatable: false,
    idempotent: true,
  },
  ARABIC_LESSON_COMPLETED: {
    eventType: "ARABIC_LESSON_COMPLETED",
    baseXP: 20,
    repeatable: true,
    idempotent: true,
    maxPerDay: 20,
  },
  DAILY_ACTIVITY_COMPLETED: {
    eventType: "DAILY_ACTIVITY_COMPLETED",
    baseXP: 25,
    repeatable: false,
    idempotent: true,
    maxPerDay: 1,
  },
  STREAK_MILESTONE: {
    eventType: "STREAK_MILESTONE",
    baseXP: 50,
    repeatable: false,
    idempotent: true,
  },
  DAILY_REWARD_CLAIMED: {
    eventType: "DAILY_REWARD_CLAIMED",
    baseXP: 30,
    repeatable: false,
    idempotent: true,
    maxPerDay: 1,
  },
};

export function getXPRewardPolicy(
  eventType: GamificationEventType,
): XPRewardPolicy {
  return XP_REWARD_POLICIES[eventType];
}
