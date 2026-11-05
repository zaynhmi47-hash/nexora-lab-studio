from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("identity", "0002_device_security")]

    operations = [
        migrations.AlterField(
            model_name="identityloginevent",
            name="event_type",
            field=models.CharField(
                choices=[
                    ("login_verified", "Login verified"),
                    ("device_registered", "Device registered"),
                    ("device_seen", "Device seen"),
                    ("device_trusted", "Device trusted"),
                    ("device_revoked", "Device revoked"),
                    ("all_sessions_revoked", "All sessions revoked"),
                ],
                db_index=True,
                max_length=32,
            ),
        ),
    ]
