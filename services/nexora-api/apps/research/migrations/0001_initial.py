import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [("identity", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="ResearchProject",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=200)),
                ("abstract", models.TextField(blank=True)),
                ("research_question", models.TextField(blank=True)),
                ("field_of_study", models.CharField(blank=True, max_length=160)),
                ("methodology", models.CharField(blank=True, max_length=120)),
                ("status", models.CharField(choices=[("idea", "Idea"), ("proposal", "Proposal"), ("in_progress", "In progress"), ("completed", "Completed"), ("on_hold", "On hold")], default="idea", max_length=16)),
                ("visibility", models.CharField(choices=[("private", "Private"), ("unlisted", "Unlisted")], default="private", max_length=12)),
                ("started_at", models.DateField(blank=True, null=True)),
                ("completed_at", models.DateField(blank=True, null=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="research_projects", to="identity.nexorauser")),
            ],
            options={"db_table": "research_projects", "ordering": ("-updated_at", "-created_at")},
        ),
        migrations.CreateModel(
            name="ResearchContribution",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("contributor_name", models.CharField(max_length=180)),
                ("affiliation", models.CharField(blank=True, max_length=180)),
                ("role", models.CharField(blank=True, max_length=120)),
                ("contribution_type", models.CharField(choices=[("conceptualization", "Conceptualization"), ("methodology", "Methodology"), ("investigation", "Investigation"), ("data_curation", "Data curation"), ("analysis", "Analysis"), ("writing", "Writing"), ("supervision", "Supervision"), ("other", "Other")], default="other", max_length=24)),
                ("statement", models.TextField(blank=True)),
                ("is_corresponding_author", models.BooleanField(default=False)),
                ("attribution_status", models.CharField(default="self_reported", editable=False, max_length=16)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="contributions", to="research.researchproject")),
            ],
            options={"db_table": "research_contributions", "ordering": ("created_at",)},
        ),
        migrations.CreateModel(
            name="ResearchOutput",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=220)),
                ("output_type", models.CharField(choices=[("article", "Article"), ("preprint", "Preprint"), ("thesis", "Thesis"), ("dataset", "Dataset"), ("software", "Software"), ("poster", "Poster"), ("presentation", "Presentation"), ("report", "Report"), ("other", "Other")], default="other", max_length=20)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("submitted", "Submitted"), ("under_review", "Under review"), ("accepted", "Accepted"), ("published", "Published"), ("withdrawn", "Withdrawn")], default="draft", max_length=16)),
                ("abstract", models.TextField(blank=True)),
                ("doi", models.CharField(blank=True, max_length=255)),
                ("resource_url", models.URLField(blank=True, max_length=1000)),
                ("published_on", models.DateField(blank=True, null=True)),
                ("provenance_status", models.CharField(default="self_reported", editable=False, max_length=16)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="outputs", to="research.researchproject")),
            ],
            options={"db_table": "research_outputs", "ordering": ("-published_on", "-created_at")},
        ),
        migrations.AddIndex(model_name="researchproject", index=models.Index(fields=["owner", "status"], name="research_owner_status_idx")),
        migrations.AddIndex(model_name="researchcontribution", index=models.Index(fields=["project", "contribution_type"], name="research_contrib_type_idx")),
        migrations.AddIndex(model_name="researchoutput", index=models.Index(fields=["project", "status"], name="research_output_status_idx")),
    ]
