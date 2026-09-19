from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Protocol
from uuid import uuid4

from .repository import Identity, IdentityConflict, IdentityRepository, ProviderAccount


class IdentityProvisioningError(Exception):
    """Base error for first-login identity provisioning."""


class ProviderAccountAlreadyLinked(IdentityProvisioningError):
    """The provider subject is already linked to another identity."""


class IdentityProvisioningTransaction(Protocol):
    def __enter__(self) -> "IdentityProvisioningTransaction":
        ...

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        ...


@dataclass(frozen=True, slots=True)
class ProvisionedIdentity:
    identity: Identity
    provider_account: ProviderAccount
    created: bool


class IdentityProvisioningService:
    """Creates an internal identity and links a provider account atomically.

    The service never accepts a Firebase UID as the internal user ID. A new
    Nexora UUID is generated server-side when no provider link exists.
    """

    def __init__(
        self,
        repository: IdentityRepository,
        transaction_manager: IdentityProvisioningTransaction,
    ) -> None:
        self.repository = repository
        self.transaction_manager = transaction_manager

    def provision_or_resolve(
        self,
        *,
        provider: str,
        provider_subject: str,
    ) -> ProvisionedIdentity:
        if not provider.strip() or not provider_subject.strip():
            raise ValueError("provider and provider_subject are required")

        with self.transaction_manager:
            existing_user_id = self.repository.get_user_id_by_provider_subject(
                provider=provider,
                provider_subject=provider_subject,
            )
            if existing_user_id is not None:
                identity = self.repository.get_identity(existing_user_id)
                if identity is None:
                    raise IdentityProvisioningError(
                        "provider link references a missing identity"
                    )
                account = self.repository.link_provider_account(
                    provider=provider,
                    provider_subject=provider_subject,
                    user_id=existing_user_id,
                )
                return ProvisionedIdentity(
                    identity=identity,
                    provider_account=account,
                    created=False,
                )

            user_id = str(uuid4())
            try:
                account = self.repository.link_provider_account(
                    provider=provider,
                    provider_subject=provider_subject,
                    user_id=user_id,
                )
            except IdentityConflict as exc:
                raise ProviderAccountAlreadyLinked(
                    "provider account was linked concurrently"
                ) from exc

            identity = self.repository.get_identity(user_id)
            if identity is None:
                raise IdentityProvisioningError(
                    "identity was not created by repository"
                )

            return ProvisionedIdentity(
                identity=identity,
                provider_account=account,
                created=True,
            )
