from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from threading import RLock


@dataclass(frozen=True, slots=True)
class UserGamificationState:
    user_id: str
    xp: int
    current_streak: int
    longest_streak: int
    last_activity_date: date | None
    unlocked_achievement_keys: tuple[str, ...] = ()
    quest_date: date | None = None
    quest_activity_counts: tuple[tuple[str, int], ...] = ()
    claimed_quest_keys: tuple[str, ...] = ()
    daily_reward_date: date | None = None
    rewarded_streak_milestones: tuple[int, ...] = ()
    updated_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class GamificationStateRepository(ABC):
    """Persistence port for server-owned user gamification state."""

    @abstractmethod
    def get(self, user_id: str) -> UserGamificationState:
        raise NotImplementedError

    @abstractmethod
    def save(self, state: UserGamificationState) -> None:
        raise NotImplementedError


class InMemoryGamificationStateRepository(GamificationStateRepository):
    """Deterministic reference adapter for tests and local development."""

    def __init__(self) -> None:
        self._states: dict[str, UserGamificationState] = {}
        self._lock = RLock()

    def get(self, user_id: str) -> UserGamificationState:
        with self._lock:
            return self._states.get(
                user_id,
                UserGamificationState(user_id=user_id, xp=0, current_streak=0, longest_streak=0, last_activity_date=None),
            )

    def save(self, state: UserGamificationState) -> None:
        with self._lock:
            self._states[state.user_id] = state
