from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Any

from services.muslim.gamification.auth import UserIdentityResolver
from services.muslim.gamification.auth_http import AuthenticatedGamificationHTTPAdapter
from services.muslim.identity.provisioning import (
    IdentityProvisioningService,
    IdentityProvisioningTransaction,
)
from services.muslim.identity.repository import IdentityRepository

from .auth import FirebaseAdminAppFactory, FirebaseAdminTokenVerifier
from .config import FirebaseAdminConfig
from .identity import FirebaseNexoraIdentityResolver


@dataclass(frozen=True, slots=True)
class FirebaseAuthenticationComponents:
    """Composed authentication dependencies for the host Muslim service."""

    verifier: FirebaseAdminTokenVerifier
    identity_resolver: UserIdentityResolver
    gamification_adapter: AuthenticatedGamificationHTTPAdapter


class FirebaseAuthenticationComposition:
    """Build the server-side Firebase authentication boundary.

    The host application supplies persistence and transaction dependencies.
    This keeps Firebase infrastructure independent from a web framework and
    prevents endpoint code from constructing or trusting user IDs.
    """

    def __init__(
        self,
        *,
        identity_repository: IdentityRepository,
        transaction_manager: IdentityProvisioningTransaction,
        gamification_adapter: Any,
        config: FirebaseAdminConfig | None = None,
        app_factory: Callable[[], Any] | None = None,
    ) -> None:
        self.identity_repository = identity_repository
        self.transaction_manager = transaction_manager
        self.gamification_adapter = gamification_adapter
        self.config = config or FirebaseAdminConfig.from_env()
        self.app_factory = app_factory

    def build(self) -> FirebaseAuthenticationComponents:
        admin_app_factory = self.app_factory or FirebaseAdminAppFactory(
            self.config
        ).create

        verifier = FirebaseAdminTokenVerifier(app_factory=admin_app_factory)
        provisioning_service = IdentityProvisioningService(
            repository=self.identity_repository,
            transaction_manager=self.transaction_manager,
        )
        identity_resolver = FirebaseNexoraIdentityResolver(
            verifier=verifier,
            provisioning_service=provisioning_service,
        )
        authenticated_adapter = AuthenticatedGamificationHTTPAdapter(
            identity_resolver=identity_resolver,
            gamification_adapter=self.gamification_adapter,
        )

        return FirebaseAuthenticationComponents(
            verifier=verifier,
            identity_resolver=identity_resolver,
            gamification_adapter=authenticated_adapter,
        )
