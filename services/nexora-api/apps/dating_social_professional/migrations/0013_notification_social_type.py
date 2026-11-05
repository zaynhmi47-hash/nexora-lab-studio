from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0012_moment_interactions"),
    ]

    operations = [
        migrations.AlterField(
            model_name="datingnotification",
            name="type",
            field=models.CharField(
                choices=[
                    ("match", "Match"),
                    ("message", "Message"),
                    ("social", "Social activity"),
                    ("safety", "Safety"),
                ],
                max_length=32,
            ),
        ),
    ]
