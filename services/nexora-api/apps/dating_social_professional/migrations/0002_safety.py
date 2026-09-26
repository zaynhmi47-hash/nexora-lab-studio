from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [("dating_social_professional", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="DatingBlock",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("blocker", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_blocks_created", to="identity.nexorauser")),
                ("blocked", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_blocks_received", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_blocks"},
        ),
        migrations.CreateModel(
            name="DatingReport",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("reason", models.CharField(choices=[("harassment", "Harassment"), ("scam", "Scam"), ("impersonation", "Impersonation"), ("inappropriate", "Inappropriate content"), ("other", "Other")], max_length=32)),
                ("details", models.TextField(blank=True, max_length=2000)),
                ("reporter", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_reports_created", to="identity.nexorauser")),
                ("reported", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_reports_received", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_reports"},
        ),
        migrations.AddConstraint(
            model_name="datingblock",
            constraint=models.UniqueConstraint(fields=("blocker", "blocked"), name="dating_block_pair_unique"),
        ),
        migrations.AddIndex(
            model_name="datingreport",
            index=models.Index(fields=["reported", "created_at"], name="dating_report_reported_9b1e2c_idx"),
        ),
    ]
