from django.core.exceptions import ValidationError
from django.db import transaction

from apps.academic.models import AcademicCourseCompletion, AcademicCoursePrerequisite


class AcademicPrerequisiteService:
    @staticmethod
    @transaction.atomic
    def add_rule(*, organization, course, prerequisite_course, is_mandatory=True):
        if course.organization_id != organization.id or prerequisite_course.organization_id != organization.id:
            raise ValidationError({"course": "Both courses must belong to the selected organization."})
        if course.pk == prerequisite_course.pk:
            raise ValidationError({"prerequisite_course": "A course cannot require itself."})

        # Adding A -> B is invalid when B already (transitively) depends on A.
        pending = [prerequisite_course.pk]
        visited = set()
        while pending:
            current_id = pending.pop()
            if current_id == course.pk:
                raise ValidationError({"prerequisite_course": "This rule would create a prerequisite cycle."})
            if current_id in visited:
                continue
            visited.add(current_id)
            pending.extend(
                AcademicCoursePrerequisite.objects.filter(
                    organization=organization,
                    course_id=current_id,
                    deleted_at__isnull=True,
                ).values_list("prerequisite_course_id", flat=True)
            )

        rule = AcademicCoursePrerequisite(
            organization=organization,
            course=course,
            prerequisite_course=prerequisite_course,
            is_mandatory=is_mandatory,
        )
        rule.full_clean()
        rule.save()
        return rule

    @staticmethod
    def evaluate(*, organization, membership, course):
        rules = AcademicCoursePrerequisite.objects.filter(
            organization=organization,
            course=course,
            is_mandatory=True,
            deleted_at__isnull=True,
        ).select_related("prerequisite_course")
        missing = []
        for rule in rules:
            verified = AcademicCourseCompletion.objects.filter(
                organization=organization,
                membership=membership,
                course=rule.prerequisite_course,
                status=AcademicCourseCompletion.Status.VERIFIED,
                deleted_at__isnull=True,
                verified_at__isnull=False,
                verified_by__isnull=False,
            ).exists()
            if not verified:
                missing.append({
                    "course_id": str(rule.prerequisite_course_id),
                    "course_code": rule.prerequisite_course.code,
                    "course_name": rule.prerequisite_course.name,
                })
        return {
            "eligible": not missing,
            "status": "passed" if not missing else "pending_evidence",
            "missing_prerequisites": missing,
        }

    @staticmethod
    def ensure_eligible(*, organization, membership, course):
        result = AcademicPrerequisiteService.evaluate(
            organization=organization,
            membership=membership,
            course=course,
        )
        if not result["eligible"]:
            codes = ", ".join(item["course_code"] for item in result["missing_prerequisites"])
            raise ValidationError({
                "prerequisites": f"Verified completion evidence is required for: {codes}."
            })
        return result
