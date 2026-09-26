from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0005_notifications"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatingPushToken",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("token", models.CharField(max_length=512, unique=True)),
                ("platform", models.CharField(max_length=32)),
                ("active", models.BooleanField(default=True)),
                ("last_seen_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="dating_push_tokens", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_push_tokens"},
        ),
        migrations.AddIndex(
            model_name="datingpushtoken",
            index=models.Index(fields=("user", "active"), name="dating_push_user_active_idx"),
        ),
    ]
