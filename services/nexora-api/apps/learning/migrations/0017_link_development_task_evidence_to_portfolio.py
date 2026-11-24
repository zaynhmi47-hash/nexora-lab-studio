import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0016_development_tasks_and_evidence"),
    ]

    operations = [
        migrations.AddField(
            model_name="learningdevelopmenttaskevidence",
            name="portfolio_evidence",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="development_task_source",
                to="learning.learningevidence",
            ),
        ),
    ]
