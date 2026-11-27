import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("nexverse", "0007_royalty_ledger"),
    ]

    operations = [
        migrations.CreateModel(
            name="NexverseUploadSession",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("asset_type", models.CharField(choices=[("manuscript", "Manuscript"), ("cover", "Cover"), ("attachment", "Attachment")], max_length=16)),
                ("original_filename", models.CharField(max_length=255)),
                ("content_type", models.CharField(max_length=127)),
                ("expected_size_bytes", models.PositiveBigIntegerField()),
                ("storage_path", models.CharField(max_length=512, unique=True)),
                ("status", models.CharField(choices=[("created", "Created"), ("uploaded", "Uploaded"), ("expired", "Expired"), ("rejected", "Rejected")], db_index=True, default="created", max_length=16)),
                ("expires_at", models.DateTimeField(db_index=True)),
                ("uploaded_size_bytes", models.PositiveBigIntegerField(blank=True, null=True)),
                ("checksum_md5", models.CharField(blank=True, max_length=64)),
                ("uploaded_at", models.DateTimeField(blank=True, null=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="nexverse_upload_sessions", to="identity.nexorauser")),
                ("work", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="upload_sessions", to="nexverse.nexversework")),
            ],
            options={"db_table": "nexverse_upload_sessions", "ordering": ("-created_at",)},
        ),
        migrations.AddIndex(model_name="nexverseuploadsession", index=models.Index(fields=["owner", "status"], name="nex_upload_owner_status_idx")),
        migrations.AddIndex(model_name="nexverseuploadsession", index=models.Index(fields=["work", "asset_type"], name="nex_upload_work_type_idx")),
    ]
