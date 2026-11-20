import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("organizations", "0002_add_membership_role"),
        ("learning", "0008_learning_evidence_engine"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningEvidenceShare",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("evidence", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="organization_shares", to="learning.learningevidence")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="learning_evidence_shares", to="organizations.organization")),
                ("shared_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="shared_learning_evidence", to="identity.nexorauser")),
            ],
            options={"db_table": "learning_evidence_shares"},
        ),
        migrations.AddConstraint(
            model_name="learningevidenceshare",
            constraint=models.UniqueConstraint(
                condition=models.Q(("revoked_at__isnull", True), ("deleted_at__isnull", True)),
                fields=("evidence", "organization"),
                name="learn_evidence_active_share_unique",
            ),
        ),
        migrations.AddIndex(
            model_name="learningevidenceshare",
            index=models.Index(fields=["organization", "revoked_at"], name="learn_ev_share_org_idx"),
        ),
    ]
