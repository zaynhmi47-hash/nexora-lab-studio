from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0009_profile_media"),
    ]

    operations = [
        migrations.AddField(
            model_name="datingprofilemedia",
            name="storage_key",
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.AlterField(
            model_name="datingprofilemedia",
            name="url",
            field=models.URLField(blank=True, max_length=2048),
        ),
    ]
