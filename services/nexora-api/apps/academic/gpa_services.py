from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from apps.academic.grading_scale_services import AcademicGradingScaleService
from apps.academic.models import (
    AcademicFinalGrade,
    AcademicGpaCalculation,
    AcademicGpaPolicy,
    AcademicGradingScale,
    AcademicTerm,
)
from apps.organizations.models import Membership, Organization


class AcademicGpaService:
    """Versioned GPA policy and reproducible term/cumulative GPA snapshots."""

    @staticmethod
    @transaction.atomic
    def publish_policy(*, organization, grading_scale, retake_strategy, include_failed_grades):
        Organization.objects.select_for_update().get(pk=organization.pk)
        if grading_scale.organization_id != organization.pk:
            raise ValidationError({"grading_scale": "Grading scale belongs to another organization."})
        if not grading_scale.is_active or grading_scale.deleted_at is not None:
            raise ValidationError({"grading_scale": "A new GPA policy must use the currently active grading scale."})
        if retake_strategy not in AcademicGpaPolicy.RetakeStrategy.values:
            raise ValidationError({"retake_strategy": "Unsupported retake strategy."})
        current = AcademicGpaPolicy.objects.select_for_update().filter(
            organization=organization, is_active=True, deleted_at__isnull=True,
        ).first()
        if current and (
            current.grading_scale_id == grading_scale.pk
            and current.retake_strategy == retake_strategy
            and current.include_failed_grades == include_failed_grades
        ):
            return current
        version = (AcademicGpaPolicy.objects.filter(
            organization=organization, deleted_at__isnull=True,
        ).aggregate(value=Max("version"))["value"] or 0) + 1
        if current:
            current.is_active = False
            current.save(update_fields=("is_active", "updated_at"))
        policy = AcademicGpaPolicy(
            organization=organization, grading_scale=grading_scale,
            retake_strategy=retake_strategy,
            include_failed_grades=include_failed_grades,
            version=version,
        )
        policy.full_clean()
        policy.save()
        return policy

    @staticmethod
    def _resolve_attempts(grades, *, policy):
        attempts = []
        for grade in grades:
            if grade.credit_units_snapshot is None or grade.credit_units_snapshot <= 0:
                raise ValidationError({
                    "grade_provenance": (
                        "A published grade is missing its historical credit snapshot. "
                        "It must be reviewed before GPA calculation."
                    )
                })
            if grade.grading_policy_id is None or grade.final_score is None:
                raise ValidationError({"grade_provenance": "A published grade is missing grading-policy provenance."})
            normalized = (grade.final_score / grade.grading_policy.max_score * Decimal("100"))
            band = AcademicGradingScaleService.resolve_grade(
                grading_scale=policy.grading_scale, percentage=normalized,
            )
            attempts.append({
                "grade": grade,
                "band": band,
                "grade_points": band.grade_points,
                "is_passing": band.is_passing,
                "credits": grade.credit_units_snapshot,
            })

        return attempts

    @staticmethod
    def _select_attempts(attempts, *, policy):
        by_course = {}
        for attempt in attempts:
            by_course.setdefault(attempt["grade"].offering.course_id, []).append(attempt)
        selected = []
        for course_attempts in by_course.values():
            if policy.retake_strategy == AcademicGpaPolicy.RetakeStrategy.FIRST:
                chosen = min(course_attempts, key=lambda item: (item["grade"].published_at, str(item["grade"].pk)))
            elif policy.retake_strategy == AcademicGpaPolicy.RetakeStrategy.LATEST:
                chosen = max(course_attempts, key=lambda item: (item["grade"].published_at, str(item["grade"].pk)))
            else:
                chosen = max(
                    course_attempts,
                    key=lambda item: (item["grade_points"], item["grade"].published_at, str(item["grade"].pk)),
                )
            selected.append(chosen)
        return selected

    @staticmethod
    def _summarize(selected, *, all_attempts, policy):
        attempted = sum(item["credits"] for item in all_attempts)
        earned = sum(item["credits"] for item in selected if item["is_passing"])
        denominator = sum(
            item["credits"] for item in selected
            if policy.include_failed_grades or item["is_passing"]
        )
        numerator = sum(
            (item["grade_points"] * item["credits"] for item in selected
             if policy.include_failed_grades or item["is_passing"]),
            Decimal("0"),
        )
        gpa = None if denominator == 0 else (numerator / Decimal(denominator)).quantize(
            Decimal("0.001"), rounding=ROUND_HALF_UP,
        )
        details = [
            {
                "final_grade_id": str(item["grade"].pk),
                "course_id": str(item["grade"].offering.course_id),
                "course_code": item["grade"].course_code_snapshot,
                "course_name": item["grade"].course_name_snapshot,
                "credit_units": item["credits"],
                "percentage": str((
                    item["grade"].final_score / item["grade"].grading_policy.max_score
                    * Decimal("100")
                ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                "letter_grade": item["band"].letter_grade,
                "grade_points": str(item["grade_points"]),
                "is_passing": item["is_passing"],
                "published_at": item["grade"].published_at.isoformat(),
            }
            for item in selected
        ]
        return {
            "gpa": gpa,
            "attempted_credits": attempted,
            "gpa_credits": denominator,
            "earned_credits": earned,
            "details": details,
        }

    @staticmethod
    @transaction.atomic
    def calculate(*, organization, membership, term, calculated_by):
        if membership.organization_id != organization.pk or membership.status != Membership.Status.ACTIVE:
            raise ValidationError({"membership": "An active student membership in this organization is required."})
        if term.organization_id != organization.pk:
            raise ValidationError({"term": "Academic term belongs to another organization."})
        policy = AcademicGpaPolicy.objects.select_related("grading_scale").filter(
            organization=organization, is_active=True, deleted_at__isnull=True,
        ).first()
        if policy is None:
            raise ValidationError({"gpa_policy": "Publish a GPA policy before calculating GPA."})

        grades = list(AcademicFinalGrade.objects.filter(
            organization=organization,
            membership=membership,
            status=AcademicFinalGrade.Status.PUBLISHED,
            deleted_at__isnull=True,
            offering__classroom__term__starts_on__lte=term.starts_on,
        ).select_related(
            "offering__course", "offering__classroom__term",
            "grading_policy",
        ).order_by("published_at", "id"))

        term_grades = [grade for grade in grades if grade.offering.classroom.term_id == term.pk]
        term_attempts = AcademicGpaService._resolve_attempts(term_grades, policy=policy)
        cumulative_attempts = AcademicGpaService._resolve_attempts(grades, policy=policy)
        cumulative_selected = AcademicGpaService._select_attempts(cumulative_attempts, policy=policy)
        term_selected = AcademicGpaService._select_attempts(term_attempts, policy=policy)
        term_summary = AcademicGpaService._summarize(
            term_selected, all_attempts=term_attempts, policy=policy,
        )
        cumulative_summary = AcademicGpaService._summarize(
            cumulative_selected, all_attempts=cumulative_attempts, policy=policy,
        )

        latest_version = AcademicGpaCalculation.objects.filter(
            organization=organization, membership=membership, term=term,
            deleted_at__isnull=True,
        ).aggregate(value=Max("calculation_version"))["value"] or 0
        calculation = AcademicGpaCalculation(
            organization=organization,
            membership=membership,
            term=term,
            policy=policy,
            calculation_version=latest_version + 1,
            term_gpa=term_summary["gpa"],
            cumulative_gpa=cumulative_summary["gpa"],
            term_attempted_credits=term_summary["attempted_credits"],
            term_gpa_credits=term_summary["gpa_credits"],
            term_earned_credits=term_summary["earned_credits"],
            cumulative_attempted_credits=cumulative_summary["attempted_credits"],
            cumulative_gpa_credits=cumulative_summary["gpa_credits"],
            cumulative_earned_credits=cumulative_summary["earned_credits"],
            details={
                "policy_version": policy.version,
                "grading_scale_id": str(policy.grading_scale_id),
                "grading_scale_version": policy.grading_scale.version,
                "retake_strategy": policy.retake_strategy,
                "include_failed_grades": policy.include_failed_grades,
                "term": term_summary["details"],
                "cumulative": cumulative_summary["details"],
            },
            calculated_at=timezone.now(),
            calculated_by=calculated_by,
        )
        calculation.full_clean()
        calculation.save()
        return calculation
