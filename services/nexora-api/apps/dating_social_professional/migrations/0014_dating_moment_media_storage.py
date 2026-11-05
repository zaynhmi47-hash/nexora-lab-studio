from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0013_notification_social_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="datingmoment",
            name="storage_key",
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.AddField(
            model_name="datingmoment",
            name="media_type",
            field=models.CharField(blank=True, choices=[("image", "Image"), ("video", "Video")], max_length=16),
        ),
    ]
