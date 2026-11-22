from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0012_learning_outcome_lesson_mapping"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="learningevidence",
            constraint=models.UniqueConstraint(
                condition=models.Q(("source_reference__gt", "")),
                fields=("source_type", "source_reference"),
                name="learning_evidence_source_ref_uniq",
            ),
        ),
    ]
