import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0008_final_grade_policy_provenance"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicGradingScale",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=120)),
                ("version", models.PositiveSmallIntegerField()),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("maximum_grade_point", models.DecimalField(decimal_places=2, max_digits=5, validators=[django.core.validators.MinValueValidator(__import__("decimal").Decimal("0.01")), django.core.validators.MaxValueValidator(__import__("decimal").Decimal("10.00"))])),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_grading_scales", to="organizations.organization")),
            ],
            options={"db_table": "academic_grading_scales", "ordering": ("-version",)},
        ),
        migrations.CreateModel(
            name="AcademicGradingScaleBand",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("minimum_percentage", models.DecimalField(decimal_places=2, max_digits=5, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ("maximum_percentage", models.DecimalField(decimal_places=2, max_digits=5, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ("letter_grade", models.CharField(max_length=8)),
                ("grade_points", models.DecimalField(decimal_places=2, max_digits=5, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(10)])),
                ("is_passing", models.BooleanField(default=True)),
                ("position", models.PositiveSmallIntegerField(default=0)),
                ("grading_scale", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bands", to="academic.academicgradingscale")),
            ],
            options={"db_table": "academic_grading_scale_bands", "ordering": ("position", "minimum_percentage")},
        ),
        migrations.AddConstraint("academicgradingscale", models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "version"), name="acad_grade_scale_org_version_unique")),
        migrations.AddConstraint("academicgradingscale", models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True), ("is_active", True)), fields=("organization",), name="acad_grade_scale_active_unique")),
        migrations.AddConstraint("academicgradingscale", models.CheckConstraint(condition=models.Q(("maximum_grade_point__gt", 0), ("maximum_grade_point__lte", 10)), name="acad_grade_scale_point_range")),
        migrations.AddConstraint("academicgradingscaleband", models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("grading_scale", "letter_grade"), name="acad_grade_band_letter_unique")),
        migrations.AddConstraint("academicgradingscaleband", models.CheckConstraint(condition=models.Q(("maximum_percentage__gt", models.F("minimum_percentage"))), name="acad_grade_band_valid_interval")),
        migrations.AddConstraint("academicgradingscaleband", models.CheckConstraint(condition=models.Q(("minimum_percentage__gte", 0), ("maximum_percentage__lte", 100)), name="acad_grade_band_score_range")),
        migrations.AddConstraint("academicgradingscaleband", models.CheckConstraint(condition=models.Q(("grade_points__gte", 0), ("grade_points__lte", 10)), name="acad_grade_band_point_range")),
    ]
