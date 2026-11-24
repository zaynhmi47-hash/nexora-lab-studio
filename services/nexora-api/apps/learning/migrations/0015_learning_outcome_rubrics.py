import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0014_assessment_history_development_plans"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningOutcomeRubric",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("version", models.PositiveIntegerField(default=1)),
                ("criteria", models.JSONField(default=list)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("outcome", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="rubrics", to="learning.learningoutcome")),
            ],
            options={"db_table": "learning_outcome_rubrics", "ordering": ("outcome", "-version")},
        ),
        migrations.AddConstraint(
            model_name="learningoutcomerubric",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=("outcome", "version"),
                name="learn_outcome_rubric_version_uniq",
            ),
        ),
        migrations.AddField(
            model_name="learningmasteryassessmentevent",
            name="rubric_version",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="learningmasteryassessmentevent",
            name="criterion_scores",
            field=models.JSONField(default=dict),
        ),
    ]
