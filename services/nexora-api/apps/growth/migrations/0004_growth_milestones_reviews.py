import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("growth", "0003_growth_evidence_event"),
    ]

    operations = [
        migrations.CreateModel(
            name="GrowthMilestone",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=180)),
                ("description", models.TextField(blank=True)),
                ("pillar", models.CharField(choices=[
                    ("self_awareness", "Self-awareness"),
                    ("intellectual", "Intellectual growth"),
                    ("skills", "Skills and competence"),
                    ("habits", "Habits and discipline"),
                    ("social_emotional", "Emotional and social"),
                    ("wellness", "Wellness"),
                    ("creativity", "Creativity"),
                    ("career_finance", "Career and finance"),
                    ("leadership", "Leadership and contribution"),
                    ("values_purpose", "Values and purpose"),
                ], max_length=24)),
                ("status", models.CharField(choices=[
                    ("planned", "Planned"), ("in_progress", "In progress"),
                    ("achieved", "Achieved"), ("paused", "Paused"),
                    ("cancelled", "Cancelled"),
                ], default="planned", max_length=16)),
                ("success_criteria", models.JSONField(blank=True, default=list)),
                ("target_date", models.DateField(blank=True, null=True)),
                ("achieved_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="growth_milestones",
                    to="identity.nexorauser",
                )),
            ],
            options={"db_table": "growth_milestones", "ordering": ("status", "target_date", "-created_at")},
        ),
        migrations.CreateModel(
            name="GrowthMilestoneEvidence",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("evidence_event", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="milestone_links",
                    to="growth.growthevidenceevent",
                )),
                ("milestone", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="evidence_links",
                    to="growth.growthmilestone",
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="growth_milestone_evidence",
                    to="identity.nexorauser",
                )),
            ],
            options={"db_table": "growth_milestone_evidence", "ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="GrowthDevelopmentReview",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("period", models.CharField(choices=[("weekly", "Weekly"), ("monthly", "Monthly")], max_length=8)),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                ("evidence_count", models.PositiveIntegerField(default=0)),
                ("achieved_milestone_count", models.PositiveIntegerField(default=0)),
                ("active_milestone_count", models.PositiveIntegerField(default=0)),
                ("pillar_activity", models.JSONField(blank=True, default=dict)),
                ("reflection", models.TextField(blank=True)),
                ("next_steps", models.JSONField(blank=True, default=list)),
                ("generated_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="growth_development_reviews",
                    to="identity.nexorauser",
                )),
            ],
            options={"db_table": "growth_development_reviews", "ordering": ("-period_end", "-generated_at")},
        ),
        migrations.AddIndex(
            model_name="growthmilestone",
            index=models.Index(fields=["user", "pillar", "status"], name="growth_milestone_pillar_idx"),
        ),
        migrations.AddIndex(
            model_name="growthmilestone",
            index=models.Index(fields=["user", "target_date"], name="growth_milestone_target_idx"),
        ),
        migrations.AddConstraint(
            model_name="growthmilestone",
            constraint=models.CheckConstraint(
                condition=~models.Q(status="achieved") | models.Q(achieved_at__isnull=False),
                name="growth_milestone_achieved_at_ck",
            ),
        ),
        migrations.AddConstraint(
            model_name="growthmilestoneevidence",
            constraint=models.UniqueConstraint(fields=("milestone", "evidence_event"), name="growth_milestone_evidence_uniq"),
        ),
        migrations.AddIndex(
            model_name="growthmilestoneevidence",
            index=models.Index(fields=["user", "-created_at"], name="growth_milestone_ev_user_idx"),
        ),
        migrations.AddConstraint(
            model_name="growthdevelopmentreview",
            constraint=models.UniqueConstraint(
                fields=("user", "period", "period_start", "period_end"),
                name="growth_development_review_period_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="growthdevelopmentreview",
            constraint=models.CheckConstraint(
                condition=models.Q(period_end__gte=models.F("period_start")),
                name="growth_development_review_dates_ck",
            ),
        ),
        migrations.AddIndex(
            model_name="growthdevelopmentreview",
            index=models.Index(fields=["user", "-period_end"], name="growth_review_user_end_idx"),
        ),
    ]
