# Generated for the Learn lesson content engine.
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0006_merge_seed_and_index_hardening"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningLessonContent",
            fields=[
                ("id", models.UUIDField(primary_key=True, serialize=False, editable=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("version", models.PositiveIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)])),
                ("estimated_minutes", models.PositiveIntegerField(default=0)),
                ("blocks", models.JSONField(default=list)),
                ("is_published", models.BooleanField(db_index=True, default=False)),
                ("lesson", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="content", to="learning.learninglesson")),
            ],
            options={
                "db_table": "learning_lesson_contents",
                "constraints": [
                    models.CheckConstraint(condition=models.Q(("version__gte", 1)), name="learning_content_version_gte_one"),
                ],
            },
        ),
    ]
