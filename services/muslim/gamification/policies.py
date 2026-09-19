from .domain import GamificationEventType, RewardPolicy


XP_REWARD_POLICIES: dict[GamificationEventType, RewardPolicy] = {
    GamificationEventType.LESSON_COMPLETED: RewardPolicy(
        GamificationEventType.LESSON_COMPLETED, 20, True, max_per_day=20
    ),
    GamificationEventType.QUIZ_COMPLETED: RewardPolicy(
        GamificationEventType.QUIZ_COMPLETED, 15, True, max_per_day=20
    ),
    GamificationEventType.TAJWID_PRACTICE_COMPLETED: RewardPolicy(
        GamificationEventType.TAJWID_PRACTICE_COMPLETED, 10, True, max_per_day=10
    ),
    GamificationEventType.TAJWID_ASSESSMENT_COMPLETED: RewardPolicy(
        GamificationEventType.TAJWID_ASSESSMENT_COMPLETED, 50, False
    ),
    GamificationEventType.ARABIC_LESSON_COMPLETED: RewardPolicy(
        GamificationEventType.ARABIC_LESSON_COMPLETED, 20, True, max_per_day=20
    ),
    GamificationEventType.DAILY_ACTIVITY_COMPLETED: RewardPolicy(
        GamificationEventType.DAILY_ACTIVITY_COMPLETED, 25, False, max_per_day=1
    ),
    GamificationEventType.STREAK_MILESTONE: RewardPolicy(
        GamificationEventType.STREAK_MILESTONE, 50, False
    ),
    GamificationEventType.DAILY_REWARD_CLAIMED: RewardPolicy(
        GamificationEventType.DAILY_REWARD_CLAIMED, 30, False, max_per_day=1
    ),
    # Quest rewards are created by the server after a qualifying activity.
    GamificationEventType.DAILY_QUEST_COMPLETED: RewardPolicy(
        GamificationEventType.DAILY_QUEST_COMPLETED, 25, False
    ),
}


def get_policy(event_type: GamificationEventType) -> RewardPolicy:
    return XP_REWARD_POLICIES[event_type]
