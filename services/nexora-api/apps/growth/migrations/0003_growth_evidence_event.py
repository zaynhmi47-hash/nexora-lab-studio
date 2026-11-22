import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("growth", "0002_growth_habits"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="GrowthEvidenceEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("event_type", models.CharField(choices=[
                    ("goal.created", "Goal created"),
                    ("goal.status_changed", "Goal status changed"),
                    ("habit.created", "Habit created"),
                    ("habit.check_in_recorded", "Habit check-in recorded"),
                    ("habit.check_in_changed", "Habit check-in changed"),
                ], max_length=40)),
                ("subject_type", models.CharField(max_length=32)),
                ("subject_id", models.CharField(max_length=64)),
                ("event_key", models.CharField(max_length=180, unique=True)),
                ("occurred_at", models.DateTimeField()),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="growth_evidence_events",
                    to="identity.nexorauser",
                )),
            ],
            options={
                "db_table": "growth_evidence_events",
                "ordering": ("-occurred_at", "-id"),
            },
        ),
        migrations.AddIndex(
            model_name="growthevidenceevent",
            index=models.Index(fields=["user", "-occurred_at"], name="growth_event_user_time_idx"),
        ),
        migrations.AddIndex(
            model_name="growthevidenceevent",
            index=models.Index(fields=["subject_type", "subject_id"], name="growth_event_subject_idx"),
        ),
    ]
