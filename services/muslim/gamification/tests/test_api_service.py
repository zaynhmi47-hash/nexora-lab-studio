from datetime import datetime, timezone

from services.muslim.gamification.api_service import GamificationAPIService
from services.muslim.gamification.application import XPRewardApplicationService
from services.muslim.gamification.processor import GamificationEventProcessor
from services.muslim.gamification.state_repository import InMemoryGamificationStateRepository
from services.muslim.gamification.storage import InMemoryPersistentXPLedgerRepository
from services.muslim.gamification.transaction import InMemoryGamificationTransactionManager


def build_api() -> GamificationAPIService:
    ledger = InMemoryPersistentXPLedgerRepository()
    state = InMemoryGamificationStateRepository()
    return GamificationAPIService(
        GamificationEventProcessor(
            XPRewardApplicationService(ledger),
            state,
            InMemoryGamificationTransactionManager(),
        )
    )


def payload(event_id: str = "lesson-1") -> dict[str, object]:
    return {
        "eventId": event_id,
        "eventType": "LESSON_COMPLETED",
        "occurredAt": datetime(2026, 9, 19, tzinfo=timezone.utc).isoformat(),
        "activityId": event_id,
    }


def test_api_uses_authenticated_user_not_payload_user() -> None:
    api = build_api()
    request = payload()
    request["userId"] = "attacker-user"

    result = api.handle_event(
        authenticated_user_id="user-1",
        payload=request,
    )

    assert result.status_code == 200
    assert result.body["reward"]["xp"] == 20


def test_api_returns_server_gamification_snapshot() -> None:
    api = build_api()

    result = api.handle_event(
        authenticated_user_id="user-1",
        payload=payload(),
    )

    assert result.status_code == 200
    assert result.body["gamification"]["xp"] == 20
    assert result.body["gamification"]["level"] == 1
    assert result.body["gamification"]["streak"]["current"] == 1
    assert result.body["gamification"]["newAchievements"][0]["key"] == "first_steps"


def test_api_duplicate_event_is_idempotent() -> None:
    api = build_api()

    first = api.handle_event(
        authenticated_user_id="user-1",
        payload=payload(),
    )
    second = api.handle_event(
        authenticated_user_id="user-1",
        payload=payload(),
    )

    assert first.body["reward"]["xp"] == 20
    assert second.body["reward"]["xp"] == 0
    assert second.body["reward"]["reason"] == "ALREADY_PROCESSED"
    assert second.body["gamification"]["xp"] == 20


def test_api_rejects_invalid_payload() -> None:
    api = build_api()

    result = api.handle_event(
        authenticated_user_id="user-1",
        payload={"eventType": "LESSON_COMPLETED"},
    )

    assert result.status_code == 400
    assert result.body["success"] is False


def test_api_rejects_missing_authenticated_user() -> None:
    api = build_api()

    result = api.handle_event(
        authenticated_user_id=" ",
        payload=payload(),
    )

    assert result.status_code == 401
    assert result.body["success"] is False


def test_api_exposes_quest_progress_and_bonus_rewards() -> None:
    api = build_api()

    result = api.handle_event(
        authenticated_user_id="user-1",
        payload=payload(),
    )

    assert result.status_code == 200
    assert result.body["gamification"]["quests"][0]["completed"] is True
    assert result.body["rewards"][0]["xp"] == 25


def test_profile_returns_server_owned_gamification_state() -> None:
    api = build_api()
    api.handle_event(
        authenticated_user_id="user-1",
        payload=payload(),
    )

    result = api.handle_profile(authenticated_user_id="user-1")

    assert result.status_code == 200
    assert result.body["gamification"]["xp"] == 45
    assert result.body["gamification"]["level"] == 1
    assert result.body["gamification"]["streak"]["current"] == 1
    assert result.body["gamification"]["quests"][0]["rewardClaimed"] is True


def test_daily_reward_is_server_generated_and_idempotent() -> None:
    api = build_api()

    first = api.handle_daily_reward(
        authenticated_user_id="user-1",
        claim_date=datetime(2026, 9, 19, tzinfo=timezone.utc).date(),
    )
    second = api.handle_daily_reward(
        authenticated_user_id="user-1",
        claim_date=datetime(2026, 9, 19, tzinfo=timezone.utc).date(),
    )

    assert first.status_code == 200
    assert first.body["reward"]["xp"] == 30
    assert second.body["reward"]["xp"] == 0
    assert second.body["reward"]["reason"] == "ALREADY_PROCESSED"
