from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("dating_social_professional", "0003_discovery_preferences")]
    operations = [
        migrations.CreateModel(name="DatingConversation", fields=[
            ("id", models.UUIDField(primary_key=True, serialize=False, editable=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(null=True, blank=True)),
            ("active", models.BooleanField(default=True, db_index=True)),
            ("match", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="conversation", to="dating_social_professional.datingmatch")),
        ], options={"db_table": "dating_conversations"}),
        migrations.CreateModel(name="DatingMessage", fields=[
            ("id", models.UUIDField(primary_key=True, serialize=False, editable=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(null=True, blank=True)),
            ("body", models.TextField(max_length=5000)),
            ("read_at", models.DateTimeField(null=True, blank=True)),
            ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="messages", to="dating_social_professional.datingconversation")),
            ("sender", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_messages", to="identity.nexorauser")),
        ], options={"db_table": "dating_messages"}),
        migrations.AddIndex(model_name="datingmessage", index=models.Index(fields=["conversation", "created_at"], name="dating_msg_conv_created_idx")),
        migrations.AddIndex(model_name="datingmessage", index=models.Index(fields=["conversation", "read_at"], name="dating_msg_conv_read_idx")),
    ]
