import django.db.models.deletion
import django.db.models
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="GrowthGoal",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=180)),
                ("description", models.TextField(blank=True)),
                ("category", models.CharField(choices=[("personal", "Personal"), ("learning", "Learning"), ("career", "Career"), ("wellness", "Wellness"), ("relationship", "Relationship"), ("financial", "Financial"), ("contribution", "Contribution"), ("other", "Other")], default="personal", max_length=20)),
                ("success_criteria", models.JSONField(blank=True, default=list)),
                ("start_date", models.DateField()),
                ("target_date", models.DateField(blank=True, null=True)),
                ("status", models.CharField(choices=[("active", "Active"), ("paused", "Paused"), ("completed", "Completed"), ("archived", "Archived")], default="active", max_length=12)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="growth_goals", to="identity.nexorauser")),
            ],
            options={"db_table": "growth_goals", "ordering": ("status", "target_date", "-created_at")},
        ),
        migrations.CreateModel(
            name="GrowthJournalEntry",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("entry_date", models.DateField()),
                ("title", models.CharField(blank=True, max_length=180)),
                ("prompt", models.CharField(blank=True, max_length=255)),
                ("body", models.TextField()),
                ("mood", models.CharField(blank=True, choices=[("very_low", "Very low"), ("low", "Low"), ("neutral", "Neutral"), ("good", "Good"), ("very_good", "Very good")], max_length=12)),
                ("gratitude", models.JSONField(blank=True, default=list)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="growth_journal_entries", to="identity.nexorauser")),
            ],
            options={"db_table": "growth_journal_entries", "ordering": ("-entry_date", "-created_at")},
        ),
        migrations.AddConstraint(
            model_name="growthgoal",
            constraint=models.CheckConstraint(
                condition=models.Q(("target_date__isnull", True)) | models.Q(("target_date__gte", models.F("start_date"))),
                name="growth_goal_target_after_start_ck",
            ),
        ),
        migrations.AddConstraint(
            model_name="growthgoal",
            constraint=models.CheckConstraint(
                condition=~models.Q(("status", "completed")) | models.Q(("completed_at__isnull", False)),
                name="growth_goal_completed_at_ck",
            ),
        ),
        migrations.AddConstraint(
            model_name="growthjournalentry",
            constraint=models.CheckConstraint(condition=~models.Q(("body", "")), name="growth_journal_body_not_empty_ck"),
        ),
        migrations.AddIndex(
            model_name="growthgoal",
            index=models.Index(fields=["user", "status"], name="growth_goal_user_status_idx"),
        ),
        migrations.AddIndex(
            model_name="growthgoal",
            index=models.Index(fields=["user", "target_date"], name="growth_goal_user_target_idx"),
        ),
        migrations.AddIndex(
            model_name="growthjournalentry",
            index=models.Index(fields=["user", "-entry_date"], name="growth_journal_user_date_idx"),
        ),
    ]
