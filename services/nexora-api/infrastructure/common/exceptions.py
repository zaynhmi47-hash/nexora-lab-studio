from __future__ import annotations

from typing import Any


class InfrastructureError(Exception):
    """Provider-neutral base error for infrastructure adapters."""

    def __init__(self, message: str, *, provider: str | None = None, details: dict[str, Any] | None = None):
        self.provider = provider
        self.details = details or {}
        super().__init__(message)


class ProviderUnavailableError(InfrastructureError):
    pass


class ProviderAuthenticationError(InfrastructureError):
    pass


class ProviderConfigurationError(InfrastructureError):
    pass


class ObjectStorageError(InfrastructureError):
    pass


class MessagingError(InfrastructureError):
    pass


class RealtimeProviderError(InfrastructureError):
    pass
