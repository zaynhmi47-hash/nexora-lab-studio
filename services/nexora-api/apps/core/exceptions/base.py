from __future__ import annotations

from typing import Any


class NexoraException(Exception):
    code = "core.error"
    status_code = 500

    def __init__(self, message: str | None = None, *, details: dict[str, Any] | None = None):
        self.message = message or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class DomainException(NexoraException):
    code = "core.domain_error"


class ValidationException(NexoraException):
    code = "core.validation_error"
    status_code = 400


class NotFoundException(NexoraException):
    code = "core.not_found"
    status_code = 404


class PermissionDeniedException(NexoraException):
    code = "core.permission_denied"
    status_code = 403


class AuthenticationException(NexoraException):
    code = "core.authentication_required"
    status_code = 401


class ConflictException(NexoraException):
    code = "core.conflict"
    status_code = 409


class RateLimitException(NexoraException):
    code = "core.rate_limited"
    status_code = 429


class ExternalServiceException(NexoraException):
    code = "core.external_service_error"
    status_code = 502


class ConfigurationException(NexoraException):
    code = "core.configuration_error"
