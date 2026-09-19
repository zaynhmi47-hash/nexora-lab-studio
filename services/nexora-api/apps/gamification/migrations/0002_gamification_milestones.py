from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gamification", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="gamificationactivity",
            name="source",
            field=models.CharField(
                choices=[
                    ("learning", "Learning"),
                    ("tajwid", "Tajwid"),
                    ("arabic", "Arabic"),
                    ("gamification", "Gamification"),
                ],
                max_length=32,
            ),
        ),
    ]
