from __future__ import annotations

from dataclasses import dataclass, field
from typing import Mapping, Protocol

from infrastructure.common.types import JSONValue


@dataclass(frozen=True, slots=True)
class IdentityClaims:
    provider: str
    provider_subject: str
    email: str | None = None
    email_verified: bool = False
    display_name: str | None = None
    claims: Mapping[str, JSONValue] = field(default_factory=dict)


class IdentityProvider(Protocol):
    provider_name: str

    def verify_token(self, token: str) -> IdentityClaims: ...
    def revoke_session(self, provider_subject: str) -> None: ...
