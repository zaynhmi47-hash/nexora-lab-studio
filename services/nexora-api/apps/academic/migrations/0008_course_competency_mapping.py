import django.db.models.deletion
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0007_gradebook_foundation"),
        ("learning", "0013_learning_evidence_source_reference_unique"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicCourseOutcomeMapping",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("contribution_type", models.CharField(choices=[("introduced", "Introduces"), ("practiced", "Practices"), ("assessed", "Assesses")], default="introduced", max_length=12)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="outcome_mappings", to="academic.academiccourse")),
                ("outcome", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_course_mappings", to="learning.learningoutcome")),
            ],
            options={"db_table": "academic_course_outcome_mappings"},
        ),
        migrations.AddConstraint(
            model_name="academiccourseoutcomemapping",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("course", "outcome"), name="acad_course_outcome_map_uniq"),
        ),
        migrations.AddIndex(
            model_name="academiccourseoutcomemapping",
            index=models.Index(fields=["course", "is_active"], name="acad_course_outcome_idx"),
        ),
    ]
