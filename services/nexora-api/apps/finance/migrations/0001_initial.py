from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("organizations", "0002_add_membership_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="Transaction",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("transaction_type", models.CharField(choices=[("income", "Income"), ("expense", "Expense")], max_length=16)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=18, validators=[MinValueValidator(Decimal("0.01"))])),
                ("currency", models.CharField(default="IDR", max_length=3)),
                ("category", models.CharField(max_length=100)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("occurred_at", models.DateTimeField()),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="finance_transactions", to="organizations.organization")),
            ],
            options={
                "db_table": "finance_transactions",
                "ordering": ("-occurred_at", "-created_at"),
                "indexes": [
                    models.Index(fields=["organization", "occurred_at"], name="finance_tx_org_date_idx"),
                    models.Index(fields=["organization", "transaction_type"], name="finance_tx_org_type_idx"),
                ],
            },
        ),
    ]
