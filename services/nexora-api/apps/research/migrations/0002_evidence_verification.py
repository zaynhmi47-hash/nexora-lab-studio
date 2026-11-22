import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("organizations", "0001_initial"),
        ("research", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ResearchEvidenceVerification",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("submitted", "Submitted"), ("under_review", "Under review"), ("verified", "Verified"), ("rejected", "Rejected"), ("revoked", "Revoked")], db_index=True, default="submitted", max_length=16)),
                ("consented_at", models.DateTimeField()),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("decision_reason", models.TextField(blank=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="research_verifications", to="organizations.organization")),
                ("output", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="verification_cases", to="research.researchoutput")),
                ("reviewer", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="reviewed_research_verifications", to="identity.nexorauser")),
                ("submitted_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="submitted_research_verifications", to="identity.nexorauser")),
            ],
            options={"db_table": "research_evidence_verifications", "ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="ResearchEvidenceVerificationEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("from_status", models.CharField(blank=True, max_length=16)),
                ("to_status", models.CharField(choices=[("submitted", "Submitted"), ("under_review", "Under review"), ("verified", "Verified"), ("rejected", "Rejected"), ("revoked", "Revoked")], max_length=16)),
                ("reason", models.TextField(blank=True)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="research_verification_events", to="identity.nexorauser")),
                ("verification", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="events", to="research.researchevidenceverification")),
            ],
            options={"db_table": "research_evidence_verification_events", "ordering": ("created_at",)},
        ),
        migrations.AddIndex(
            model_name="researchevidenceverification",
            index=models.Index(fields=["organization", "status"], name="research_verify_org_status_idx"),
        ),
        migrations.AddIndex(
            model_name="researchevidenceverification",
            index=models.Index(fields=["output", "status"], name="research_ver_out_stat_idx"),
        ),
        migrations.AddIndex(
            model_name="researchevidenceverificationevent",
            index=models.Index(fields=["verification", "created_at"], name="research_verify_event_idx"),
        ),
    ]
