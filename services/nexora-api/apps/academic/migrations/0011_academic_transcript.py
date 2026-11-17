import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0010_gpa_policy_and_calculation"),
        ("identity", "0001_initial"),
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicTranscript",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("transcript_number", models.CharField(max_length=64)),
                ("version", models.PositiveSmallIntegerField()),
                ("status", models.CharField(choices=[("issued", "Issued"), ("revoked", "Revoked")], db_index=True, default="issued", max_length=12)),
                ("snapshot", models.JSONField()),
                ("snapshot_checksum", models.CharField(max_length=64)),
                ("issued_at", models.DateTimeField()),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("revocation_reason", models.TextField(blank=True)),
                ("issued_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="issued_academic_transcripts", to="identity.nexorauser")),
                ("membership", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_transcripts", to="organizations.membership")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_transcripts", to="organizations.organization")),
                ("program", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="transcripts", to="academic.academicprogram")),
                ("revoked_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="revoked_academic_transcripts", to="identity.nexorauser")),
            ],
            options={
                "db_table": "academic_transcripts",
                "ordering": ("-issued_at", "-version"),
            },
        ),
        migrations.AddConstraint(
            model_name="academictranscript",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "transcript_number"), name="acad_transcript_number_unique"),
        ),
        migrations.AddConstraint(
            model_name="academictranscript",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "membership", "program", "version"), name="acad_transcript_version_unique"),
        ),
        migrations.AddIndex(
            model_name="academictranscript",
            index=models.Index(fields=["organization", "membership", "program", "-issued_at"], name="acad_transcript_member_idx"),
        ),
    ]
