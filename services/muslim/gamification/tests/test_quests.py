from services.muslim.gamification.quests import build_quest_progress


def test_daily_quest_progress_is_capped_at_target() -> None:
    result = build_quest_progress(
        activity_counts={"daily_quiz": 4},
    )

    quiz = next(item for item in result if item.key == "daily_quiz")
    assert quiz.progress == 1
    assert quiz.completed is True


def test_claimed_quest_is_marked() -> None:
    result = build_quest_progress(
        activity_counts={"daily_learn": 1},
        reward_claimed={"daily_learn"},
    )

    quest = next(item for item in result if item.key == "daily_learn")
    assert quest.completed is True
    assert quest.reward_claimed is True
