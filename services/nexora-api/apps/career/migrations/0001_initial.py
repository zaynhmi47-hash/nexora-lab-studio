import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CareerExperience",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("role_title", models.CharField(max_length=160)),
                ("organization_name", models.CharField(max_length=180)),
                ("employment_type", models.CharField(choices=[("full_time", "Full-time"), ("part_time", "Part-time"), ("contract", "Contract"), ("freelance", "Freelance"), ("internship", "Internship"), ("volunteer", "Volunteer"), ("other", "Other")], default="other", max_length=16)),
                ("location", models.CharField(blank=True, max_length=160)),
                ("description", models.TextField(blank=True)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField(blank=True, null=True)),
                ("is_current", models.BooleanField(default=False)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="career_experiences", to="identity.nexorauser")),
            ],
            options={"db_table": "career_experiences", "ordering": ("-start_date", "-created_at")},
        ),
        migrations.CreateModel(
            name="CareerProject",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=180)),
                ("summary", models.TextField(blank=True)),
                ("role", models.CharField(blank=True, max_length=120)),
                ("skills", models.JSONField(blank=True, default=list)),
                ("artifact_url", models.URLField(blank=True, max_length=1000)),
                ("started_at", models.DateField(blank=True, null=True)),
                ("completed_at", models.DateField(blank=True, null=True)),
                ("status", models.CharField(choices=[("planning", "Planning"), ("in_progress", "In progress"), ("completed", "Completed"), ("on_hold", "On hold")], default="planning", max_length=16)),
                ("visibility", models.CharField(choices=[("private", "Private"), ("unlisted", "Unlisted")], default="private", max_length=12)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="career_projects", to="identity.nexorauser")),
            ],
            options={"db_table": "career_projects", "ordering": ("-updated_at", "-created_at")},
        ),
        migrations.AddIndex(
            model_name="careerexperience",
            index=models.Index(fields=["user", "-start_date"], name="career_exp_user_start_idx"),
        ),
        migrations.AddIndex(
            model_name="careerproject",
            index=models.Index(fields=["user", "status"], name="career_project_user_status_idx"),
        ),
    ]
