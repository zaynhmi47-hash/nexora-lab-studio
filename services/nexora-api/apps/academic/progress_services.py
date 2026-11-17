import hashlib
import json

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from apps.academic.models import (
    AcademicCourseCompletion,
    AcademicCoursePrerequisite,
    AcademicFinalGrade,
    AcademicProgramEnrollment,
    AcademicProgressSnapshot,
    AcademicCurriculumCourse,
)
from apps.organizations.models import Membership


class AcademicProgressService:
    """Builds deterministic progress from published grades and verified completion evidence."""

    @staticmethod
    def checksum(payload):
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    @staticmethod
    def calculate(enrollment):
        if enrollment.status != AcademicProgramEnrollment.Status.ACTIVE:
            raise ValidationError({"enrollment": "Only active program enrollments can be evaluated."})
        if enrollment.membership.status != Membership.Status.ACTIVE:
            raise ValidationError({"membership": "An active organization membership is required."})

        curriculum = list(AcademicCurriculumCourse.objects.active().filter(
            organization=enrollment.organization,
            program=enrollment.program,
            curriculum_version=enrollment.curriculum_version,
            is_active=True,
        ).select_related("course").order_by("recommended_term", "course__code"))
        if not curriculum:
            raise ValidationError({
                "curriculum": "No active curriculum courses exist for the enrolled curriculum version."
            })

        grade_rows = list(AcademicFinalGrade.objects.active().filter(
            organization=enrollment.organization,
            membership=enrollment.membership,
            offering__classroom__program=enrollment.program,
            status=AcademicFinalGrade.Status.PUBLISHED,
        ).select_related("offering__course"))
        verified_rows = list(AcademicCourseCompletion.objects.active().filter(
            organization=enrollment.organization,
            membership=enrollment.membership,
            status=AcademicCourseCompletion.Status.VERIFIED,
        ).select_related("course"))

        passed_course_ids = {
            row.offering.course_id for row in grade_rows
            if row.outcome == AcademicFinalGrade.Outcome.PASSED
        }
        passed_course_ids.update(row.course_id for row in verified_rows)

        required = [row for row in curriculum if row.requirement == AcademicCurriculumCourse.Requirement.REQUIRED]
        electives = [row for row in curriculum if row.requirement == AcademicCurriculumCourse.Requirement.ELECTIVE]
        completed_required = [row for row in required if row.course_id in passed_course_ids]
        remaining_required = [row for row in required if row.course_id not in passed_course_ids]

        required_total_credits = sum(row.credit_units for row in required)
        required_completed_credits = sum(row.credit_units for row in completed_required)
        progress_percent = (
            round(required_completed_credits / required_total_credits * 100, 2)
            if required_total_credits else 0
        )
        attempted_credits = sum(
            row.credit_units_snapshot or 0 for row in grade_rows
        )
        earned_curriculum_credits = sum(
            row.credit_units for row in curriculum if row.course_id in passed_course_ids
        )

        prerequisite_gaps = []
        for row in remaining_required:
            rules = AcademicCoursePrerequisite.objects.active().filter(
                organization=enrollment.organization,
                course_id=row.course_id,
                is_mandatory=True,
            ).select_related("prerequisite_course")
            for rule in rules:
                if rule.prerequisite_course_id not in passed_course_ids:
                    prerequisite_gaps.append({
                        "course_id": str(row.course_id),
                        "course_code": row.course.code,
                        "prerequisite_course_id": str(rule.prerequisite_course_id),
                        "prerequisite_course_code": rule.prerequisite_course.code,
                    })

        blockers = []
        if remaining_required:
            blockers.append("required_courses_incomplete")
        if electives:
            blockers.append("elective_requirement_not_configured")
        if prerequisite_gaps:
            blockers.append("mandatory_prerequisites_incomplete")
        # Graduation policy (minimum GPA, residency, transfer/waiver rules) is not yet modeled.
        blockers.append("graduation_policy_not_configured")

        return {
            "organization_id": str(enrollment.organization_id),
            "membership_id": str(enrollment.membership_id),
            "program_id": str(enrollment.program_id),
            "program_code": enrollment.program.code,
            "curriculum_version": enrollment.curriculum_version,
            "enrollment_id": str(enrollment.pk),
            "as_of": timezone.now().isoformat(),
            "status": enrollment.status,
            "progress": {
                "required_courses_total": len(required),
                "required_courses_completed": len(completed_required),
                "required_courses_remaining": len(remaining_required),
                "required_credits_total": required_total_credits,
                "required_credits_completed": required_completed_credits,
                "required_curriculum_percent": progress_percent,
                "elective_courses_available": len(electives),
                "elective_requirement": "not_configured" if electives else "none",
                "attempted_credits": attempted_credits,
                "earned_curriculum_credits": earned_curriculum_credits,
            },
            "completed_required_courses": [
                {"course_id": str(row.course_id), "code": row.course.code, "credits": row.credit_units}
                for row in completed_required
            ],
            "remaining_required_courses": [
                {"course_id": str(row.course_id), "code": row.course.code, "credits": row.credit_units}
                for row in remaining_required
            ],
            "prerequisite_gaps": prerequisite_gaps,
            "graduation_eligibility": "not_evaluable",
            "graduation_blockers": blockers,
        }

    @staticmethod
    @transaction.atomic
    def create_snapshot(*, enrollment, generated_by):
        enrollment = AcademicProgramEnrollment.objects.select_for_update().select_related(
            "organization", "membership", "program",
        ).get(pk=enrollment.pk)
        payload = AcademicProgressService.calculate(enrollment)
        latest = AcademicProgressSnapshot.objects.filter(
            enrollment=enrollment, deleted_at__isnull=True,
        ).aggregate(value=Max("version"))["value"] or 0
        snapshot = AcademicProgressSnapshot(
            enrollment=enrollment,
            version=latest + 1,
            snapshot=payload,
            snapshot_checksum=AcademicProgressService.checksum(payload),
            generated_at=timezone.now(),
            generated_by=generated_by,
        )
        snapshot.full_clean()
        snapshot.save()
        return snapshot
