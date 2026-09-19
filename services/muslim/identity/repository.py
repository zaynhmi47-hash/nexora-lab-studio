from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Protocol


class IdentityRepositoryError(Exception):
    """Base persistence error for identity operations."""


class IdentityNotFound(IdentityRepositoryError):
    """No internal identity is linked to the requested provider account."""


class IdentityConflict(IdentityRepositoryError):
    """A provider account is already linked to another internal identity."""


@dataclass(frozen=True, slots=True)
class ProviderAccount:
    provider: str
    provider_subject: str
    user_id: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class Identity:
    user_id: str
    created_at: datetime
    updated_at: datetime


class IdentityRepository(Protocol):
    """Persistence port for internal identities and external provider links."""

    def get_identity(self, user_id: str) -> Identity | None:
        ...

    def get_user_id_by_provider_subject(
        self,
        *,
        provider: str,
        provider_subject: str,
    ) -> str | None:
        ...

    def link_provider_account(
        self,
        *,
        provider: str,
        provider_subject: str,
        user_id: str,
    ) -> ProviderAccount:
        ...


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class InMemoryIdentityRepository:
    """Deterministic test adapter implementing the identity repository contract."""

    def __init__(self) -> None:
        self._identities: dict[str, Identity] = {}
        self._provider_accounts: dict[tuple[str, str], ProviderAccount] = {}

    def get_identity(self, user_id: str) -> Identity | None:
        return self._identities.get(user_id)

    def get_user_id_by_provider_subject(
        self,
        *,
        provider: str,
        provider_subject: str,
    ) -> str | None:
        account = self._provider_accounts.get((provider, provider_subject))
        return account.user_id if account else None

    def link_provider_account(
        self,
        *,
        provider: str,
        provider_subject: str,
        user_id: str,
    ) -> ProviderAccount:
        if not provider.strip() or not provider_subject.strip() or not user_id.strip():
            raise ValueError("provider, provider_subject, and user_id are required")

        existing = self._provider_accounts.get((provider, provider_subject))
        if existing and existing.user_id != user_id:
            raise IdentityConflict("provider account is already linked")

        now = utc_now()
        identity = self._identities.get(user_id)
        if identity is None:
            self._identities[user_id] = Identity(
                user_id=user_id,
                created_at=now,
                updated_at=now,
            )
        else:
            self._identities[user_id] = Identity(
                user_id=identity.user_id,
                created_at=identity.created_at,
                updated_at=now,
            )

        account = ProviderAccount(
            provider=provider,
            provider_subject=provider_subject,
            user_id=user_id,
            created_at=existing.created_at if existing else now,
            updated_at=now,
        )
        self._provider_accounts[(provider, provider_subject)] = account
        return account
