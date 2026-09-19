from __future__ import annotations

from threading import RLock
from typing import Any, Protocol


class IdentityTransactionManager(Protocol):
    def __enter__(self) -> "IdentityTransactionManager":
        ...

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        ...


class InMemoryIdentityTransactionManager:
    """Serialization boundary for tests/local development.

    Production adapters must bind this port to the real database transaction.
    """

    def __init__(self) -> None:
        self._lock = RLock()

    def __enter__(self) -> "InMemoryIdentityTransactionManager":
        self._lock.acquire()
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        self._lock.release()


class DBTransactionConnection(Protocol):
    def commit(self) -> Any:
        ...

    def rollback(self) -> Any:
        ...


class DatabaseIdentityTransactionManager:
    """Own an atomic transaction for an existing DB connection.

    The connection is created and configured by the host application. This
    adapter deliberately does not open connections or select a DB driver.
    """

    def __init__(self, connection: DBTransactionConnection) -> None:
        self.connection = connection

    def __enter__(self) -> "DatabaseIdentityTransactionManager":
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        if exc_type is None:
            try:
                self.connection.commit()
            except Exception:
                self.connection.rollback()
                raise
            return

        self.connection.rollback()
