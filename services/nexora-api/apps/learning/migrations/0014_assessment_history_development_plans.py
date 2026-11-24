import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("learning", "0013_learning_evidence_source_reference_unique"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningMasteryAssessmentEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("level", models.PositiveSmallIntegerField()),
                ("status", models.CharField(choices=[("unassessed", "Unassessed"), ("provisional", "Provisional"), ("verified", "Verified")], max_length=12)),
                ("assessment_method", models.CharField(max_length=80)),
                ("rationale", models.TextField()),
                ("assessed_at", models.DateTimeField()),
                ("assessed_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="authored_mastery_assessments", to="identity.nexorauser")),
                ("outcome", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="assessment_history", to="learning.learningoutcome")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="mastery_assessment_history", to="identity.nexorauser")),
            ],
            options={"db_table": "learning_mastery_assessment_events", "ordering": ("-assessed_at", "-id")},
        ),
        migrations.AddIndex(
            model_name="learningmasteryassessmentevent",
            index=models.Index(fields=["user", "-assessed_at"], name="learn_mastery_hist_user_idx"),
        ),
        migrations.CreateModel(
            name="LearningDevelopmentPlan",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("target_level", models.PositiveSmallIntegerField()),
                ("actions", models.JSONField(default=list)),
                ("reflection", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("active", "Active"), ("completed", "Completed"), ("paused", "Paused")], db_index=True, default="active", max_length=12)),
                ("target_date", models.DateField(blank=True, null=True)),
                ("outcome", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="development_plans", to="learning.learningoutcome")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="learning_development_plans", to="identity.nexorauser")),
            ],
            options={"db_table": "learning_development_plans", "ordering": ("target_date", "-created_at")},
        ),
        migrations.AddIndex(
            model_name="learningdevelopmentplan",
            index=models.Index(fields=["user", "status"], name="learn_dev_plan_user_status_idx"),
        ),
    ]
