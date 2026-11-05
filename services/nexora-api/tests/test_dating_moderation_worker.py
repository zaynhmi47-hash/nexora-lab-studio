import pytest

from apps.dating_social_professional.models import DatingMoment, DatingMomentModerationJob
from apps.dating_social_professional.moderation_worker import process_pending_moderation_jobs
from apps.identity.models import NexoraUser
from infrastructure.moderation.ports import ContentModerationAssessment


class FakeModerationProvider:
    provider_name = "test-provider"

    def __init__(self):
        self.requests = []

    def assess(self, request):
        self.requests.append(request)
        return ContentModerationAssessment(
            suggested_action="review",
            confidence=0.93,
            categories=("harassment", "spam"),
            explanation="Requires a human reviewer.",
        )


@pytest.mark.django_db
def test_worker_saves_ai_recommendation_without_changing_human_moderation_status(monkeypatch):
    author = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Author")
    moment = DatingMoment.objects.create(
        author=author,
        caption="Please review this post",
        moderation_status=DatingMoment.ModerationStatus.PENDING,
    )
    job = DatingMomentModerationJob.objects.create(moment=moment)
    provider = FakeModerationProvider()
    monkeypatch.setattr(
        "apps.dating_social_professional.moderation_worker.get_content_moderation_provider",
        lambda: provider,
    )

    assert process_pending_moderation_jobs(limit=5) == 1

    job.refresh_from_db()
    moment.refresh_from_db()
    assert job.status == DatingMomentModerationJob.Status.COMPLETED
    assert job.provider_name == "test-provider"
    assert job.suggested_action == "review"
    assert job.confidence == 0.93
    assert job.categories == ["harassment", "spam"]
    assert moment.moderation_status == DatingMoment.ModerationStatus.PENDING
    assert len(provider.requests) == 1
    assert provider.requests[0].text == "Please review this post"


@pytest.mark.django_db
def test_worker_keeps_content_pending_when_provider_fails(monkeypatch):
    author = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Author")
    moment = DatingMoment.objects.create(author=author, caption="Needs review")
    job = DatingMomentModerationJob.objects.create(moment=moment)

    class BrokenProvider:
        provider_name = "broken"

        def assess(self, request):
            raise RuntimeError("Provider timeout")

    monkeypatch.setattr(
        "apps.dating_social_professional.moderation_worker.get_content_moderation_provider",
        lambda: BrokenProvider(),
    )

    assert process_pending_moderation_jobs(limit=1, max_attempts=1) == 0

    job.refresh_from_db()
    moment.refresh_from_db()
    assert job.status == DatingMomentModerationJob.Status.FAILED
    assert "Provider timeout" in job.last_error
    assert moment.moderation_status == DatingMoment.ModerationStatus.PENDING
