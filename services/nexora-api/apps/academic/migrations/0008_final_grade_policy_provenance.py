import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0007_gradebook_foundation"),
    ]

    operations = [
        migrations.AddField(
            model_name="academicfinalgrade",
            name="grading_policy",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="final_grades",
                to="academic.academicgradingpolicy",
            ),
        ),
    ]
