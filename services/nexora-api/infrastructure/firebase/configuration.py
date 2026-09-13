from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from infrastructure.common.exceptions import ProviderConfigurationError


@dataclass(frozen=True, slots=True)
class FirebaseConfiguration:
    project_id: str
    storage_bucket: str | None = None
    database_url: str | None = None
    credentials_file: Path | None = None
    app_name: str = "[DEFAULT]"

    @classmethod
    def from_environment(cls) -> "FirebaseConfiguration":
        project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
        if not project_id:
            raise ProviderConfigurationError("FIREBASE_PROJECT_ID is required before using Firebase.", provider="firebase")
        credentials_value = os.getenv("FIREBASE_CREDENTIALS_FILE", "").strip()
        credentials_file = Path(credentials_value).expanduser() if credentials_value else None
        if credentials_file and not credentials_file.is_file():
            raise ProviderConfigurationError("FIREBASE_CREDENTIALS_FILE does not point to a readable file.", provider="firebase")
        return cls(project_id=project_id, storage_bucket=os.getenv("FIREBASE_STORAGE_BUCKET", "").strip() or None, database_url=os.getenv("FIREBASE_DATABASE_URL", "").strip() or None, credentials_file=credentials_file)

    def validate(self) -> None:
        if not self.project_id.strip():
            raise ProviderConfigurationError("Firebase project ID is required.", provider="firebase")
