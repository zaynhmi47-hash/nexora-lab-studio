import django.db.models.deletion
from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0002_course_catalog_curriculum"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicCourseOffering",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.CharField(max_length=40)),
                ("capacity", models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1)])),
                ("status", models.CharField(choices=[("draft", "Draft"), ("open", "Open"), ("closed", "Closed"), ("cancelled", "Cancelled")], db_index=True, default="draft", max_length=12)),
                ("classroom", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="course_offerings", to="academic.academicclassroom")),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="offerings", to="academic.academiccourse")),
                ("curriculum_entry", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="offerings", to="academic.academiccurriculumcourse")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_course_offerings", to="organizations.organization")),
            ],
            options={"db_table": "academic_course_offerings", "ordering": ("classroom__term__starts_on", "code")},
        ),
        migrations.AddConstraint(
            model_name="academiccourseoffering",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "classroom", "code"), name="academic_offering_org_class_code_unique"),
        ),
        migrations.AddConstraint(
            model_name="academiccourseoffering",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True), ("status__in", ("draft", "open"))), fields=("classroom", "course"), name="academic_offering_active_course_unique"),
        ),
        migrations.AddIndex(
            model_name="academiccourseoffering",
            index=models.Index(fields=["organization", "classroom", "status"], name="acad_offering_class_idx"),
        ),
        migrations.AddIndex(
            model_name="academiccourseoffering",
            index=models.Index(fields=["organization", "course"], name="acad_offering_course_idx"),
        ),
    ]
