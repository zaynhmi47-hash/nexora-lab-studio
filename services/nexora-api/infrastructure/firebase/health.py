from __future__ import annotations

from dataclasses import dataclass

from infrastructure.common.exceptions import InfrastructureError
from infrastructure.firebase.configuration import FirebaseConfiguration
from infrastructure.firebase.initialization import FirebaseInitializer


@dataclass(frozen=True, slots=True)
class FirebaseHealth:
    configuration: bool
    initialized: bool


def check_firebase_configuration(configuration: FirebaseConfiguration | None = None) -> bool:
    try:
        (configuration or FirebaseConfiguration.from_environment()).validate()
    except InfrastructureError:
        return False
    return True


def check_firebase_initialization(configuration: FirebaseConfiguration | None = None, initializer: FirebaseInitializer | None = None) -> FirebaseHealth:
    try:
        configuration = configuration or FirebaseConfiguration.from_environment()
        configuration.validate()
        (initializer or FirebaseInitializer()).initialize(configuration)
    except InfrastructureError:
        return FirebaseHealth(configuration=False, initialized=False)
    return FirebaseHealth(configuration=True, initialized=True)
