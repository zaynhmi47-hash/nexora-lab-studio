from services.muslim.gamification.achievements import unlocked_achievements


def test_first_xp_unlocks_first_steps() -> None:
    result = unlocked_achievements(xp=1, streak=0)
    assert [item.key for item in result] == ["first_steps"]


def test_streak_achievement_unlocks() -> None:
    result = unlocked_achievements(xp=0, streak=7)
    assert [item.key for item in result] == ["streak_7"]


def test_already_unlocked_is_skipped() -> None:
    result = unlocked_achievements(
        xp=100,
        streak=7,
        already_unlocked={"first_steps", "xp_100"},
    )
    assert [item.key for item in result] == ["streak_7"]
