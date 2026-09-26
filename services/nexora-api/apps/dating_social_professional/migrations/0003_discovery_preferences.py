from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("dating_social_professional", "0002_safety")]

    operations = [
        migrations.AddField(
            model_name="datingprofile",
            name="preferred_min_age",
            field=models.PositiveSmallIntegerField(default=18),
        ),
        migrations.AddField(
            model_name="datingprofile",
            name="preferred_max_age",
            field=models.PositiveSmallIntegerField(default=99),
        ),
    ]
