from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q

from apps.core.models import AuditableBaseModel


class AcademicOfferingSchedule(AuditableBaseModel):
    class Weekday(models.IntegerChoices):
        MONDAY = 0, "Monday"
        TUESDAY = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY = 3, "Thursday"
        FRIDAY = 4, "Friday"
        SATURDAY = 5, "Saturday"
        SUNDAY = 6, "Sunday"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_offering_schedules",
    )
    offering = models.ForeignKey(
        "academic.AcademicCourseOffering",
        on_delete=models.CASCADE,
        related_name="schedule_slots",
    )
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    starts_at = models.TimeField()
    ends_at = models.TimeField()
    location_label = models.CharField(max_length=120, blank=True)
    delivery_details = models.CharField(max_length=240, blank=True)

    class Meta:
        db_table = "academic_offering_schedules"
        ordering = ("weekday", "starts_at")
        constraints = [
            models.CheckConstraint(
                condition=Q(ends_at__gt=F("starts_at")),
                name="academic_schedule_valid_time_range",
            ),
            models.UniqueConstraint(
                fields=("organization", "offering", "weekday", "starts_at", "ends_at"),
                condition=Q(deleted_at__isnull=True),
                name="academic_schedule_slot_unique",
            ),
        ]
        indexes = [
            models.Index(
                fields=("organization", "weekday", "starts_at"),
                name="acad_schedule_day_start_idx",
            ),
            models.Index(
                fields=("offering", "weekday"),
                name="acad_schedule_offering_day_idx",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.organization_id and self.offering_id:
            if self.offering.organization_id != self.organization_id:
                errors["offering"] = "Offering must belong to the schedule organization."
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            errors["ends_at"] = "Schedule end time must be later than its start time."
        if errors:
            raise ValidationError(errors)
