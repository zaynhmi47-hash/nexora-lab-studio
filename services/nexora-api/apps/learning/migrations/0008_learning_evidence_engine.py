import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("learning", "0007_learning_lesson_content"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningCompetency",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.SlugField(max_length=120, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("domain", models.CharField(db_index=True, max_length=80)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(db_index=True, default=False)),
                ("parent", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="children", to="learning.learningcompetency")),
            ],
            options={"db_table": "learning_competencies", "ordering": ("domain", "sort_order", "title")},
        ),
        migrations.CreateModel(
            name="LearningOutcome",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.SlugField(max_length=140, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("success_criteria", models.JSONField(blank=True, default=list)),
                ("proficiency_level", models.PositiveSmallIntegerField(default=1)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(db_index=True, default=False)),
                ("competency", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="outcomes", to="learning.learningcompetency")),
            ],
            options={"db_table": "learning_outcomes", "ordering": ("competency__domain", "competency__sort_order", "sort_order", "title")},
        ),
        migrations.CreateModel(
            name="LearningEvidence",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("evidence_type", models.CharField(choices=[("project", "Project"), ("assignment", "Assignment"), ("certificate", "Certificate"), ("practice", "Practical demonstration"), ("reflection", "Reflection"), ("other", "Other")], max_length=20)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("artifact_url", models.URLField(blank=True, max_length=1000)),
                ("source_type", models.CharField(choices=[("self_reported", "Self reported"), ("learning", "Dignity Learn"), ("academic", "Academic"), ("career", "Career"), ("external", "External")], default="self_reported", max_length=20)),
                ("source_reference", models.CharField(blank=True, max_length=255)),
                ("status", models.CharField(choices=[("pending", "Pending review"), ("verified", "Verified"), ("rejected", "Needs revision")], db_index=True, default="pending", max_length=12)),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
                ("review_note", models.TextField(blank=True)),
                ("outcome", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="evidence", to="learning.learningoutcome")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="learning_evidence", to="identity.nexorauser")),
                ("verified_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="verified_learning_evidence", to="identity.nexorauser")),
            ],
            options={"db_table": "learning_evidence", "ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="LearningMastery",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("level", models.PositiveSmallIntegerField(default=0)),
                ("status", models.CharField(choices=[("unassessed", "Unassessed"), ("provisional", "Provisional"), ("verified", "Verified")], db_index=True, default="unassessed", max_length=12)),
                ("assessment_method", models.CharField(blank=True, max_length=80)),
                ("rationale", models.TextField(blank=True)),
                ("assessed_at", models.DateTimeField(blank=True, null=True)),
                ("assessed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assessed_learning_mastery", to="identity.nexorauser")),
                ("outcome", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="mastery_records", to="learning.learningoutcome")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="learning_mastery", to="identity.nexorauser")),
            ],
            options={"db_table": "learning_mastery"},
        ),
        migrations.AddConstraint(
            model_name="learningoutcome",
            constraint=models.CheckConstraint(condition=models.Q(("proficiency_level__gte", 1), ("proficiency_level__lte", 5)), name="learning_outcome_level_1_5"),
        ),
        migrations.AddIndex(
            model_name="learningevidence",
            index=models.Index(fields=["user", "status"], name="learn_ev_user_status_idx"),
        ),
        migrations.AddIndex(
            model_name="learningevidence",
            index=models.Index(fields=["outcome", "status"], name="learn_ev_out_status_idx"),
        ),
        migrations.AddConstraint(
            model_name="learningevidence",
            constraint=models.CheckConstraint(
                condition=(
                    ~models.Q(("status__in", ("verified", "rejected")))
                    | (models.Q(("verified_by__isnull", False)) & models.Q(("verified_at__isnull", False)))
                ),
                name="learn_evidence_review_audit_ck",
            ),
        ),
        migrations.AddConstraint(
            model_name="learningmastery",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("user", "outcome"), name="learning_user_outcome_mastery_unique"),
        ),
        migrations.AddConstraint(
            model_name="learningmastery",
            constraint=models.CheckConstraint(condition=models.Q(("level__gte", 0), ("level__lte", 5)), name="learning_mastery_level_0_5"),
        ),
        migrations.AddConstraint(
            model_name="learningmastery",
            constraint=models.CheckConstraint(
                condition=(
                    ~models.Q(("status__in", ("provisional", "verified")))
                    | (models.Q(("assessed_by__isnull", False)) & models.Q(("assessed_at__isnull", False)))
                ),
                name="learn_mastery_assessment_ck",
            ),
        ),
    ]
