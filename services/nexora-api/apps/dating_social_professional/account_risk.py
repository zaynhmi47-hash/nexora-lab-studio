from django.db import transaction
from django.utils import timezone

from .models import (
    DatingAccountRiskProfile,
    DatingAccountSecurityEvent,
    DatingBlock,
    DatingReport,
)


def _risk_level(score):
    if score >= 65:
        return DatingAccountRiskProfile.Level.CRITICAL
    if score >= 40:
        return DatingAccountRiskProfile.Level.HIGH
    if score >= 20:
        return DatingAccountRiskProfile.Level.MEDIUM
    return DatingAccountRiskProfile.Level.LOW


@transaction.atomic
def recalculate_account_risk(user, *, actor=None):
    """Calculate an explainable private risk indicator; never enforce sanctions."""
    confirmed_reports = DatingReport.objects.filter(
        reported=user,
        status=DatingReport.Status.ACTION_TAKEN,
        deleted_at__isnull=True,
    )
    report_count = confirmed_reports.count()
    urgent_confirmed_reports = confirmed_reports.filter(
        priority=DatingReport.Priority.URGENT
    ).count()
    received_blocks = DatingBlock.objects.filter(
        blocked=user, deleted_at__isnull=True
    ).values("blocker_id").distinct().count()

    report_points = min(report_count, 3) * 20
    urgent_points = min(urgent_confirmed_reports, 1) * 10
    block_points = min(received_blocks, 10) * 2
    score = min(80, report_points + urgent_points + block_points)
    level = _risk_level(score)
    signals = {
        "confirmed_reports": report_count,
        "urgent_confirmed_reports": urgent_confirmed_reports,
        "distinct_blockers": received_blocks,
        "weights": {
            "confirmed_report": 20,
            "urgent_confirmed_report_bonus": 10,
            "distinct_blocker": 2,
        },
        "policy_version": "dating-risk-v1",
    }

    profile, created = DatingAccountRiskProfile.objects.select_for_update().get_or_create(
        user=user,
        defaults={
            "score": score,
            "level": level,
            "confirmed_report_count": report_count,
            "received_block_count": received_blocks,
            "signals": signals,
            "calculated_at": timezone.now(),
        },
    )
    previous_level = profile.level
    previous_score = profile.score
    profile.score = score
    profile.level = level
    profile.confirmed_report_count = report_count
    profile.received_block_count = received_blocks
    profile.signals = signals
    profile.calculated_at = timezone.now()
    profile.save(update_fields=[
        "score", "level", "confirmed_report_count", "received_block_count",
        "signals", "calculated_at", "updated_at",
    ])
    if created or previous_level != level or previous_score != score:
        DatingAccountSecurityEvent.objects.create(
            actor=actor,
            subject=user,
            event_type=DatingAccountSecurityEvent.Type.RISK_RECALCULATED,
            previous_value=f"{previous_level}:{previous_score}",
            new_value=f"{level}:{score}",
            reason="Risk profile recalculated from reviewed reports and block signals.",
            metadata={"policy_version": "dating-risk-v1"},
        )
    return profile
