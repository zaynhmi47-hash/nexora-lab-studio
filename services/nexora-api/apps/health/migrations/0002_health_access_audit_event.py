import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("health", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="HealthAccessAuditEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("action", models.CharField(choices=[("access.granted", "Access granted"), ("access.revoked", "Access revoked")], max_length=24)),
                ("purpose", models.CharField(max_length=80)),
                ("scopes", models.JSONField(default=list)),
                ("policy_version", models.CharField(max_length=32)),
                ("correlation_id", models.CharField(blank=True, max_length=128)),
                ("details", models.JSONField(blank=True, default=dict)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="health_access_audit_actions", to="identity.nexorauser")),
                ("grantee", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="health_access_audit_grantee_events", to="identity.nexorauser")),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="access_audit_events", to="health.healthprofile")),
                ("subject", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="health_access_audit_subject_events", to="identity.nexorauser")),
            ],
            options={"db_table": "health_access_audit_events", "ordering": ("-created_at",)},
        ),
        migrations.AddIndex(
            model_name="healthaccessauditevent",
            index=models.Index(fields=["profile", "created_at"], name="health_audit_profile_time_idx"),
        ),
        migrations.AddIndex(
            model_name="healthaccessauditevent",
            index=models.Index(fields=["actor", "created_at"], name="health_audit_actor_time_idx"),
        ),
    ]
