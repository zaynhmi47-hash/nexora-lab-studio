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


class RaceDatabase:
    """Deterministic two-transaction model of a PostgreSQL first-login race."""

    def __init__(self) -> None:
        from threading import Barrier, Lock

        self.lock = Lock()
        self.provider_row = None
        self.identity_rows = {}
        self.provider_reservations = set()
        self.insert_barrier = Barrier(2)

    def connection(self):
        return RaceTransaction(self)


class RaceTransaction:
    def __init__(self, database: RaceDatabase) -> None:
        self.database = database
        self.pending_identity_rows = {}

    def execute(self, query, params=()):
        if "INSERT INTO nexora_identities" in query:
            user_id, created_at, updated_at = params
            with self.database.lock:
                self.pending_identity_rows[str(user_id)] = (
                    user_id,
                    created_at,
                    updated_at,
                )
            return Result([])

        if "INSERT INTO nexora_provider_accounts" in query:
            account_id, provider, subject, user_id, created_at, updated_at = params
            with self.database.lock:
                if self.database.provider_row is None:
                    if (provider, subject) not in self.database.provider_reservations:
                        self.database.provider_reservations.add((provider, subject))
                        self.database.provider_row = (
                            account_id,
                            user_id,
                            created_at,
                            updated_at,
                        )

            # Force both transactions to reach the same point before either
            # checks the row with SELECT ... FOR UPDATE.
            self.database.insert_barrier.wait()
            return Result([])

        if "FROM nexora_provider_accounts" in query and "FOR UPDATE" in query:
            with self.database.lock:
                row = self.database.provider_row
            return Result([row] if row else [])

        if "FROM nexora_provider_accounts" in query:
            with self.database.lock:
                row = self.database.provider_row
            return Result([row] if row else [])

        if "FROM nexora_identities" in query:
            user_id = str(params[0])
            with self.database.lock:
                row = self.database.identity_rows.get(user_id)
            if row is None:
                row = self.pending_identity_rows.get(user_id)
            return Result([row] if row else [])

        if "UPDATE nexora_provider_accounts" in query:
            return Result([])

        raise AssertionError(f"unexpected SQL: {query}")

    def commit(self) -> None:
        with self.database.lock:
            self.database.identity_rows.update(self.pending_identity_rows)
        self.pending_identity_rows.clear()

    def rollback(self) -> None:
        self.pending_identity_rows.clear()


def test_sql_repository_simulates_two_transactions_same_first_login() -> None:
    from concurrent.futures import ThreadPoolExecutor

    database = RaceDatabase()
    repository_a = SQLIdentityRepository(database.connection())
    repository_b = SQLIdentityRepository(database.connection())

    user_a = str(uuid4())
    user_b = str(uuid4())

    def first_login(repository, user_id):
        transaction = repository.connection
        try:
            account = repository.link_provider_account(
                provider="firebase",
                provider_subject="firebase-race-user",
                user_id=user_id,
            )
        except IdentityConflict:
            transaction.rollback()
            return ("conflict", user_id)
        except Exception:
            transaction.rollback()
            raise
        else:
            transaction.commit()
            return ("success", account.user_id)

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(
            executor.map(
                lambda args: first_login(*args),
                ((repository_a, user_a), (repository_b, user_b)),
            )
        )

    assert sorted(result[0] for result in results) == ["conflict", "success"]

    successful_user_id = next(
        result[1] for result in results if result[0] == "success"
    )
    conflicted_user_id = next(
        result[1] for result in results if result[0] == "conflict"
    )

    assert successful_user_id in {user_a, user_b}
    assert conflicted_user_id in {user_a, user_b}
    assert successful_user_id != conflicted_user_id

    assert database.provider_row is not None
    assert str(database.provider_row[1]) == successful_user_id
    assert str(database.provider_row[1]) != conflicted_user_id

    assert successful_user_id in database.identity_rows
    assert conflicted_user_id not in database.identity_rows
