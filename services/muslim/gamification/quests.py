from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable


@dataclass(frozen=True, slots=True)
class DailyQuest:
    key: str
    name: str
    description: str
    target: int
    xp_reward: int


DAILY_QUESTS: tuple[DailyQuest, ...] = (
    DailyQuest(
        key="daily_learn",
        name="Daily Learning",
        description="Complete 1 learning activity today.",
        target=1,
        xp_reward=25,
    ),
    DailyQuest(
        key="daily_quiz",
        name="Daily Quiz",
        description="Complete 1 quiz today.",
        target=1,
        xp_reward=20,
    ),
    DailyQuest(
        key="daily_tajwid",
        name="Tajwid Practice",
        description="Complete 1 Tajwid practice today.",
        target=1,
        xp_reward=20,
    ),
)


@dataclass(frozen=True, slots=True)
class QuestProgress:
    key: str
    progress: int
    target: int
    completed: bool
    reward_claimed: bool


def build_quest_progress(
    *,
    activity_counts: dict[str, int],
    reward_claimed: Iterable[str] = (),
) -> list[QuestProgress]:
    claimed = set(reward_claimed)
    result: list[QuestProgress] = []

    for quest in DAILY_QUESTS:
        progress = min(activity_counts.get(quest.key, 0), quest.target)
        result.append(
            QuestProgress(
                key=quest.key,
                progress=progress,
                target=quest.target,
                completed=progress >= quest.target,
                reward_claimed=quest.key in claimed,
            )
        )

    return result
