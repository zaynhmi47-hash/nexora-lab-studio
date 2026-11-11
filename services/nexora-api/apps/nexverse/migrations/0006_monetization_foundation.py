import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("nexverse", "0005_bookmarks"),
    ]

    operations = [
        migrations.CreateModel(
            name="NexverseChapterPrice",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("currency", models.CharField(default="IDR", max_length=3)),
                ("amount_minor", models.PositiveBigIntegerField()),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("chapter", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="price", to="nexverse.nexversechapter")),
            ],
            options={"db_table": "nexverse_chapter_prices"},
        ),
        migrations.AddConstraint(
            model_name="nexversechapterprice",
            constraint=models.CheckConstraint(condition=models.Q(("amount_minor__gt", 0)), name="nex_chapter_price_positive"),
        ),
        migrations.CreateModel(
            name="NexversePurchase",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("idempotency_key", models.CharField(max_length=128)),
                ("currency", models.CharField(max_length=3)),
                ("amount_minor", models.PositiveBigIntegerField()),
                ("status", models.CharField(choices=[("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed"), ("refunded", "Refunded"), ("cancelled", "Cancelled")], db_index=True, default="pending", max_length=16)),
                ("payment_provider", models.CharField(blank=True, max_length=40)),
                ("provider_reference", models.CharField(blank=True, max_length=160)),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                ("chapter", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="purchases", to="nexverse.nexversechapter")),
                ("price", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="purchases", to="nexverse.nexversechapterprice")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="nexverse_purchases", to="identity.nexorauser")),
            ],
            options={"db_table": "nexverse_purchases"},
        ),
        migrations.AddConstraint(
            model_name="nexversepurchase",
            constraint=models.UniqueConstraint(fields=("user", "idempotency_key"), name="nex_purchase_user_idem_uniq"),
        ),
        migrations.AddConstraint(
            model_name="nexversepurchase",
            constraint=models.CheckConstraint(condition=models.Q(("amount_minor__gt", 0)), name="nex_purchase_amount_positive"),
        ),
        migrations.AddIndex(
            model_name="nexversepurchase",
            index=models.Index(fields=["user", "status", "created_at"], name="nex_purchase_user_idx"),
        ),
        migrations.CreateModel(
            name="NexverseEntitlement",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("active", "Active"), ("revoked", "Revoked")], db_index=True, default="active", max_length=12)),
                ("starts_at", models.DateTimeField()),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("chapter", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="entitlements", to="nexverse.nexversechapter")),
                ("purchase", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="entitlement", to="nexverse.nexversepurchase")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="nexverse_entitlements", to="identity.nexorauser")),
                ("work", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="entitlements", to="nexverse.nexversework")),
            ],
            options={"db_table": "nexverse_entitlements"},
        ),
        migrations.AddIndex(
            model_name="nexverseentitlement",
            index=models.Index(fields=["user", "work", "chapter", "status"], name="nex_entitlement_lookup_idx"),
        ),
    ]
