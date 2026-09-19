from datetime import date

from services.muslim.gamification.state_repository import (
    InMemoryGamificationStateRepository,
    UserGamificationState,
)


def test_missing_user_has_zero_server_state() -> None:
    repository = InMemoryGamificationStateRepository()

    state = repository.get("user-1")

    assert state.xp == 0
    assert state.current_streak == 0
    assert state.longest_streak == 0
    assert state.last_activity_date is None


def test_state_is_persisted_per_user() -> None:
    repository = InMemoryGamificationStateRepository()
    repository.save(
        UserGamificationState(
            user_id="user-1",
            xp=120,
            current_streak=4,
            longest_streak=7,
            last_activity_date=date(2026, 9, 19),
            unlocked_achievement_keys=("first_steps",),
        )
    )

    state = repository.get("user-1")

    assert state.xp == 120
    assert state.current_streak == 4
    assert state.longest_streak == 7
    assert state.unlocked_achievement_keys == ("first_steps",)
