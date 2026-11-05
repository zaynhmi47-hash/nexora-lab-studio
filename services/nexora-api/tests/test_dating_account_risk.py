import pytest

from apps.dating_social_professional.account_risk import recalculate_account_risk
from apps.dating_social_professional.models import (
    DatingAccountRiskProfile,
    DatingAccountSecurityEvent,
    DatingBlock,
    DatingReport,
)
from apps.identity.models import NexoraUser


@pytest.mark.django_db
def test_only_moderator_actioned_reports_contribute_to_account_risk():
    reporter = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Reporter")
    subject = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Subject")
    DatingReport.objects.create(
        reporter=reporter, reported=subject, reason=DatingReport.Reason.SCAM,
        status=DatingReport.Status.OPEN, priority=DatingReport.Priority.URGENT,
    )

    profile = recalculate_account_risk(subject)

    assert profile.score == 0
    assert profile.level == DatingAccountRiskProfile.Level.LOW
    assert profile.confirmed_report_count == 0


@pytest.mark.django_db
def test_confirmed_reports_and_distinct_blocks_produce_explainable_risk_score():
    reporters = [
        NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name=f"Reporter {index}")
        for index in range(2)
    ]
    subject = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Subject")
    for index, reporter in enumerate(reporters):
        DatingReport.objects.create(
            reporter=reporter,
            reported=subject,
            reason=DatingReport.Reason.SCAM,
            status=DatingReport.Status.ACTION_TAKEN,
            priority=DatingReport.Priority.URGENT if index == 0 else DatingReport.Priority.HIGH,
        )
        DatingBlock.objects.create(blocker=reporter, blocked=subject)

    profile = recalculate_account_risk(subject)

    # 2 confirmed reports (40) + 1 urgent bonus (10) + 2 distinct blockers (4).
    assert profile.score == 54
    assert profile.level == DatingAccountRiskProfile.Level.HIGH
    assert profile.signals["policy_version"] == "dating-risk-v1"
    assert profile.signals["confirmed_reports"] == 2
    assert DatingAccountSecurityEvent.objects.filter(
        subject=subject,
        event_type=DatingAccountSecurityEvent.Type.RISK_RECALCULATED,
    ).exists()


@pytest.mark.django_db
def test_risk_score_is_capped_and_recalculation_updates_existing_profile():
    subject = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Subject")
    reporters = [
        NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name=f"Reporter {index}")
        for index in range(5)
    ]
    for reporter in reporters:
        DatingReport.objects.create(
            reporter=reporter,
            reported=subject,
            reason=DatingReport.Reason.HARASSMENT,
            status=DatingReport.Status.ACTION_TAKEN,
            priority=DatingReport.Priority.URGENT,
        )
        DatingBlock.objects.create(blocker=reporter, blocked=subject)

    first = recalculate_account_risk(subject)
    second = recalculate_account_risk(subject)

    assert first.pk == second.pk
    assert second.score == 80
    assert second.level == DatingAccountRiskProfile.Level.CRITICAL
    assert DatingAccountRiskProfile.objects.filter(user=subject).count() == 1
