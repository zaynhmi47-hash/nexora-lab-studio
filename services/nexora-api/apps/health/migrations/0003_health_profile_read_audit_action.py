from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("health", "0002_health_access_audit_event")]

    operations = [
        migrations.AlterField(
            model_name="healthaccessauditevent",
            name="action",
            field=models.CharField(
                choices=[
                    ("access.granted", "Access granted"),
                    ("access.revoked", "Access revoked"),
                    ("profile.read", "Profile read"),
                ],
                max_length=24,
            ),
        ),
    ]
