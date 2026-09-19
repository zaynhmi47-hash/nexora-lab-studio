from __future__ import annotations

from threading import RLock
from typing import Protocol


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
