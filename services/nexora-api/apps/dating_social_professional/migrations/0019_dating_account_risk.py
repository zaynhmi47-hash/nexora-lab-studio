import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("dating_social_professional", "0018_trust_safety_center"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatingAccountRiskProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("score", models.PositiveSmallIntegerField(default=0)),
                ("level", models.CharField(choices=[("low", "Low"), ("medium", "Medium"), ("high", "High"), ("critical", "Critical")], db_index=True, default="low", max_length=12)),
                ("confirmed_report_count", models.PositiveIntegerField(default=0)),
                ("received_block_count", models.PositiveIntegerField(default=0)),
                ("signals", models.JSONField(blank=True, default=dict)),
                ("calculated_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="dating_risk_profile", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_account_risk_profiles"},
        ),
        migrations.AddIndex(
            model_name="datingaccountriskprofile",
            index=models.Index(fields=["level", "score"], name="dating_risk_level_score_idx"),
        ),
        migrations.CreateModel(
            name="DatingAccountSecurityEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("event_type", models.CharField(choices=[("risk_recalculated", "Risk recalculated"), ("warning_issued", "Warning issued"), ("account_reviewed", "Account reviewed"), ("status_changed", "Account status changed")], max_length=32)),
                ("previous_value", models.CharField(blank=True, max_length=32)),
                ("new_value", models.CharField(blank=True, max_length=32)),
                ("reason", models.CharField(blank=True, max_length=1000)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="dating_security_actions", to="identity.nexorauser")),
                ("subject", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_security_events", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_account_security_events"},
        ),
        migrations.AddIndex(
            model_name="datingaccountsecurityevent",
            index=models.Index(fields=["subject", "created_at"], name="dating_security_subject_idx"),
        ),
    ]
