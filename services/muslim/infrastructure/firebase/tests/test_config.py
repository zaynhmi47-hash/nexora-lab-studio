from __future__ import annotations

from services.muslim.infrastructure.firebase.config import (
    FirebaseAdminConfig,
    FirebaseAdminAppFactory,
)


def test_config_reads_non_secret_project_id(monkeypatch) -> None:
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "nexora-73cfa")
    assert FirebaseAdminConfig.from_env().project_id == "nexora-73cfa"


def test_config_treats_blank_project_id_as_unset(monkeypatch) -> None:
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "   ")
    assert FirebaseAdminConfig.from_env().project_id is None


def test_config_does_not_store_credentials(monkeypatch) -> None:
    monkeypatch.setenv(
        "GOOGLE_APPLICATION_CREDENTIALS",
        "/secure/runtime/service-account.json",
    )
    config = FirebaseAdminConfig.from_env()
    assert not hasattr(config, "credentials")
    assert not hasattr(config, "private_key")


def test_factory_keeps_explicit_config() -> None:
    config = FirebaseAdminConfig(project_id="nexora-73cfa")
    factory = FirebaseAdminAppFactory(config)
    assert factory.config is config
