from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.academic.models import AcademicCourseOffering, AcademicStudyPlan, AcademicStudyPlanItem


class AcademicStudyPlanService:
    @staticmethod
    @transaction.atomic
    def create(*, organization, membership, term, max_credit_units=24):
        if term.organization_id != organization.id or term.status != "active":
            raise ValidationError({"term": "An active term from this organization is required."})
        plan = AcademicStudyPlan(
            organization=organization, membership=membership, term=term,
            max_credit_units=max_credit_units,
        )
        plan.full_clean()
        try:
            plan.save()
        except IntegrityError as exc:
            raise ValidationError({"study_plan": "A study plan already exists for this member and term."}) from exc
        return plan

    @staticmethod
    @transaction.atomic
    def add_offering(*, plan_id, organization, offering_id):
        plan = AcademicStudyPlan.objects.select_for_update().filter(
            id=plan_id, organization=organization, deleted_at__isnull=True,
        ).first()
        if plan is None:
            raise ValidationError({"study_plan": "Study plan not found."})
        if plan.status != AcademicStudyPlan.Status.DRAFT:
            raise ValidationError({"status": "Only draft study plans can be edited."})
        offering = AcademicCourseOffering.objects.select_for_update().filter(
            id=offering_id, organization=organization, deleted_at__isnull=True,
            status=AcademicCourseOffering.Status.OPEN,
        ).select_related("classroom", "course").first()
        if offering is None or offering.classroom.term_id != plan.term_id:
            raise ValidationError({"offering": "An open offering in the selected term is required."})
        credit_units = offering.curriculum_entry.credit_units if offering.curriculum_entry_id else offering.course.credit_units
        current = sum(plan.items.filter(deleted_at__isnull=True).values_list("credit_units_snapshot", flat=True))
        if current + credit_units > plan.max_credit_units:
            raise ValidationError({"credit_units": "Adding this course exceeds the study plan credit limit."})
        item = AcademicStudyPlanItem(
            study_plan=plan, organization=organization, offering=offering,
            credit_units_snapshot=credit_units,
        )
        item.full_clean()
        try:
            item.save()
        except IntegrityError as exc:
            raise ValidationError({"offering": "This offering is already in the study plan."}) from exc
        return item

    @staticmethod
    @transaction.atomic
    def submit(*, plan_id, organization):
        plan = AcademicStudyPlan.objects.select_for_update().filter(
            id=plan_id, organization=organization, deleted_at__isnull=True,
        ).first()
        if plan is None:
            raise ValidationError({"study_plan": "Study plan not found."})
        if plan.status != AcademicStudyPlan.Status.DRAFT:
            raise ValidationError({"status": "Only draft study plans can be submitted."})
        if not plan.items.filter(deleted_at__isnull=True).exists():
            raise ValidationError({"items": "At least one course must be selected."})
        plan.status = AcademicStudyPlan.Status.SUBMITTED
        plan.submitted_at = timezone.now()
        plan.save(update_fields=("status", "submitted_at", "updated_at"))
        return plan
