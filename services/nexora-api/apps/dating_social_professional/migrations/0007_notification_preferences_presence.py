from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0006_push_tokens"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatingNotificationPreference",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("push_enabled", models.BooleanField(default=True)),
                ("match_push_enabled", models.BooleanField(default=True)),
                ("message_push_enabled", models.BooleanField(default=True)),
                ("safety_push_enabled", models.BooleanField(default=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="dating_notification_preferences", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_notification_preferences"},
        ),
        migrations.CreateModel(
            name="DatingConversationPresence",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("active", models.BooleanField(default=False)),
                ("last_seen_at", models.DateTimeField(blank=True, null=True)),
                ("conversation", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="active_presence", to="dating_social_professional.datingconversation")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="dating_conversation_presence", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_conversation_presence"},
        ),
        migrations.AddIndex(
            model_name="datingconversationpresence",
            index=models.Index(fields=("conversation", "active"), name="dating_presence_conv_active_idx"),
        ),
        migrations.AddIndex(
            model_name="datingconversationpresence",
            index=models.Index(fields=("user", "active"), name="dating_presence_user_active_idx"),
        ),
    ]
