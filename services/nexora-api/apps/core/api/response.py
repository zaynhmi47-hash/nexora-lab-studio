from __future__ import annotations

from typing import Any

from rest_framework.response import Response


def success_response(data: Any = None, *, meta: dict[str, Any] | None = None, status: int = 200) -> Response:
    return Response({"success": True, "data": data, "meta": meta or {}, "error": None}, status=status)


def error_response(
    code: str,
    message: str,
    *,
    details: dict[str, Any] | None = None,
    correlation_id: str | None = None,
    status: int = 400,
) -> Response:
    meta = {"correlation_id": correlation_id} if correlation_id else {}
    return Response(
        {
            "success": False,
            "data": None,
            "meta": meta,
            "error": {"code": code, "message": message, "details": details or {}},
        },
        status=status,
    )
