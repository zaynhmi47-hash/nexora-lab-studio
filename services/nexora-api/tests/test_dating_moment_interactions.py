import datetime

import pytest
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.dating_social_professional.interactions_api import DatingMomentCommentsView, DatingMomentReactionView
from apps.dating_social_professional.models import DatingMoment, DatingMomentComment, DatingMomentReaction, DatingProfile
from apps.identity.models import NexoraUser


@pytest.mark.django_db
def test_moment_like_is_idempotent_and_unlike_is_soft_deleted():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Member")
    DatingProfile.objects.create(user=user, display_name="Member", birth_date=datetime.date(1998, 1, 1))
    moment = DatingMoment.objects.create(author=user, caption="A moment")
    factory = APIRequestFactory()

    first = factory.post(f"/api/v1/dating/moments/{moment.id}/reactions/")
    force_authenticate(first, user=user)
    first_response = DatingMomentReactionView.as_view()(first, moment_id=moment.id)
    second = factory.post(f"/api/v1/dating/moments/{moment.id}/reactions/")
    force_authenticate(second, user=user)
    second_response = DatingMomentReactionView.as_view()(second, moment_id=moment.id)
    assert first_response.status_code == 201
    assert second_response.status_code == 200
    assert DatingMomentReaction.objects.filter(moment=moment, user=user).count() == 1

    unlike = factory.delete(f"/api/v1/dating/moments/{moment.id}/reactions/")
    force_authenticate(unlike, user=user)
    assert DatingMomentReactionView.as_view()(unlike, moment_id=moment.id).status_code == 200
    assert DatingMomentReaction.objects.filter(moment=moment, user=user).count() == 0


@pytest.mark.django_db
def test_moment_comment_and_reply_are_scoped_to_same_moment():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Member")
    DatingProfile.objects.create(user=user, display_name="Member", birth_date=datetime.date(1998, 1, 1))
    moment = DatingMoment.objects.create(author=user, caption="A moment")
    other_moment = DatingMoment.objects.create(author=user, caption="Another moment")
    factory = APIRequestFactory()

    create = factory.post(f"/api/v1/dating/moments/{moment.id}/comments/", {"body": "First comment"}, format="json")
    force_authenticate(create, user=user)
    created = DatingMomentCommentsView.as_view()(create, moment_id=moment.id)
    assert created.status_code == 201

    reply = factory.post(f"/api/v1/dating/moments/{moment.id}/comments/", {"body": "A reply", "parent_id": created.data["id"]}, format="json")
    force_authenticate(reply, user=user)
    assert DatingMomentCommentsView.as_view()(reply, moment_id=moment.id).status_code == 201

    invalid = factory.post(f"/api/v1/dating/moments/{other_moment.id}/comments/", {"body": "Wrong thread", "parent_id": created.data["id"]}, format="json")
    force_authenticate(invalid, user=user)
    assert DatingMomentCommentsView.as_view()(invalid, moment_id=other_moment.id).status_code == 400


@pytest.mark.django_db
def test_social_interaction_creates_notification_for_moment_owner():
    from apps.dating_social_professional.models import DatingNotification

    author = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Author")
    actor = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Reader")
    DatingProfile.objects.create(user=author, display_name="Author", birth_date=datetime.date(1998, 1, 1))
    DatingProfile.objects.create(user=actor, display_name="Reader", birth_date=datetime.date(1998, 1, 1))
    moment = DatingMoment.objects.create(author=author, caption="Public moment")
    factory = APIRequestFactory()

    like = factory.post(f"/api/v1/dating/moments/{moment.id}/reactions/")
    force_authenticate(like, user=actor)
    assert DatingMomentReactionView.as_view()(like, moment_id=moment.id).status_code == 201
    assert DatingNotification.objects.filter(
        recipient=author, type="social", data__momentId=str(moment.id), data__action="like"
    ).count() == 1

    comment = factory.post(
        f"/api/v1/dating/moments/{moment.id}/comments/", {"body": "Nice moment"}, format="json"
    )
    force_authenticate(comment, user=actor)
    assert DatingMomentCommentsView.as_view()(comment, moment_id=moment.id).status_code == 201
    assert DatingNotification.objects.filter(
        recipient=author, type="social", data__momentId=str(moment.id), data__action="comment"
    ).count() == 1


