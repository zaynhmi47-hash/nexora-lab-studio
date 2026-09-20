from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("control_plane", "0005_audit_append_only")]

    operations = [
        migrations.AlterField(
            model_name="controlplaneauditevent",
            name="event_type",
            field=models.CharField(
                choices=[
                    ("CONTROL_PLANE_LOGIN", "Control Center login"),
                    ("CONTROL_PLANE_LOGIN_FAILED", "Control Center login failed"),
                    ("PRINCIPAL_ROLE_CHANGED", "Principal role changed"),
                    ("PRINCIPAL_ENABLED", "Principal enabled"),
                    ("PRINCIPAL_DISABLED", "Principal disabled"),
                    ("BOOTSTRAP_COMPLETED", "Bootstrap completed"),
                    ("BOOTSTRAP_REJECTED", "Bootstrap rejected"),
                    ("TELEMETRY_CLEARED", "Request telemetry cleared"),
                ], db_index=True, max_length=64,
            ),
        ),
    ]
