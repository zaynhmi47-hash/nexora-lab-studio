from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0014_dating_moment_media_storage"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="datingmoment",
            name="moderation_status",
            field=models.CharField(
                choices=[("pending", "Pending review"), ("approved", "Approved"), ("rejected", "Rejected")],
                db_index=True,
                default="approved",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="datingmoment",
            name="moderation_reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="datingmoment",
            name="moderation_reviewed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="dating_moments_reviewed",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="datingmoment",
            name="moderation_reason",
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