@pytest.mark.django_db
def test_moment_report_uses_existing_safety_report_pipeline():
    from apps.dating_social_professional.interactions_api import DatingMomentReportView
    from apps.dating_social_professional.models import DatingReport

    author = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Author")
    actor = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Reader")
    DatingProfile.objects.create(user=author, display_name="Author", birth_date=datetime.date(1998, 1, 1))
    DatingProfile.objects.create(user=actor, display_name="Reader", birth_date=datetime.date(1998, 1, 1))
    moment = DatingMoment.objects.create(author=author, caption="Reported moment")
    request = APIRequestFactory().post(
        f"/api/v1/dating/moments/{moment.id}/report/",
        {"reason": "inappropriate", "details": "Please review."},
        format="json",
    )
    force_authenticate(request, user=actor)
    response = DatingMomentReportView.as_view()(request, moment_id=moment.id)
    assert response.status_code == 201
    report = DatingReport.objects.get(id=response.data["report_id"])
    assert report.reporter_id == actor.id
    assert report.reported_id == author.id
    assert f"[moment:{moment.id}]" in report.details


@pytest.mark.django_db
def test_moment_upload_stores_validated_image_and_returns_signed_url():
    from datetime import timedelta
    from unittest.mock import patch
    from django.core.files.uploadedfile import SimpleUploadedFile
    from django.utils import timezone
    from infrastructure.storage.ports.object_storage import StorageAccessReference
    from infrastructure.common.types import ObjectReference
    from apps.dating_social_professional.moments_api import DatingMomentView

    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Uploader")
    DatingProfile.objects.create(user=user, display_name="Uploader", birth_date=datetime.date(1998, 1, 1))

    class FakeStorage:
        def upload(self, request):
            self.upload_request = request

        def create_access_reference(self, reference, *, expires_at):
            return StorageAccessReference(reference=reference, expires_at=expires_at, url="https://media.example/signed.jpg")

    storage = FakeStorage()
    upload = SimpleUploadedFile("moment.jpg", bytes([0xFF, 0xD8, 0xFF]) + b"test-image-data", content_type="image/jpeg")
    request = APIRequestFactory().post(
        "/api/v1/dating/moments/",
        {"caption": "A photo moment", "visibility": "public", "file": upload},
        format="multipart",
    )
    force_authenticate(request, user=user)
    with patch("apps.dating_social_professional.moments_api.FirebaseProviderRegistry") as registry:
        registry.return_value.storage.return_value = storage
        response = DatingMomentView.as_view()(request)

    assert response.status_code == 201
    moment = DatingMoment.objects.get(id=response.data["id"])
    assert moment.media_type == "image"
    assert moment.moderation_status == DatingMoment.ModerationStatus.PENDING
    assert moment.storage_key.startswith(f"{user.id}/")
    assert response.data["media_url"] == "https://media.example/signed.jpg"
    assert storage.upload_request.content_type == "image/jpeg"


@pytest.mark.django_db
def test_moment_upload_rejects_mismatched_media_signature():
    from django.core.files.uploadedfile import SimpleUploadedFile
    from apps.dating_social_professional.moments_api import DatingMomentView

    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Uploader")
    DatingProfile.objects.create(user=user, display_name="Uploader", birth_date=datetime.date(1998, 1, 1))
    upload = SimpleUploadedFile("moment.jpg", b"not-a-jpeg-file", content_type="image/jpeg")
    request = APIRequestFactory().post(
        "/api/v1/dating/moments/",
        {"caption": "Invalid upload", "file": upload},
        format="multipart",
    )
    force_authenticate(request, user=user)
    response = DatingMomentView.as_view()(request)
    assert response.status_code == 400
    assert DatingMoment.objects.filter(author=user).count() == 0


@pytest.mark.django_db
def test_unapproved_moment_is_hidden_from_other_users_interactions():
    author = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Author")
    reader = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Reader")
    DatingProfile.objects.create(user=author, display_name="Author", birth_date=datetime.date(1998, 1, 1))
    DatingProfile.objects.create(user=reader, display_name="Reader", birth_date=datetime.date(1998, 1, 1))
    moment = DatingMoment.objects.create(
        author=author,
        caption="Pending content",
        moderation_status=DatingMoment.ModerationStatus.PENDING,
    )
    request = APIRequestFactory().post(f"/api/v1/dating/moments/{moment.id}/reactions/")
    force_authenticate(request, user=reader)
    response = DatingMomentReactionView.as_view()(request, moment_id=moment.id)
    assert response.status_code == 404
    assert DatingMomentReaction.objects.filter(moment=moment, user=reader).count() == 0
