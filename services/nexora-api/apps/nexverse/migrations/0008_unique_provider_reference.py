from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("nexverse", "0007_royalty_ledger"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="nexversepurchase",
            constraint=models.UniqueConstraint(
                condition=~models.Q(("provider_reference", "")),
                fields=("payment_provider", "provider_reference"),
                name="nex_purchase_provider_ref_uniq",
            ),
        ),
    ]
