import uuid
import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0001_initial")]
    operations = [
        migrations.CreateModel(name="Dhikr", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("key", models.CharField(db_index=True, max_length=100, unique=True)), ("title", models.CharField(max_length=255)),
            ("arabic", models.TextField()), ("transliteration", models.TextField()), ("translation", models.TextField()),
            ("target", models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
            ("category", models.CharField(choices=[("morning", "Morning"), ("evening", "Evening"), ("general", "General")], db_index=True, max_length=16)),
            ("is_published", models.BooleanField(db_index=True, default=True)),
        ], options={"db_table": "dhikr_items", "ordering": ("category", "title")}),
        migrations.CreateModel(name="DhikrProgress", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)), ("completed", models.PositiveIntegerField(default=0)),
            ("dhikr", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="progress", to="dhikr.dhikr")),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="dhikr_progress", to="identity.nexorauser")),
        ], options={"db_table": "dhikr_progress"}),
        migrations.CreateModel(name="DhikrHistoryEntry", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("count", models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
            ("completed_at", models.DateTimeField()),
            ("dhikr", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="history", to="dhikr.dhikr")),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="dhikr_history", to="identity.nexorauser")),
        ], options={"db_table": "dhikr_history", "ordering": ("-completed_at",)}),
        migrations.AddConstraint(model_name="dhikrprogress", constraint=models.UniqueConstraint(fields=("user", "dhikr"), name="dhikr_user_item_unique")),
        migrations.AddIndex(model_name="dhikrhistoryentry", index=models.Index(fields=("user", "dhikr", "completed_at"), name="dhikr_history_user_item_idx")),
    ]
