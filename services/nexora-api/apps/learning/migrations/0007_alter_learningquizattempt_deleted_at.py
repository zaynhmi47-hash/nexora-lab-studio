from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0006_merge_seed_and_index_hardening"),
    ]

    operations = [
        migrations.AlterField(
            model_name="learningquizattempt",
            name="deleted_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
    ]
