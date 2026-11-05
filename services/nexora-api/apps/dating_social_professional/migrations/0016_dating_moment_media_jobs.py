import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0015_dating_moment_moderation"),
    ]

    operations = [
        migrations.AddField(
            model_name="datingmoment",
            name="thumbnail_key",
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.CreateModel(
            name="DatingMomentMediaJob",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("queued", "Queued"), ("processing", "Processing"), ("completed", "Completed"), ("failed", "Failed")], db_index=True, default="queued", max_length=16)),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("available_at", models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ("locked_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("last_error", models.CharField(blank=True, max_length=500)),
                ("moment", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="media_processing_job", to="dating_social_professional.datingmoment")),
            ],
            options={"db_table": "dating_moment_media_jobs"},
        ),
        migrations.AddIndex(
            model_name="datingmomentmediajob",
            index=models.Index(fields=["status", "available_at"], name="dating_media_job_queue_idx"),
        ),
    ]
