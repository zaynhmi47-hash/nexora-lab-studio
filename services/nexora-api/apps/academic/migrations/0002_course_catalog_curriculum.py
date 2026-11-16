import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicCourse",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.CharField(max_length=32)),
                ("name", models.CharField(max_length=180, validators=[django.core.validators.MinLengthValidator(2)])),
                ("description", models.TextField(blank=True)),
                ("credit_units", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(12)])),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_courses", to="organizations.organization")),
            ],
            options={"db_table": "academic_courses", "ordering": ("code",)},
        ),
        migrations.CreateModel(
            name="AcademicCurriculumCourse",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("curriculum_version", models.CharField(default="v1", max_length=32)),
                ("recommended_term", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(16)])),
                ("credit_units", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(12)])),
                ("requirement", models.CharField(choices=[("required", "Required"), ("elective", "Elective")], default="required", max_length=12)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="curriculum_entries", to="academic.academiccourse")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_curriculum_courses", to="organizations.organization")),
                ("program", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="curriculum_courses", to="academic.academicprogram")),
            ],
            options={"db_table": "academic_curriculum_courses", "ordering": ("program_id", "recommended_term", "course__code")},
        ),
        migrations.AddConstraint(
            model_name="academiccourse",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "code"), name="academic_course_org_code_unique"),
        ),
        migrations.AddConstraint(
            model_name="academiccourse",
            constraint=models.CheckConstraint(condition=models.Q(("credit_units__gte", 1), ("credit_units__lte", 12)), name="academic_course_credit_range"),
        ),
        migrations.AddIndex(
            model_name="academiccourse",
            index=models.Index(fields=["organization", "is_active"], name="acad_course_org_active_idx"),
        ),
        migrations.AddConstraint(
            model_name="academiccurriculumcourse",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("program", "course", "curriculum_version"), name="academic_curriculum_course_unique"),
        ),
        migrations.AddConstraint(
            model_name="academiccurriculumcourse",
            constraint=models.CheckConstraint(condition=models.Q(("recommended_term__gte", 1), ("recommended_term__lte", 16)), name="academic_curriculum_term_range"),
        ),
        migrations.AddConstraint(
            model_name="academiccurriculumcourse",
            constraint=models.CheckConstraint(condition=models.Q(("credit_units__gte", 1), ("credit_units__lte", 12)), name="academic_curriculum_credit_range"),
        ),
        migrations.AddIndex(
            model_name="academiccurriculumcourse",
            index=models.Index(fields=["organization", "program", "curriculum_version", "is_active"], name="acad_curriculum_lookup_idx"),
        ),
    ]
