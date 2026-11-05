from dataclasses import dataclass, field
from typing import Protocol

from infrastructure.common.types import ObjectReference


@dataclass(frozen=True, slots=True)
class ContentModerationRequest:
    text: str
    media_type: str = ""
    media_reference: ObjectReference | None = None
    thumbnail_reference: ObjectReference | None = None
    content_id: str = ""


@dataclass(frozen=True, slots=True)
class ContentModerationAssessment:
    suggested_action: str
    confidence: float
    categories: tuple[str, ...] = field(default_factory=tuple)
    explanation: str = ""


class ContentModerationProvider(Protocol):
    provider_name: str

    def assess(self, request: ContentModerationRequest) -> ContentModerationAssessment:
        """Return a recommendation only; callers must retain human review authority."""
        ...
