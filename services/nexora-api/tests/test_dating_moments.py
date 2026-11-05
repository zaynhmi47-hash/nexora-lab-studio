import datetime

import pytest
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.dating_social_professional.moments_api import DatingMomentView
from apps.dating_social_professional.models import DatingMoment, DatingProfile
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
