from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("health", "0003_health_profile_read_audit_action")]

    operations = [
        migrations.AlterField(
            model_name="healthaccessauditevent",
            name="action",
            field=models.CharField(
                choices=[
                    ("access.granted", "Access granted"),
                    ("access.revoked", "Access revoked"),
                    ("profile.read", "Profile read"),
                    ("profile.created", "Profile created"),
                ],
                max_length=24,
            ),
        ),
    ]
