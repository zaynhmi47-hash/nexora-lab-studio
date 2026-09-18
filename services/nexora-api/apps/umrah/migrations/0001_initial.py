import django.db.models.deletion
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="UmrahStage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.CharField(db_index=True, max_length=50, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("sort_order", models.PositiveIntegerField(unique=True)),
                ("is_published", models.BooleanField(db_index=True, default=True)),
            ],
            options={"db_table": "umrah_stages", "ordering": ("sort_order",)},
        ),
        migrations.CreateModel(
            name="UmrahChecklistItem",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.CharField(db_index=True, max_length=100, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("required", models.BooleanField(default=False)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("stage", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="checklist_items", to="umrah.umrahstage")),
            ],
            options={"db_table": "umrah_checklist_items", "ordering": ("stage", "sort_order")},
        ),
        migrations.CreateModel(
            name="UmrahChecklistProgress",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("completed", models.BooleanField(default=False)),
                ("item", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="user_progress", to="umrah.umrahchecklistitem")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="umrah_checklist_progress", to="identity.nexorauser")),
            ],
            options={"db_table": "umrah_checklist_progress"},
        ),
        migrations.AddConstraint(
            model_name="umrahchecklistitem",
            constraint=models.UniqueConstraint(fields=("stage", "sort_order"), name="umrah_stage_item_order_unique"),
        ),
        migrations.AddConstraint(
            model_name="umrahchecklistprogress",
            constraint=models.UniqueConstraint(fields=("user", "item"), name="umrah_user_item_unique"),
        ),
    ]
