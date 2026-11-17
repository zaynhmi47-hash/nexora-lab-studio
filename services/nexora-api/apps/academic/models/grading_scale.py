from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from apps.core.models import AuditableBaseModel


class AcademicGradingScale(AuditableBaseModel):
    """Organization-owned, versioned conversion from normalized scores to grade points."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="academic_grading_scales",
    )
    name = models.CharField(max_length=120)
    version = models.PositiveSmallIntegerField()
    is_active = models.BooleanField(default=True, db_index=True)
    maximum_grade_point = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01")), MaxValueValidator(Decimal("10.00"))],
    )

    class Meta:
        db_table = "academic_grading_scales"
        constraints = [
            models.UniqueConstraint(
                fields=("organization", "version"),
                condition=Q(deleted_at__isnull=True),
                name="acad_grade_scale_org_version_unique",
            ),
            models.UniqueConstraint(
                fields=("organization",),
                condition=Q(deleted_at__isnull=True, is_active=True),
                name="acad_grade_scale_active_unique",
            ),
            models.CheckConstraint(
                condition=Q(maximum_grade_point__gt=0, maximum_grade_point__lte=10),
                name="acad_grade_scale_point_range",
            ),
        ]
        ordering = ("-version",)

    def clean(self):
        super().clean()
        if self.maximum_grade_point is not None and not (
            Decimal("0") < self.maximum_grade_point <= Decimal("10")
        ):
            raise ValidationError({"maximum_grade_point": "Maximum grade point must be greater than 0 and at most 10."})


class AcademicGradingScaleBand(AuditableBaseModel):
    """A half-open score interval; the final interval includes score 100."""

    grading_scale = models.ForeignKey(
        AcademicGradingScale,
        on_delete=models.PROTECT,
        related_name="bands",
    )
    minimum_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    maximum_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    letter_grade = models.CharField(max_length=8)
    grade_points = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    is_passing = models.BooleanField(default=True)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "academic_grading_scale_bands"
        ordering = ("position", "minimum_percentage")
        constraints = [
            models.UniqueConstraint(
                fields=("grading_scale", "letter_grade"),
                condition=Q(deleted_at__isnull=True),
                name="acad_grade_band_letter_unique",
            ),
            models.CheckConstraint(
                condition=Q(maximum_percentage__gt=models.F("minimum_percentage")),
                name="acad_grade_band_valid_interval",
            ),
            models.CheckConstraint(
                condition=Q(minimum_percentage__gte=0, maximum_percentage__lte=100),
                name="acad_grade_band_score_range",
            ),
            models.CheckConstraint(
                condition=Q(grade_points__gte=0, grade_points__lte=10),
                name="acad_grade_band_point_range",
            ),
        ]

    def clean(self):
        super().clean()
        errors = {}
        if self.maximum_percentage is not None and self.minimum_percentage is not None:
            if self.maximum_percentage <= self.minimum_percentage:
                errors["maximum_percentage"] = "Upper bound must be greater than lower bound."
        if self.grading_scale_id and self.grade_points is not None:
            if self.grade_points > self.grading_scale.maximum_grade_point:
                errors["grade_points"] = "Grade points cannot exceed the scale maximum."
        if errors:
            raise ValidationError(errors)
