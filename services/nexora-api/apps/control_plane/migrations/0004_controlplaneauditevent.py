from django.db import migrations, models
import django.db.models.deletion
import uuid
from django.utils import timezone


class Migration(migrations.Migration):
    dependencies = [
        ("control_plane", "0003_controlplanebootstrapstate"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ControlPlaneAuditEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("event_type", models.CharField(choices=[
                    ("CONTROL_PLANE_LOGIN", "Control Center login"),
                    ("CONTROL_PLANE_LOGIN_FAILED", "Control Center login failed"),
                    ("PRINCIPAL_ROLE_CHANGED", "Principal role changed"),
                    ("PRINCIPAL_ENABLED", "Principal enabled"),
                    ("PRINCIPAL_DISABLED", "Principal disabled"),
                    ("BOOTSTRAP_COMPLETED", "Bootstrap completed"),
                    ("BOOTSTRAP_REJECTED", "Bootstrap rejected"),
                ], db_index=True, max_length=64)),
                ("success", models.BooleanField(default=True)),
                ("occurred_at", models.DateTimeField(db_index=True, default=timezone.now)),
                ("correlation_id", models.CharField(blank=True, db_index=True, default="", max_length=128)),
                ("metadata", models.JSONField(default=dict)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="control_plane_audit_events", to="identity.nexorauser")),
                ("target", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="control_plane_audit_targets", to="identity.nexorauser")),
            ],
            options={
                "db_table": "control_plane_audit_events",
                "ordering": ("-occurred_at", "-id"),
            },
        ),
        migrations.AddIndex(
            model_name="controlplaneauditevent",
            index=models.Index(fields=["event_type", "-occurred_at"], name="control_pla_event_t_6d2f5a_idx"),
        ),
        migrations.AddIndex(
            model_name="controlplaneauditevent",
            index=models.Index(fields=["actor", "-occurred_at"], name="control_pla_actor_i_3e7c42_idx"),
        ),
        migrations.AddIndex(
            model_name="controlplaneauditevent",
            index=models.Index(fields=["target", "-occurred_at"], name="control_pla_target_i_5e2a11_idx"),
        ),
    ]
