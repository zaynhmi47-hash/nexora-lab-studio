from __future__ import annotations

from typing import Any, Callable

from services.muslim.gamification.auth import FirebaseTokenVerifier
from services.muslim.identity.db_repository import (
    IdentityDatabaseConnection,
    SQLIdentityRepository,
)
from services.muslim.identity.transaction import DatabaseIdentityTransactionManager

from .auth_composition import (
    FirebaseAuthenticationComponents,
    FirebaseAuthenticationComposition,
)
from .config import FirebaseAdminConfig


class ProductionFirebaseAuthenticationFactory:
    """Build Firebase authentication against a real host-managed database.

    The host application owns the database connection lifecycle and supplies
    an already-configured connection. No database driver or web framework is
    selected here, keeping the Muslim service infrastructure portable.
    """

    def __init__(
        self,
        *,
        connection: IdentityDatabaseConnection,
        gamification_adapter: Any,
        config: FirebaseAdminConfig | None = None,
        app_factory: Callable[[], Any] | None = None,
        token_verifier: FirebaseTokenVerifier | None = None,
    ) -> None:
        self.connection = connection
        self.gamification_adapter = gamification_adapter
        self.config = config
        self.app_factory = app_factory
        self.token_verifier = token_verifier

    def build(self) -> FirebaseAuthenticationComponents:
        repository = SQLIdentityRepository(connection=self.connection)
        transaction_manager = DatabaseIdentityTransactionManager(
            connection=self.connection
        )
        return FirebaseAuthenticationComposition(
            identity_repository=repository,
            transaction_manager=transaction_manager,
            gamification_adapter=self.gamification_adapter,
            config=self.config,
            app_factory=self.app_factory,
            token_verifier=self.token_verifier,
        ).build()
