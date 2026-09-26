from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0004_conversations"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatingNotification",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("type", models.CharField(choices=[("match", "Match"), ("message", "Message"), ("safety", "Safety")], max_length=32)),
                ("title", models.CharField(max_length=160)),
                ("body", models.CharField(max_length=500)),
                ("data", models.JSONField(blank=True, default=dict)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("recipient", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_notifications", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_notifications"},
        ),
        migrations.AddIndex(
            model_name="datingnotification",
            index=models.Index(fields=("recipient", "read_at", "created_at"), name="dating_notif_rec_read_idx"),
        ),
        migrations.AddIndex(
            model_name="datingnotification",
            index=models.Index(fields=("recipient", "created_at"), name="dating_notif_rec_created_idx"),
        ),
    ]
