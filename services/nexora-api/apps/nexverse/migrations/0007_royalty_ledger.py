import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("nexverse", "0006_monetization_foundation"),
    ]

    operations = [
        migrations.CreateModel(
            name="NexverseRoyaltyEntry",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("entry_type", models.CharField(choices=[("credit", "Purchase credit"), ("reversal", "Refund reversal")], max_length=12)),
                ("currency", models.CharField(max_length=3)),
                ("amount_minor", models.PositiveBigIntegerField()),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="royalty_entries", to="nexverse.nexverseauthor")),
                ("purchase", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="royalty_entries", to="nexverse.nexversepurchase")),
            ],
            options={"db_table": "nexverse_royalty_entries"},
        ),
        migrations.AddConstraint(
            model_name="nexverseroyaltyentry",
            constraint=models.UniqueConstraint(fields=("purchase", "entry_type"), name="nex_royalty_purchase_type_uniq"),
        ),
        migrations.AddConstraint(
            model_name="nexverseroyaltyentry",
            constraint=models.CheckConstraint(condition=models.Q(("amount_minor__gt", 0)), name="nex_royalty_amount_positive"),
        ),
        migrations.AddIndex(
            model_name="nexverseroyaltyentry",
            index=models.Index(fields=["author", "currency", "created_at"], name="nex_royalty_author_idx"),
        ),
    ]
