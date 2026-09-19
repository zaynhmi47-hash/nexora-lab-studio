from services.muslim.gamification.leveling import level_for_xp, xp_progress_for_level


def test_level_one() -> None:
    assert level_for_xp(0) == 1
    assert level_for_xp(99) == 1


def test_level_two_boundary() -> None:
    assert level_for_xp(100) == 2


def test_progress() -> None:
    current, required = xp_progress_for_level(150)
    assert current == 50
    assert required == 200
