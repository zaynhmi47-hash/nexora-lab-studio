from __future__ import annotations

from collections import deque
from threading import Lock
from time import monotonic
from typing import Any


_MAX_EVENTS = 200
_events: deque[dict[str, Any]] = deque(maxlen=_MAX_EVENTS)
_lock = Lock()


def record_request(*, method: str, path: str, status_code: int, duration_ms: float) -> None:
    event = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
    }
    with _lock:
        _events.appendleft(event)


def recent_requests(limit: int = 50) -> list[dict[str, Any]]:
    with _lock:
        return list(_events)[:limit]


def clear_requests() -> int:
    with _lock:
        cleared = len(_events)
        _events.clear()
        return cleared


def timer():
    return monotonic()
