from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol
from uuid import UUID, uuid4

from .repository import (
    Identity,
    IdentityConflict,
    IdentityRepository,
    ProviderAccount,
)


class DBConnection(Protocol):
    """Minimal DB-API-like connection required by the SQL adapter."""

    def execute(self, query: str, params: tuple[Any, ...] = ()) -> Any:
        ...


class IdentityDatabaseConnection(DBConnection, Protocol):
    """Connection contract shared by repository and transaction adapters."""

    def commit(self) -> Any:
        ...

    def rollback(self) -> Any:
        ...


class IdentityDatabaseError(RuntimeError):
    """Database failure while persisting Nexora identity state."""


@dataclass(frozen=True, slots=True)
class SQLIdentityRepository(IdentityRepository):
    """PostgreSQL-oriented repository adapter.

    Transaction ownership stays with the host application. The caller must run
    link_provider_account inside its database transaction. The unique provider
    constraint is the final concurrency guard.
    """

    connection: DBConnection

    def get_identity(self, user_id: str) -> Identity | None:
        try:
            row = self.connection.execute(
                """
                SELECT user_id, created_at, updated_at
                FROM nexora_identities
                WHERE user_id = %s
                """,
                (UUID(user_id),),
            ).fetchone()
        except Exception as exc:
            raise IdentityDatabaseError("failed to load identity") from exc

        if row is None:
            return None

        return Identity(
            user_id=str(row[0]),
            created_at=row[1],
            updated_at=row[2],
        )

    def get_user_id_by_provider_subject(
        self,
        *,
        provider: str,
        provider_subject: str,
    ) -> str | None:
        try:
            row = self.connection.execute(
                """
                SELECT user_id
                FROM nexora_provider_accounts
                WHERE provider = %s AND provider_subject = %s
                """,
                (provider, provider_subject),
            ).fetchone()
        except Exception as exc:
            raise IdentityDatabaseError(
                "failed to resolve provider account"
            ) from exc

        return str(row[0]) if row else None

    def link_provider_account(
        self,
        *,
        provider: str,
        provider_subject: str,
        user_id: str,
    ) -> ProviderAccount:
        if not provider.strip() or not provider_subject.strip():
            raise ValueError("provider and provider_subject are required")

        user_uuid = UUID(user_id)
        now = datetime.now(timezone.utc)

        try:
            existing = self.connection.execute(
                """
                SELECT id, user_id, created_at, updated_at
                FROM nexora_provider_accounts
                WHERE provider = %s AND provider_subject = %s
                FOR UPDATE
                """,
                (provider, provider_subject),
            ).fetchone()

            if existing is not None and str(existing[1]) != str(user_uuid):
                raise IdentityConflict("provider account is already linked")

            self.connection.execute(
                """
                INSERT INTO nexora_identities (user_id, created_at, updated_at)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id)
                DO UPDATE SET updated_at = EXCLUDED.updated_at
                """,
                (user_uuid, now, now),
            )

            if existing is None:
                account_id = uuid4()
                self.connection.execute(
                    """
                    INSERT INTO nexora_provider_accounts (
                        id, provider, provider_subject, user_id,
                        created_at, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        account_id,
                        provider,
                        provider_subject,
                        user_uuid,
                        now,
                        now,
                    ),
                )
                return ProviderAccount(
                    provider=provider,
                    provider_subject=provider_subject,
                    user_id=str(user_uuid),
                    created_at=now,
                    updated_at=now,
                )

            self.connection.execute(
                """
                UPDATE nexora_provider_accounts
                SET updated_at = %s
                WHERE id = %s
                """,
                (now, existing[0]),
            )
            return ProviderAccount(
                provider=provider,
                provider_subject=provider_subject,
                user_id=str(user_uuid),
                created_at=existing[2],
                updated_at=now,
            )
        except IdentityConflict:
            raise
        except Exception as exc:
            raise IdentityDatabaseError(
                "failed to link provider account"
            ) from exc
