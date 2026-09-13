from __future__ import annotations

from contextvars import ContextVar, Token
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class RequestContext:
    correlation_id: str | None = None
    user: Any = None
    organization: Any = None
    product: Any = None


_context: ContextVar[RequestContext] = ContextVar("nexora_request_context", default=RequestContext())


def get_request_context() -> RequestContext:
    return _context.get()


def set_request_context(context: RequestContext) -> Token[RequestContext]:
    return _context.set(context)


def reset_request_context(token: Token[RequestContext]) -> None:
    _context.reset(token)
