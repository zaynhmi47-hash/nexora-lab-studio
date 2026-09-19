from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
        ("finance", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="FinanceBudget",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=150)),
                ("category", models.CharField(max_length=100)),
                ("amount_minor", models.BigIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ("currency", models.CharField(default="IDR", max_length=3)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField()),
                ("status", models.CharField(choices=[("active", "Active"), ("archived", "Archived")], default="active", max_length=8)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="finance_budgets", to="organizations.organization")),
            ],
            options={
                "db_table": "finance_budgets",
                "ordering": ("-start_date", "category", "name"),
                "indexes": [
                    models.Index(fields=["organization", "start_date", "end_date"], name="finance_budget_period_idx"),
                    models.Index(fields=["organization", "status"], name="finance_budget_status_idx"),
                ],
            },
        ),
    ]
