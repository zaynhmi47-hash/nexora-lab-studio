import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0015_learning_outcome_rubrics"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningDevelopmentTask",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=240)),
                ("description", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("not_started", "Not started"), ("in_progress", "In progress"), ("pending_review", "Pending review"), ("completed", "Completed")], db_index=True, default="not_started", max_length=16)),
                ("sort_order", models.PositiveSmallIntegerField(default=0)),
                ("due_date", models.DateField(blank=True, null=True)),
                ("plan", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tasks", to="learning.learningdevelopmentplan")),
            ],
            options={"db_table": "learning_development_tasks", "ordering": ("sort_order", "created_at")},
        ),
        migrations.AddIndex(
            model_name="learningdevelopmenttask",
            index=models.Index(fields=["plan", "status"], name="learn_dev_task_plan_status_idx"),
        ),
        migrations.CreateModel(
            name="LearningDevelopmentTaskEvidence",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("evidence_type", models.CharField(choices=[("practice", "Practice"), ("project", "Project"), ("assignment", "Assignment"), ("certificate", "Certificate"), ("other", "Other")], max_length=16)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("artifact_url", models.URLField(blank=True, max_length=1000)),
                ("task", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="evidence_items", to="learning.learningdevelopmenttask")),
            ],
            options={"db_table": "learning_development_task_evidence", "ordering": ("-created_at",)},
        ),
        migrations.AddIndex(
            model_name="learningdevelopmenttaskevidence",
            index=models.Index(fields=["task", "-created_at"], name="learn_dev_task_ev_date_idx"),
        ),
    ]
