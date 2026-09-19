from __future__ import annotations

from abc import ABC, abstractmethod
from contextlib import contextmanager
from threading import RLock
from collections.abc import Iterator


class GamificationTransactionManager(ABC):
    """Port for an atomic transaction spanning reward and state persistence."""

    @abstractmethod
    @contextmanager
    def transaction(self) -> Iterator[None]:
        yield


class InMemoryGamificationTransactionManager(GamificationTransactionManager):
    """Serialization boundary used by tests until a real DB adapter exists."""

    def __init__(self) -> None:
        self._lock = RLock()

    @contextmanager
    def transaction(self) -> Iterator[None]:
        with self._lock:
            yield
