import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("learning", "0013_learning_evidence_source_reference_unique"),
        ("research", "0002_evidence_verification"),
    ]

    operations = [
        migrations.CreateModel(
            name="ResearchOutputOutcomeMapping",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="research_outcome_mappings", to="identity.nexorauser")),
                ("outcome", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="research_output_mappings", to="learning.learningoutcome")),
                ("output", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="outcome_mappings", to="research.researchoutput")),
            ],
            options={"db_table": "research_output_outcome_mappings", "ordering": ("created_at",)},
        ),
        migrations.AddConstraint(
            model_name="researchoutputoutcomemapping",
            constraint=models.UniqueConstraint(condition=models.Q(deleted_at__isnull=True), fields=("output", "outcome"), name="research_output_outcome_unique"),
        ),
        migrations.AddIndex(
            model_name="researchoutputoutcomemapping",
            index=models.Index(fields=["outcome", "created_at"], name="research_map_outcome_date_idx"),
        ),
    ]
