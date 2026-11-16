import uuid

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0001_initial"),
        ("identity", "0003_login_verified_event"),
        ("organizations", "0002_add_membership_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicAuditEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("action", models.CharField(max_length=32)),
                ("resource_type", models.CharField(max_length=32)),
                ("resource_id", models.UUIDField()),
                ("occurred_at", models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ("changes", models.JSONField(default=dict)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_audit_events", to="identity.nexorauser")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_audit_events", to="organizations.organization")),
            ],
            options={"db_table": "academic_audit_events", "ordering": ("-occurred_at", "-id")},
        ),
        migrations.AddIndex(
            model_name="academicauditevent",
            index=models.Index(fields=["organization", "-occurred_at"], name="acad_audit_org_time_idx"),
        ),
    ]
