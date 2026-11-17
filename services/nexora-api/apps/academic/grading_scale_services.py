from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.academic.models import AcademicGradingScale, AcademicGradingScaleBand
from apps.organizations.models import Organization


class AcademicGradingScaleService:
    """Publishes complete, versioned organization grading scales atomically."""

    @staticmethod
    def validate_bands(*, bands, maximum_grade_point):
        if not bands:
            raise ValidationError({"bands": "At least one grading band is required."})
        ordered = sorted(bands, key=lambda item: Decimal(str(item["minimum_percentage"])))
        if Decimal(str(ordered[0]["minimum_percentage"])) != Decimal("0"):
            raise ValidationError({"bands": "The first grading band must start at 0 percent."})
        previous_upper = Decimal("0")
        for index, band in enumerate(ordered):
            lower = Decimal(str(band["minimum_percentage"]))
            upper = Decimal(str(band["maximum_percentage"]))
            points = Decimal(str(band["grade_points"]))
            if lower != previous_upper:
                raise ValidationError({"bands": "Grading bands must be contiguous with no gaps or overlaps."})
            if upper <= lower or upper > Decimal("100"):
                raise ValidationError({"bands": "Each grading band must have a valid upper bound up to 100."})
            if points < 0 or points > maximum_grade_point:
                raise ValidationError({"bands": "Grade points must be between zero and the scale maximum."})
            previous_upper = upper
        if previous_upper != Decimal("100"):
            raise ValidationError({"bands": "The final grading band must end at 100 percent."})
        letters = [str(item["letter_grade"]).strip().upper() for item in ordered]
        if len(set(letters)) != len(letters):
            raise ValidationError({"bands": "Letter grades must be unique within a grading scale."})
        return ordered

    @staticmethod
    @transaction.atomic
    def publish_scale(*, organization, name, maximum_grade_point, bands):
        Organization.objects.select_for_update().get(pk=organization.pk)
        maximum_grade_point = Decimal(str(maximum_grade_point))
        if not name or not name.strip():
            raise ValidationError({"name": "A grading scale name is required."})
        if maximum_grade_point <= 0 or maximum_grade_point > Decimal("10"):
            raise ValidationError({"maximum_grade_point": "Maximum grade point must be greater than 0 and at most 10."})
        ordered = AcademicGradingScaleService.validate_bands(
            bands=bands, maximum_grade_point=maximum_grade_point)
        current = AcademicGradingScale.objects.select_for_update().filter(
            organization=organization, is_active=True, deleted_at__isnull=True,
        ).first()
        next_version = (AcademicGradingScale.objects.filter(
            organization=organization, deleted_at__isnull=True,
        ).order_by("-version").values_list("version", flat=True).first() or 0) + 1
        if current:
            current.is_active = False
            current.save(update_fields=("is_active", "updated_at"))
        scale = AcademicGradingScale(
            organization=organization, name=name.strip(),
            maximum_grade_point=maximum_grade_point, version=next_version,
        )
        scale.full_clean()
        scale.save()
        for position, item in enumerate(ordered):
            band = AcademicGradingScaleBand(
                grading_scale=scale,
                minimum_percentage=Decimal(str(item["minimum_percentage"])),
                maximum_percentage=Decimal(str(item["maximum_percentage"])),
                letter_grade=str(item["letter_grade"]).strip().upper(),
                grade_points=Decimal(str(item["grade_points"])),
                is_passing=bool(item["is_passing"]),
                position=position,
            )
            band.full_clean()
            band.save()
        return scale

    @staticmethod
    def resolve_grade(*, grading_scale, percentage):
        percentage = Decimal(str(percentage))
        if percentage < 0 or percentage > 100:
            raise ValidationError({"percentage": "Normalized percentage must be between 0 and 100."})
        bands = grading_scale.bands.filter(deleted_at__isnull=True)
        if percentage == Decimal("100"):
            band = bands.filter(maximum_percentage=100).first()
        else:
            band = bands.filter(
                minimum_percentage__lte=percentage,
                maximum_percentage__gt=percentage,
            ).first()
        if band is None:
            raise ValidationError({"grading_scale": "No grading band covers this percentage."})
        return band
