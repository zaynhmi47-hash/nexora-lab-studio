import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0011_rename_evidence_review_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningOutcomeLessonMapping",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("contribution_type", models.CharField(
                    choices=[
                        ("introduced", "Introduces"),
                        ("practiced", "Practices"),
                        ("assessed", "Assesses"),
                    ],
                    default="introduced",
                    max_length=12,
                )),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("lesson", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="outcome_mappings",
                    to="learning.learninglesson",
                )),
                ("outcome", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="lesson_mappings",
                    to="learning.learningoutcome",
                )),
            ],
            options={
                "db_table": "learning_outcome_lesson_mappings",
                "ordering": ("lesson__course__sort_order", "lesson__sort_order", "outcome__sort_order"),
            },
        ),
        migrations.AddConstraint(
            model_name="learningoutcomelessonmapping",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("lesson", "outcome"),
                name="learning_lesson_outcome_map_uniq",
            ),
        ),
        migrations.AlterField(
            model_name="learningevidence",
            name="evidence_type",
            field=models.CharField(
                choices=[
                    ("project", "Project"),
                    ("assignment", "Assignment"),
                    ("certificate", "Certificate"),
                    ("practice", "Practical demonstration"),
                    ("reflection", "Reflection"),
                    ("other", "Other"),
                    ("learning_activity", "Recorded learning activity"),
                ],
                max_length=20,
            ),
        ),
    ]
