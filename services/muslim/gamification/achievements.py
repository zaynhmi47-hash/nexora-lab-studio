from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True, slots=True)
class AchievementDefinition:
    key: str
    name: str
    description: str
    xp_threshold: int | None = None
    streak_threshold: int | None = None


ACHIEVEMENTS: tuple[AchievementDefinition, ...] = (
    AchievementDefinition(
        key="first_steps",
        name="First Steps",
        description="Earn your first XP.",
        xp_threshold=1,
    ),
    AchievementDefinition(
        key="xp_100",
        name="Getting Started",
        description="Earn 100 total XP.",
        xp_threshold=100,
    ),
    AchievementDefinition(
        key="streak_7",
        name="7 Day Streak",
        description="Maintain a 7-day learning streak.",
        streak_threshold=7,
    ),
    AchievementDefinition(
        key="streak_30",
        name="30 Day Streak",
        description="Maintain a 30-day learning streak.",
        streak_threshold=30,
    ),
)


def unlocked_achievements(
    *,
    xp: int,
    streak: int,
    already_unlocked: Iterable[str] = (),
) -> list[AchievementDefinition]:
    unlocked = set(already_unlocked)
    result: list[AchievementDefinition] = []

    for achievement in ACHIEVEMENTS:
        if achievement.key in unlocked:
            continue

        xp_ok = (
            achievement.xp_threshold is None
            or xp >= achievement.xp_threshold
        )
        streak_ok = (
            achievement.streak_threshold is None
            or streak >= achievement.streak_threshold
        )

        if xp_ok and streak_ok:
            result.append(achievement)

    return result
