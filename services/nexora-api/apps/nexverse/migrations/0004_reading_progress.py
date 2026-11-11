import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("nexverse", "0003_moderation_audit"),
    ]

    operations = [
        migrations.CreateModel(
            name="NexverseReadingProgress",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("position_chars", models.PositiveIntegerField(default=0)),
                ("progress_percent", models.PositiveSmallIntegerField(default=0)),
                ("chapter", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reading_progress", to="nexverse.nexversechapter")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="nexverse_reading_progress", to="identity.nexorauser")),
                ("work", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reading_progress", to="nexverse.nexversework")),
            ],
            options={"db_table": "nexverse_reading_progress"},
        ),
        migrations.AddConstraint(
            model_name="nexversereadingprogress",
            constraint=models.UniqueConstraint(fields=("user", "work"), name="nex_read_progress_user_work_uniq"),
        ),
        migrations.AddIndex(
            model_name="nexversereadingprogress",
            index=models.Index(fields=["user", "updated_at"], name="nex_read_progress_user_idx"),
        ),
    ]
