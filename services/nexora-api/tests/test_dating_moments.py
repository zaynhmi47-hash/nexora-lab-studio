import datetime

import pytest
from django.test import override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.dating_social_professional.moments_api import DatingMomentView
from apps.dating_social_professional.models import DatingMoment, DatingMomentModerationJob, DatingProfile
from apps.identity.models import NexoraUser


@pytest.mark.django_db
def test_moment_create_feed_private_visibility_and_owner_delete():
    author = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Author")
    reader = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Reader")
    DatingProfile.objects.create(user=author, display_name="Author", birth_date=datetime.date(1998, 1, 1))
    DatingProfile.objects.create(user=reader, display_name="Reader", birth_date=datetime.date(1998, 1, 1))
    factory = APIRequestFactory()

    create_request = factory.post("/api/v1/dating/moments/", {"caption": "Hello Nexora"}, format="json")
    force_authenticate(create_request, user=author)
    created = DatingMomentView.as_view()(create_request)
    assert created.status_code == 201
    moment_id = created.data["id"]
    moment = DatingMoment.objects.get(id=moment_id)
    assert moment.moderation_status == DatingMoment.ModerationStatus.PENDING
    assert DatingMomentModerationJob.objects.filter(moment=moment, status="queued").exists()

    feed_request = factory.get("/api/v1/dating/moments/")
    force_authenticate(feed_request, user=reader)
    feed = DatingMomentView.as_view()(feed_request)
    assert feed.status_code == 200
    assert all(item["id"] != moment_id for item in feed.data["items"])

    moment.moderation_status = DatingMoment.ModerationStatus.APPROVED
    moment.save(update_fields=["moderation_status", "updated_at"])
    approved_feed_request = factory.get("/api/v1/dating/moments/")
    force_authenticate(approved_feed_request, user=reader)
    approved_feed = DatingMomentView.as_view()(approved_feed_request)
    assert any(item["id"] == moment_id for item in approved_feed.data["items"])

    private = DatingMoment.objects.create(author=author, caption="Private note", visibility=DatingMoment.Visibility.PRIVATE)
    private_feed_request = factory.get("/api/v1/dating/moments/")
    force_authenticate(private_feed_request, user=reader)
    private_feed = DatingMomentView.as_view()(private_feed_request)
    assert all(item["id"] != str(private.id) for item in private_feed.data["items"])

    delete_request = factory.delete(f"/api/v1/dating/moments/?moment_id={moment_id}")
    force_authenticate(delete_request, user=reader)
    assert DatingMomentView.as_view()(delete_request).status_code == 404


@pytest.mark.django_db
def test_moment_moderation_requires_allowlisted_reviewer_and_approves_content():
    from apps.dating_social_professional.moderation_api import DatingMomentModerationQueueView

    author = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Author")
    reviewer = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Reviewer")
    moment = DatingMoment.objects.create(author=author, caption="Awaiting review", moderation_status=DatingMoment.ModerationStatus.PENDING)
    factory = APIRequestFactory()

    denied = factory.get("/api/v1/dating/moderation/moments/")
    force_authenticate(denied, user=reviewer)
    assert DatingMomentModerationQueueView.as_view()(denied).status_code == 403

    with override_settings(DATING_MOMENT_MODERATOR_USER_IDS=[str(reviewer.id)]):
        queue = factory.get("/api/v1/dating/moderation/moments/")
        force_authenticate(queue, user=reviewer)
        queued = DatingMomentModerationQueueView.as_view()(queue)
        assert queued.status_code == 200
        assert any(item["id"] == str(moment.id) for item in queued.data["items"])

        approve = factory.patch(
            f"/api/v1/dating/moderation/moments/{moment.id}/",
            {"status": "approved", "reason": "Passed human review"},
            format="json",
        )
        force_authenticate(approve, user=reviewer)
        response = DatingMomentModerationQueueView.as_view()(approve, moment_id=moment.id)

    assert response.status_code == 200
    moment.refresh_from_db()
    assert moment.moderation_status == DatingMoment.ModerationStatus.APPROVED
    assert moment.moderation_reviewed_by_id == reviewer.id
