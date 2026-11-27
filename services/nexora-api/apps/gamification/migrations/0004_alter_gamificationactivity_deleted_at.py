from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("gamification", "0003_index_name_hardening"),
    ]

    operations = [
        migrations.AlterField(
            model_name="gamificationactivity",
            name="deleted_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
    ]
