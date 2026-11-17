import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from apps.academic.grading_scale_services import AcademicGradingScaleService
from apps.academic.models import (
    AcademicFinalGrade,
    AcademicGpaCalculation,
    AcademicProgram,
    AcademicTerm,
    AcademicTranscript,
)
from apps.organizations.models import Membership, Organization


class AcademicTranscriptService:
    """Issues verifiable, immutable transcript snapshots from published academic records."""

    @staticmethod
    def _checksum(snapshot):
        canonical = json.dumps(
            snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
        ).encode("utf-8")
        return hashlib.sha256(canonical).hexdigest()

    @staticmethod
    def verify(transcript):
        return AcademicTranscriptService._checksum(transcript.snapshot) == transcript.snapshot_checksum

    @staticmethod
    def _gpa_for_rows(rows, *, include_failed_grades):
        eligible = [
            row for row in rows
            if include_failed_grades or row.get("is_passing", False)
        ]
        credits = sum(int(row["credit_units"]) for row in eligible)
        if credits == 0:
            return None, 0
        weighted = sum(
            (Decimal(str(row["grade_points"])) * int(row["credit_units"]) for row in eligible),
            Decimal("0"),
        )
        return (weighted / Decimal(credits)).quantize(
            Decimal("0.001"), rounding=ROUND_HALF_UP,
        ), credits

    @staticmethod
    def _build_snapshot(*, organization, membership, program, through_term, issued_at):
        grades = list(AcademicFinalGrade.objects.filter(
            organization=organization,
            membership=membership,
            offering__classroom__program=program,
            offering__classroom__term__starts_on__lte=through_term.starts_on,
            status=AcademicFinalGrade.Status.PUBLISHED,
            deleted_at__isnull=True,
        ).select_related(
            "offering__course", "offering__classroom__term",
            "offering__classroom__program", "grading_policy",
        ).order_by(
            "offering__classroom__term__starts_on",
            "course_code_snapshot", "published_at", "id",
        ))

        if not grades:
            raise ValidationError({"grades": "No published grades exist for this program and transcript period."})

        missing = [
            str(grade.pk) for grade in grades
            if (
                not grade.course_code_snapshot
                or not grade.course_name_snapshot
                or not grade.credit_units_snapshot
                or grade.grading_policy_id is None
                or grade.final_score is None
                or grade.published_at is None
            )
        ]
        if missing:
            raise ValidationError({
                "grade_provenance": (
                    "Transcript issuance is blocked because published grades are missing "
                    "historical course, credit, or grading-policy provenance."
                ),
                "grade_ids": missing,
            })

        grades_by_term = {}
        for grade in grades:
            term = grade.offering.classroom.term
            grades_by_term.setdefault(term.pk, {"term": term, "grades": []})["grades"].append(grade)

        course_ids = {str(grade.offering.course_id) for grade in grades}
        term_snapshots = []
        for term_data in sorted(
            grades_by_term.values(),
            key=lambda item: (item["term"].starts_on, item["term"].code),
        ):
            term = term_data["term"]
            term_grades = term_data["grades"]
            calculation = AcademicGpaCalculation.objects.filter(
                organization=organization,
                membership=membership,
                term=term,
                deleted_at__isnull=True,
            ).select_related("policy__grading_scale").order_by("-calculation_version").first()
            if calculation is None:
                raise ValidationError({
                    "gpa_calculation": (
                        f"GPA for term {term.code} must be calculated before issuing the transcript."
                    )
                })
            latest_grade_update = max(grade.updated_at for grade in term_grades)
            if calculation.calculated_at < latest_grade_update:
                raise ValidationError({
                    "gpa_calculation": (
                        f"GPA for term {term.code} is stale. Recalculate GPA after the latest grade revision."
                    )
                })

            include_failed = calculation.details.get("include_failed_grades", True)
            term_gpa_rows = [
                row for row in calculation.details.get("term", [])
                if row.get("course_id") in course_ids
            ]
            cumulative_gpa_rows = [
                row for row in calculation.details.get("cumulative", [])
                if row.get("course_id") in course_ids
            ]
            term_gpa, term_gpa_credits = AcademicTranscriptService._gpa_for_rows(
                term_gpa_rows, include_failed_grades=include_failed,
            )
            cumulative_gpa, cumulative_gpa_credits = AcademicTranscriptService._gpa_for_rows(
                cumulative_gpa_rows, include_failed_grades=include_failed,
            )

            grade_rows = []
            for grade in term_grades:
                percentage = (
                    grade.final_score / grade.grading_policy.max_score * Decimal("100")
                )
                band = AcademicGradingScaleService.resolve_grade(
                    grading_scale=calculation.policy.grading_scale,
                    percentage=percentage,
                )
                grade_rows.append({
                    "final_grade_id": str(grade.pk),
                    "course_id": str(grade.offering.course_id),
                    "course_code": grade.course_code_snapshot,
                    "course_name": grade.course_name_snapshot,
                    "credit_units": grade.credit_units_snapshot,
                    "score": str(grade.final_score),
                    "maximum_score": str(grade.grading_policy.max_score),
                    "percentage": str(percentage.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
                    "letter_grade": band.letter_grade,
                    "grade_points": str(band.grade_points),
                    "outcome": grade.outcome,
                    "is_passing": band.is_passing,
                    "published_at": grade.published_at.isoformat(),
                    "grading_policy_id": str(grade.grading_policy_id),
                    "grading_policy_version": grade.grading_policy.version,
                })

            term_snapshots.append({
                "term_id": str(term.pk),
                "term_code": term.code,
                "term_name": term.name,
                "starts_on": term.starts_on.isoformat(),
                "ends_on": term.ends_on.isoformat(),
                "grades": grade_rows,
                "term_gpa": str(term_gpa) if term_gpa is not None else None,
                "term_gpa_credits": term_gpa_credits,
                "term_attempted_credits": sum(grade.credit_units_snapshot for grade in term_grades),
                "term_earned_credits": sum(
                    int(row["credit_units"])
                    for row in term_gpa_rows
                    if row.get("is_passing", False)
                ),
                "cumulative_gpa": str(cumulative_gpa) if cumulative_gpa is not None else None,
                "cumulative_gpa_credits": cumulative_gpa_credits,
                "gpa_calculation_id": str(calculation.pk),
                "gpa_calculation_version": calculation.calculation_version,
                "gpa_policy_version": calculation.policy.version,
                "grading_scale_version": calculation.policy.grading_scale.version,
            })

        latest = term_snapshots[-1]
        cumulative_attempted = sum(
            grade.credit_units_snapshot for grade in grades
        )
        cumulative_earned = sum(
            int(row["credit_units"])
            for row in cumulative_gpa_rows
            if row.get("is_passing", False)
        )
        return {
            "schema_version": 1,
            "issued_at": issued_at.isoformat(),
            "organization": {
                "id": str(organization.pk),
                "name": organization.name,
            },
            "student": {
                "membership_id": str(membership.pk),
                "user_id": str(membership.user_id),
                "display_name": membership.user.display_name,
                "email": membership.user.email,
                "student_number": membership.metadata.get("student_number", ""),
            },
            "program": {
                "id": str(program.pk),
                "code": program.code,
                "name": program.name,
            },
            "period": {
                "through_term_id": str(through_term.pk),
                "through_term_code": through_term.code,
                "through_term_name": through_term.name,
            },
            "summary": {
                "cumulative_gpa": latest["cumulative_gpa"],
                "cumulative_attempted_credits": cumulative_attempted,
                "cumulative_earned_credits": cumulative_earned,
                "terms_included": len(term_snapshots),
                "published_courses_or_attempts": len(grades),
            },
            "terms": term_snapshots,
        }

    @staticmethod
    @transaction.atomic
    def issue(*, organization, membership, program, issued_by, through_term=None):
        Organization.objects.select_for_update().get(pk=organization.pk)
        membership = Membership.objects.select_for_update().select_related("user").get(pk=membership.pk)
        if membership.organization_id != organization.pk or membership.status != Membership.Status.ACTIVE:
            raise ValidationError({"membership": "An active membership in this organization is required."})
        if program.organization_id != organization.pk or not program.is_active:
            raise ValidationError({"program": "An active program in this organization is required."})
        if through_term is None:
            latest_grade = AcademicFinalGrade.objects.filter(
                organization=organization,
                membership=membership,
                offering__classroom__program=program,
                status=AcademicFinalGrade.Status.PUBLISHED,
                deleted_at__isnull=True,
            ).select_related("offering__classroom__term").order_by(
                "-offering__classroom__term__starts_on",
            ).first()
            through_term = latest_grade.offering.classroom.term if latest_grade else None
        if through_term is None or through_term.organization_id != organization.pk:
            raise ValidationError({"through_term": "A valid transcript period is required."})

        issued_at = timezone.now()
        snapshot = AcademicTranscriptService._build_snapshot(
            organization=organization,
            membership=membership,
            program=program,
            through_term=through_term,
            issued_at=issued_at,
        )
        version = (AcademicTranscript.objects.filter(
            organization=organization,
            membership=membership,
            program=program,
            deleted_at__isnull=True,
        ).aggregate(value=Max("version"))["value"] or 0) + 1
        transcript = AcademicTranscript(
            organization=organization,
            membership=membership,
            program=program,
            transcript_number=f"TR-{uuid.uuid4().hex[:20].upper()}",
            version=version,
            status=AcademicTranscript.Status.ISSUED,
            snapshot=snapshot,
            snapshot_checksum=AcademicTranscriptService._checksum(snapshot),
            issued_at=issued_at,
            issued_by=issued_by,
        )
        transcript.full_clean()
        transcript.save()
        return transcript

    @staticmethod
    @transaction.atomic
    def revoke(*, transcript, revoked_by, reason):
        transcript = AcademicTranscript.objects.select_for_update().get(pk=transcript.pk)
        if transcript.status == AcademicTranscript.Status.REVOKED:
            return transcript
        if not reason or not reason.strip():
            raise ValidationError({"reason": "A reason is required to revoke a transcript."})
        transcript.status = AcademicTranscript.Status.REVOKED
        transcript.revoked_at = timezone.now()
        transcript.revoked_by = revoked_by
        transcript.revocation_reason = reason.strip()
        transcript.full_clean()
        transcript.save(update_fields=(
            "status", "revoked_at", "revoked_by", "revocation_reason", "updated_at",
        ))
        return transcript
