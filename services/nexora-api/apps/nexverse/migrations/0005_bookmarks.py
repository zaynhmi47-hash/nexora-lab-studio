import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("nexverse", "0004_reading_progress"),
    ]

    operations = [
        migrations.CreateModel(
            name="NexverseBookmark",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="nexverse_bookmarks", to="identity.nexorauser")),
                ("work", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="bookmarks", to="nexverse.nexversework")),
            ],
            options={"db_table": "nexverse_bookmarks"},
        ),
        migrations.AddConstraint(
            model_name="nexversebookmark",
            constraint=models.UniqueConstraint(fields=("user", "work"), name="nex_bookmark_user_work_uniq"),
        ),
        migrations.AddIndex(
            model_name="nexversebookmark",
            index=models.Index(fields=["user", "created_at"], name="nex_bookmark_user_idx"),
        ),
    ]
