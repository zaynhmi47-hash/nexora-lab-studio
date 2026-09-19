from datetime import datetime, timezone

from services.muslim.gamification.api_service import GamificationAPIService
from services.muslim.gamification.application import XPRewardApplicationService
from services.muslim.gamification.processor import GamificationEventProcessor
from services.muslim.gamification.state_repository import InMemoryGamificationStateRepository
from services.muslim.gamification.storage import InMemoryPersistentXPLedgerRepository


def build_api() -> GamificationAPIService:
    ledger = InMemoryPersistentXPLedgerRepository()
    state = InMemoryGamificationStateRepository()
    return GamificationAPIService(
        GamificationEventProcessor(
            XPRewardApplicationService(ledger),
            state,
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
