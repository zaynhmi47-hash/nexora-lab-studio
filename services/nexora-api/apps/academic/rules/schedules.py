from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.academic.models import AcademicOfferingSchedule, AcademicStudyPlanItem


class AcademicScheduleService:
    @staticmethod
    @transaction.atomic
    def create_slot(
        *,
        organization,
        offering,
        weekday,
        starts_at,
        ends_at,
        location_label="",
        delivery_details="",
    ):
        if offering.organization_id != organization.id:
            raise ValidationError({"offering": "Offering must belong to the selected organization."})
        # Serialize edits for this offering and prevent overlapping sessions on the same day.
        offering.__class__.objects.select_for_update().get(pk=offering.pk, organization=organization)
        overlaps = AcademicOfferingSchedule.objects.filter(
            organization=organization,
            offering=offering,
            weekday=weekday,
            deleted_at__isnull=True,
            starts_at__lt=ends_at,
            ends_at__gt=starts_at,
        ).exists()
        if overlaps:
            raise ValidationError({"schedule": "This offering already has an overlapping session on that weekday."})
        slot = AcademicOfferingSchedule(
            organization=organization,
            offering=offering,
            weekday=weekday,
            starts_at=starts_at,
            ends_at=ends_at,
            location_label=location_label,
            delivery_details=delivery_details,
        )
        slot.full_clean()
        try:
            slot.save()
        except IntegrityError as exc:
            raise ValidationError({"schedule": "An identical schedule slot already exists."}) from exc
        return slot

    @staticmethod
    def evaluate_candidate(*, plan, offering):
        existing_items = AcademicStudyPlanItem.objects.filter(
            study_plan=plan,
            organization=plan.organization,
            deleted_at__isnull=True,
        ).select_related("offering")
        existing_offerings = [item.offering for item in existing_items]
        candidate_slots = list(
            AcademicOfferingSchedule.objects.filter(
                organization=plan.organization,
                offering=offering,
                deleted_at__isnull=True,
            )
        )
        conflicts = []
        for existing_offering in existing_offerings:
            existing_slots = AcademicOfferingSchedule.objects.filter(
                organization=plan.organization,
                offering=existing_offering,
                deleted_at__isnull=True,
            )
            for candidate in candidate_slots:
                for current in existing_slots:
                    if (
                        candidate.weekday == current.weekday
                        and candidate.starts_at < current.ends_at
                        and candidate.ends_at > current.starts_at
                    ):
                        conflicts.append({
                            "offering_code": existing_offering.code,
                            "weekday": candidate.weekday,
                            "starts_at": candidate.starts_at.isoformat(),
                            "ends_at": candidate.ends_at.isoformat(),
                            "conflicting_starts_at": current.starts_at.isoformat(),
                            "conflicting_ends_at": current.ends_at.isoformat(),
                        })
        return {
            "has_conflict": bool(conflicts),
            "status": "conflict" if conflicts else ("scheduled" if candidate_slots else "schedule_pending"),
            "conflicts": conflicts,
        }

    @staticmethod
    def ensure_candidate_has_no_conflict(*, plan, offering):
        result = AcademicScheduleService.evaluate_candidate(plan=plan, offering=offering)
        if result["has_conflict"]:
            codes = ", ".join(sorted({item["offering_code"] for item in result["conflicts"]}))
            raise ValidationError({
                "schedule": f"Schedule overlaps with an existing course offering: {codes}."
            })
        return result

    @staticmethod
    def evaluate_plan(*, plan):
        items = list(
            AcademicStudyPlanItem.objects.filter(
                study_plan=plan,
                organization=plan.organization,
                deleted_at__isnull=True,
            ).select_related("offering")
        )
        conflicts = []
        unscheduled = []
        for index, item in enumerate(items):
            slots = list(AcademicOfferingSchedule.objects.filter(
                organization=plan.organization,
                offering=item.offering,
                deleted_at__isnull=True,
            ))
            if not slots:
                unscheduled.append(item.offering.code)
            for other in items[index + 1:]:
                other_slots = AcademicOfferingSchedule.objects.filter(
                    organization=plan.organization,
                    offering=other.offering,
                    deleted_at__isnull=True,
                )
                for left in slots:
                    for right in other_slots:
                        if (
                            left.weekday == right.weekday
                            and left.starts_at < right.ends_at
                            and left.ends_at > right.starts_at
                        ):
                            conflicts.append({
                                "offering_codes": [item.offering.code, other.offering.code],
                                "weekday": left.weekday,
                                "first": [left.starts_at.isoformat(), left.ends_at.isoformat()],
                                "second": [right.starts_at.isoformat(), right.ends_at.isoformat()],
                            })
        return {
            "has_conflict": bool(conflicts),
            "status": "conflict" if conflicts else ("schedule_pending" if unscheduled else "clear"),
            "conflicts": conflicts,
            "unscheduled_offerings": unscheduled,
        }

    @staticmethod
    def ensure_plan_has_no_conflicts(*, plan):
        result = AcademicScheduleService.evaluate_plan(plan=plan)
        if result["has_conflict"]:
            raise ValidationError({"schedule": "The study plan contains overlapping course schedules."})
        return result
