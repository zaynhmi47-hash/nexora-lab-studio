import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("dating_social_professional", "0017_dating_moment_ai_moderation"),
    ]

    operations = [
        migrations.AddField(
            model_name="datingreport",
            name="status",
            field=models.CharField(choices=[("open", "Open"), ("investigating", "Investigating"), ("action_taken", "Action taken"), ("dismissed", "Dismissed")], db_index=True, default="open", max_length=20),
        ),
        migrations.AddField(
            model_name="datingreport",
            name="priority",
            field=models.CharField(choices=[("low", "Low"), ("normal", "Normal"), ("high", "High"), ("urgent", "Urgent")], db_index=True, default="normal", max_length=12),
        ),
        migrations.AddField(
            model_name="datingreport",
            name="resolution",
            field=models.CharField(blank=True, max_length=1000),
        ),
        migrations.AddField(
            model_name="datingreport",
            name="reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="datingreport",
            name="assigned_to",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="dating_reports_assigned", to="identity.nexorauser"),
        ),
        migrations.AddField(
            model_name="datingreport",
            name="reviewed_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="dating_reports_reviewed", to="identity.nexorauser"),
        ),
        migrations.AddIndex(
            model_name="datingreport",
            index=models.Index(fields=["status", "priority", "created_at"], name="dating_report_queue_idx"),
        ),
        migrations.CreateModel(
            name="DatingModerationAppeal",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("message", models.TextField(max_length=2000)),
                ("status", models.CharField(choices=[("open", "Open"), ("accepted", "Accepted"), ("rejected", "Rejected")], db_index=True, default="open", max_length=12)),
                ("reviewer_note", models.CharField(blank=True, max_length=1000)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("appellant", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_moderation_appeals", to="identity.nexorauser")),
                ("moment", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="appeal", to="dating_social_professional.datingmoment")),
                ("reviewer", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="dating_appeals_reviewed", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_moderation_appeals"},
        ),
        migrations.AddIndex(
            model_name="datingmoderationappeal",
            index=models.Index(fields=["status", "created_at"], name="dating_appeal_queue_idx"),
        ),
        migrations.CreateModel(
            name="DatingSafetyAuditEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("action", models.CharField(max_length=48)),
                ("previous_state", models.CharField(blank=True, max_length=32)),
                ("new_state", models.CharField(blank=True, max_length=32)),
                ("note", models.CharField(blank=True, max_length=1000)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_safety_events", to="identity.nexorauser")),
                ("appeal", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="audit_events", to="dating_social_professional.datingmoderationappeal")),
                ("moment", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="safety_audit_events", to="dating_social_professional.datingmoment")),
                ("report", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="audit_events", to="dating_social_professional.datingreport")),
            ],
            options={"db_table": "dating_safety_audit_events"},
        ),
        migrations.AddIndex(
            model_name="datingsafetyauditevent",
            index=models.Index(fields=["created_at", "action"], name="dating_safety_audit_idx"),
        ),
    ]
