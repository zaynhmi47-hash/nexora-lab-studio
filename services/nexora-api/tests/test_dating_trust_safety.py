import pytest
from django.test import override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.dating_social_professional.models import (
    DatingModerationAppeal,
    DatingMoment,
    DatingReport,
    DatingSafetyAuditEvent,
)
from apps.dating_social_professional.trust_safety_api import (
    DatingMomentAppealView,
    TrustSafetyAppealsView,
    TrustSafetyReportsView,
)
from apps.identity.models import NexoraUser


@pytest.mark.django_db
def test_moderator_can_triage_report_and_every_change_is_audited():
    reporter = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Reporter")
    reported = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Reported")
    moderator = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Moderator")
    report = DatingReport.objects.create(
        reporter=reporter, reported=reported, reason=DatingReport.Reason.SCAM,
        details="Suspicious payment request",
    )
    factory = APIRequestFactory()

    with override_settings(DATING_MOMENT_MODERATOR_USER_IDS=[str(moderator.id)]):
        queue_request = factory.get("/api/v1/dating/moderation/reports/?status=open")
        force_authenticate(queue_request, user=moderator)
        queue = TrustSafetyReportsView.as_view()(queue_request)
        assert queue.status_code == 200
        assert queue.data["items"][0]["id"] == str(report.id)

        update_request = factory.patch(
            f"/api/v1/dating/moderation/reports/{report.id}/",
            {
                "status": "investigating",
                "priority": "high",
                "resolution": "Contacted the reporter",
                "assigned_to_id": str(moderator.id),
            },
            format="json",
        )
        force_authenticate(update_request, user=moderator)
        updated = TrustSafetyReportsView.as_view()(update_request, report_id=report.id)

    assert updated.status_code == 200
    report.refresh_from_db()
    assert report.status == DatingReport.Status.INVESTIGATING
    assert report.priority == DatingReport.Priority.HIGH
    assert report.assigned_to_id == moderator.id
    assert DatingSafetyAuditEvent.objects.filter(
        report=report, actor=moderator, action="report_updated"
    ).exists()


@pytest.mark.django_db
def test_user_can_appeal_rejected_moment_and_moderator_can_accept_appeal():
    author = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Author")
    moderator = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Moderator")
    moment = DatingMoment.objects.create(
        author=author,
        caption="My rejected post",
        moderation_status=DatingMoment.ModerationStatus.REJECTED,
        moderation_reason="Needs context",
    )
    factory = APIRequestFactory()

    appeal_request = factory.post(
        f"/api/v1/dating/moments/{moment.id}/appeal/",
        {"message": "This post does not violate the community rules."},
        format="json",
    )
    force_authenticate(appeal_request, user=author)
    submitted = DatingMomentAppealView.as_view()(appeal_request, moment_id=moment.id)
    assert submitted.status_code == 201
    appeal_id = submitted.data["id"]

    with override_settings(DATING_MOMENT_MODERATOR_USER_IDS=[str(moderator.id)]):
        queue_request = factory.get("/api/v1/dating/moderation/appeals/")
        force_authenticate(queue_request, user=moderator)
        queue = TrustSafetyAppealsView.as_view()(queue_request)
        assert queue.status_code == 200
        assert queue.data["items"][0]["id"] == appeal_id

        review_request = factory.patch(
            f"/api/v1/dating/moderation/appeals/{appeal_id}/",
            {"status": "accepted", "reviewer_note": "Second review confirms the content is allowed."},
            format="json",
        )
        force_authenticate(review_request, user=moderator)
        reviewed = TrustSafetyAppealsView.as_view()(review_request, appeal_id=appeal_id)

    assert reviewed.status_code == 200
    moment.refresh_from_db()
    appeal = DatingModerationAppeal.objects.get(id=appeal_id)
    assert appeal.status == DatingModerationAppeal.Status.ACCEPTED
    assert moment.moderation_status == DatingMoment.ModerationStatus.APPROVED
    assert moment.moderation_reviewed_by_id == moderator.id
    assert DatingSafetyAuditEvent.objects.filter(
        appeal=appeal, actor=moderator, action="appeal_reviewed"
    ).exists()


@pytest.mark.django_db
def test_appeal_is_limited_to_authors_own_rejected_moments():
    author = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Author")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Other")
    moment = DatingMoment.objects.create(
        author=author, caption="Rejected", moderation_status=DatingMoment.ModerationStatus.REJECTED
    )
    request = APIRequestFactory().post(
        f"/api/v1/dating/moments/{moment.id}/appeal/",
        {"message": "Please review"},
        format="json",
    )
    force_authenticate(request, user=other)
    response = DatingMomentAppealView.as_view()(request, moment_id=moment.id)
    assert response.status_code == 404
    assert DatingModerationAppeal.objects.count() == 0
