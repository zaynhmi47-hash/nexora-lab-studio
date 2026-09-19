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
        if "FROM nexora_provider_accounts" in query and "FOR UPDATE" in query:
            return Result([self.provider_row] if self.provider_row else [])
        if "FROM nexora_provider_accounts" in query:
            return Result([self.provider_row] if self.provider_row else [])
        if "FROM nexora_identities" in query:
            return Result([self.identity_row] if self.identity_row else [])
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
    connection.provider_row = (uuid4(), uuid4(), datetime.now(timezone.utc), datetime.now(timezone.utc))
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
