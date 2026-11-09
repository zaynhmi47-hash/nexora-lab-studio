import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0019_dating_account_risk"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatingDatePlan",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("activity", models.CharField(choices=[("coffee", "Coffee"), ("food", "Food"), ("walk", "Walk"), ("art", "Art and culture"), ("movie", "Movie"), ("outdoor", "Outdoor"), ("other", "Other")], default="other", max_length=16)),
                ("title", models.CharField(max_length=120)),
                ("starts_at", models.DateTimeField()),
                ("timezone_name", models.CharField(default="Asia/Jakarta", max_length=64)),
                ("location_name", models.CharField(max_length=180)),
                ("notes", models.CharField(blank=True, max_length=1000)),
                ("status", models.CharField(choices=[("proposed", "Proposed"), ("accepted", "Accepted"), ("declined", "Declined"), ("cancelled", "Cancelled"), ("completed", "Completed")], db_index=True, default="proposed", max_length=16)),
                ("responded_at", models.DateTimeField(blank=True, null=True)),
                ("match", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="date_plans", to="dating_social_professional.datingmatch")),
                ("organizer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_plans_created", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_date_plans"},
        ),
        migrations.AddIndex(
            model_name="datingdateplan",
            index=models.Index(fields=["match", "starts_at"], name="dating_date_match_start_idx"),
        ),
        migrations.AddIndex(
            model_name="datingdateplan",
            index=models.Index(fields=["status", "starts_at"], name="dating_date_status_start_idx"),
        ),
        migrations.CreateModel(
            name="DatingRelationshipMilestone",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("stage", models.CharField(choices=[("first_hello", "First hello"), ("getting_to_know", "Getting to know"), ("first_date", "First date"), ("building_trust", "Building trust"), ("defining_relationship", "Defining the relationship")], max_length=32)),
                ("acknowledged_by_a_at", models.DateTimeField(blank=True, null=True)),
                ("acknowledged_by_b_at", models.DateTimeField(blank=True, null=True)),
                ("match", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="relationship_milestones", to="dating_social_professional.datingmatch")),
            ],
            options={"db_table": "dating_relationship_milestones"},
        ),
        migrations.AddConstraint(
            model_name="datingrelationshipmilestone",
            constraint=models.UniqueConstraint(fields=("match", "stage"), name="dating_milestone_match_stage_unique"),
        ),
        migrations.AddIndex(
            model_name="datingrelationshipmilestone",
            index=models.Index(fields=["match", "stage"], name="dating_milestone_match_stage_idx"),
        ),
    ]
