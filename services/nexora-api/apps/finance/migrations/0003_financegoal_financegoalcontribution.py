from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0002_financebudget"),
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="FinanceGoal",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=150)),
                ("target_amount_minor", models.BigIntegerField(validators=[MinValueValidator(1)])),
                ("currency", models.CharField(default="IDR", max_length=3)),
                ("start_date", models.DateField()),
                ("target_date", models.DateField()),
                ("status", models.CharField(choices=[("active", "Active"), ("paused", "Paused"), ("archived", "Archived")], default="active", max_length=9)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="finance_goals", to="organizations.organization")),
            ],
            options={"db_table": "finance_goals", "ordering": ("status", "target_date", "name")},
        ),
        migrations.CreateModel(
            name="FinanceGoalContribution",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("amount_minor", models.BigIntegerField(validators=[MinValueValidator(1)])),
                ("currency", models.CharField(default="IDR", max_length=3)),
                ("contributed_at", models.DateTimeField(db_index=True)),
                ("status", models.CharField(choices=[("posted", "Posted"), ("void", "Void")], db_index=True, default="posted", max_length=6)),
                ("note", models.CharField(blank=True, max_length=500)),
                ("reference", models.CharField(blank=True, max_length=150)),
                ("idempotency_key", models.CharField(blank=True, max_length=100)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("goal", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="contributions", to="finance.financegoal")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="finance_goal_contributions", to="organizations.organization")),
            ],
            options={"db_table": "finance_goal_contributions", "ordering": ("-contributed_at", "-created_at")},
        ),
        migrations.AddIndex(model_name="financegoal", index=models.Index(fields=("organization", "status"), name="finance_goal_org_status_idx")),
        migrations.AddIndex(model_name="financegoal", index=models.Index(fields=("organization", "target_date"), name="finance_goal_org_target_idx")),
        migrations.AddIndex(model_name="financegoalcontribution", index=models.Index(fields=("organization", "goal", "contributed_at"), name="finance_goal_contrib_period_idx")),
        migrations.AddIndex(model_name="financegoalcontribution", index=models.Index(fields=("organization", "status"), name="finance_goal_contrib_status_idx")),
        migrations.AddConstraint(
            model_name="financegoalcontribution",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True) & ~models.Q(idempotency_key=""),
                fields=("organization", "idempotency_key"),
                name="finance_goal_contrib_org_idempotency_unique",
            ),
        ),
    ]
