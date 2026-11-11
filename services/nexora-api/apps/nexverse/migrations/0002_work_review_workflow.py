from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("nexverse", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="nexversework",
            name="review_status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("submitted", "Submitted for review"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                ],
                db_index=True,
                default="draft",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="nexversework",
            name="submitted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="nexversework",
            name="reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="nexversework",
            name="review_note",
            field=models.CharField(blank=True, max_length=1000),
        ),
    ]
