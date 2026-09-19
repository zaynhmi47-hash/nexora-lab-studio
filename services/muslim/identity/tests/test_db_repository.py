from datetime import datetime, timezone
from uuid import uuid4

from services.muslim.identity.db_repository import SQLIdentityRepository
from services.muslim.identity.repository import IdentityConflict


class Result:
    def __init__(self, rows):
        self.rows = rows

    def fetchone(self):
        return self.rows[0] if self.rows else None


class FakeConnection:
    def __init__(self):
        self.calls = []
        self.provider_row = None
        self.identity_row = None

    def execute(self, query, params=()):
        self.calls.append((query, params))
        if "INSERT INTO nexora_provider_accounts" in query:
            if self.provider_row is None:
                account_id, _provider, _subject, user_id, created_at, updated_at = params
                self.provider_row = (account_id, user_id, created_at, updated_at)
            return Result([])
        if "FROM nexora_provider_accounts" in query and "FOR UPDATE" in query:
            return Result([self.provider_row] if self.provider_row else [])
        if "FROM nexora_provider_accounts" in query:
            return Result([self.provider_row] if self.provider_row else [])
        if "FROM nexora_identities" in query:
            return Result([self.identity_row] if self.identity_row else [])
        if "INSERT INTO nexora_identities" in query:
            user_id, created_at, updated_at = params
            self.identity_row = (user_id, created_at, updated_at)
            return Result([])
        return Result([])


def test_sql_repository_resolves_provider_account() -> None:
    connection = FakeConnection()
    user_id = uuid4()
    connection.provider_row = (user_id,)
    repository = SQLIdentityRepository(connection)

    assert repository.get_user_id_by_provider_subject(
        provider="firebase", provider_subject="uid-1"
    ) == str(user_id)


def test_sql_repository_rejects_reassignment() -> None:
    connection = FakeConnection()
    connection.provider_row = (
        uuid4(),
        uuid4(),
        datetime.now(timezone.utc),
        datetime.now(timezone.utc),
    )
    repository = SQLIdentityRepository(connection)

    try:
        repository.link_provider_account(
            provider="firebase",
            provider_subject="uid-1",
            user_id=str(uuid4()),
        )
    except IdentityConflict:
        pass
    else:
        raise AssertionError("expected IdentityConflict")


def test_sql_repository_uses_conflict_safe_provider_insert() -> None:
    connection = FakeConnection()
    repository = SQLIdentityRepository(connection)

    # The fake has no provider row, so the method eventually raises because it
    # cannot simulate the database result. The important contract here is that
    # the provider INSERT uses ON CONFLICT DO NOTHING rather than surfacing a
    # raw unique-constraint exception during concurrent first login.
    try:
        repository.link_provider_account(
            provider="firebase",
            provider_subject="uid-1",
            user_id=str(uuid4()),
        )
    except Exception:
        pass

    provider_inserts = [
        query
        for query, _params in connection.calls
        if "INSERT INTO nexora_provider_accounts" in query
    ]
    assert len(provider_inserts) == 1
    assert "ON CONFLICT (provider, provider_subject) DO NOTHING" in provider_inserts[0]
