from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("control_plane", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="controlplaneprincipal",
            name="role",
            field=models.CharField(
                choices=[
                    ("owner", "Owner"),
                    ("platform_admin", "Platform Admin"),
                    ("security_admin", "Security Admin"),
                    ("auditor", "Auditor"),
                ],
                db_index=True,
                default="owner",
                max_length=32,
            ),
        ),
    ]
