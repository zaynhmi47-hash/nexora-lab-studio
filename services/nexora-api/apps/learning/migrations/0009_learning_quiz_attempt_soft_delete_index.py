from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0008_learning_evidence_engine"),
    ]

    operations = [
        migrations.AlterField(
            model_name="learningquizattempt",
            name="deleted_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
    ]
