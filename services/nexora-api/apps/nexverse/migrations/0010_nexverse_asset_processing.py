from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("nexverse", "0009_nexverse_upload_sessions"),
    ]

    operations = [
        migrations.AddField(
            model_name="nexverseuploadsession",
            name="processing_metadata",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="nexverseuploadsession",
            name="processing_error",
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="nexverseuploadsession",
            name="processed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="nexverseuploadsession",
            name="status",
            field=models.CharField(
                choices=[
                    ("created", "Created"),
                    ("uploaded", "Uploaded"),
                    ("expired", "Expired"),
                    ("rejected", "Rejected"),
                    ("processing", "Processing"),
                    ("ready", "Ready"),
                    ("failed", "Processing failed"),
                ],
                db_index=True,
                default="created",
                max_length=16,
            ),
        ),
    ]
