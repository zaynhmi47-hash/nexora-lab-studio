from datetime import datetime, timezone

from services.muslim.gamification.api_service import GamificationAPIService
from services.muslim.gamification.application import XPRewardApplicationService
from services.muslim.gamification.http_adapter import (
    GamificationHTTPAdapter,
    GamificationHTTPRequest,
)
from services.muslim.gamification.processor import GamificationEventProcessor
from services.muslim.gamification.state_repository import InMemoryGamificationStateRepository
from services.muslim.gamification.storage import InMemoryPersistentXPLedgerRepository
from services.muslim.gamification.transaction import InMemoryGamificationTransactionManager


def build_adapter() -> GamificationHTTPAdapter:
    ledger = InMemoryPersistentXPLedgerRepository()
    state = InMemoryGamificationStateRepository()
    processor = GamificationEventProcessor(
        XPRewardApplicationService(ledger),
        state,
        InMemoryGamificationTransactionManager(),
    )
    return GamificationHTTPAdapter(GamificationAPIService(processor))


def event_body() -> dict[str, object]:
    return {
        "eventId": "lesson-http-1",
        "eventType": "LESSON_COMPLETED",
        "occurredAt": datetime(2026, 9, 19, tzinfo=timezone.utc).isoformat(),
        "activityId": "lesson-http-1",
    }


def test_http_adapter_routes_profile() -> None:
    response = build_adapter().handle(
        GamificationHTTPRequest(
            method="GET",
            path="/gamification/profile/",
            authenticated_user_id="user-1",
        )
    )

    assert response.status_code == 200
    assert response.body["success"] is True


def test_http_adapter_routes_event() -> None:
    response = build_adapter().handle(
        GamificationHTTPRequest(
            method="POST",
            path="/gamification/events/",
            authenticated_user_id="user-1",
            body=event_body(),
        )
    )

    assert response.status_code == 200
    assert response.body["reward"]["xp"] == 20


def test_http_adapter_rejects_unauthenticated_request() -> None:
    response = build_adapter().handle(
        GamificationHTTPRequest(
            method="GET",
            path="/gamification/profile/",
            authenticated_user_id=None,
        )
    )

    assert response.status_code == 401


def test_http_adapter_rejects_unknown_route() -> None:
    response = build_adapter().handle(
        GamificationHTTPRequest(
            method="GET",
            path="/gamification/unknown/",
            authenticated_user_id="user-1",
        )
    )

    assert response.status_code == 404
