from __future__ import annotations

from dataclasses import asdict
from datetime import datetime

from .domain import GamificationEvent, GamificationEventType, RewardResult


def parse_event(payload: dict[str, object], *, user_id: str) -> GamificationEvent:
    event_id = payload.get("eventId")
    event_type = payload.get("eventType")
    occurred_at = payload.get("occurredAt")
    activity_id = payload.get("activityId")
    metadata = payload.get("metadata")

    if not isinstance(event_id, str) or not event_id.strip():
        raise ValueError("eventId is required")
    if not isinstance(event_type, str):
        raise ValueError("eventType is required")
    if not isinstance(occurred_at, str):
        raise ValueError("occurredAt is required")
    if activity_id is not None and not isinstance(activity_id, str):
        raise ValueError("activityId must be a string")
    if metadata is not None and not isinstance(metadata, dict):
        raise ValueError("metadata must be an object")

    try:
        parsed_type = GamificationEventType(event_type)
        parsed_time = datetime.fromisoformat(occurred_at.replace("Z", "+00:00"))
    except (ValueError, TypeError) as exc:
        raise ValueError("invalid eventType or occurredAt") from exc

    if parsed_time.tzinfo is None:
        raise ValueError("occurredAt must include timezone information")

    return GamificationEvent(
        event_id=event_id,
        user_id=user_id,
        event_type=parsed_type,
        occurred_at=parsed_time,
        activity_id=activity_id,
        metadata=metadata,
    )


def serialize_result(result: RewardResult) -> dict[str, object]:
    ledger = result.ledger_entry
    return {
        "success": True,
        "reward": {
            "awarded": result.awarded,
            "xp": result.xp,
            "reason": result.reason.value if result.reason else None,
        },
        "ledger": (
            {
                "id": ledger.id,
                "eventId": ledger.event_id,
                "eventType": ledger.event_type.value,
                "amount": ledger.amount,
                "createdAt": ledger.created_at.isoformat(),
            }
            if ledger
            else None
        ),
    }
