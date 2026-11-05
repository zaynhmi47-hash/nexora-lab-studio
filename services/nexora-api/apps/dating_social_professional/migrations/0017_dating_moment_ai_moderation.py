import uuid

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0016_dating_moment_media_jobs"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatingMomentModerationJob",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("queued", "Queued"), ("processing", "Processing"), ("completed", "Completed"), ("failed", "Failed")], db_index=True, default="queued", max_length=16)),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("available_at", models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ("locked_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("provider_name", models.CharField(blank=True, max_length=80)),
                ("suggested_action", models.CharField(blank=True, choices=[("approve", "Suggested approve"), ("reject", "Suggested reject"), ("review", "Human review required")], max_length=16)),
                ("confidence", models.FloatField(blank=True, null=True)),
                ("categories", models.JSONField(blank=True, default=list)),
                ("explanation", models.CharField(blank=True, max_length=500)),
                ("last_error", models.CharField(blank=True, max_length=500)),
                ("moment", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="ai_moderation_job", to="dating_social_professional.datingmoment")),
            ],
            options={"db_table": "dating_moment_moderation_jobs"},
        ),
        migrations.AddIndex(
            model_name="datingmomentmoderationjob",
            index=models.Index(fields=["status", "available_at"], name="dating_moderation_queue_idx"),
        ),
    ]
