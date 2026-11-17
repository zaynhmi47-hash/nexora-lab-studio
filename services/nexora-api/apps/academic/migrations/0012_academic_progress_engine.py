import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0011_academic_transcript"),
        ("identity", "0001_initial"),
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicProgramEnrollment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("curriculum_version", models.CharField(max_length=32)),
                ("cohort_code", models.CharField(blank=True, max_length=32)),
                ("status", models.CharField(choices=[("active", "Active"), ("suspended", "Suspended"), ("withdrawn", "Withdrawn"), ("completed", "Completed")], db_index=True, default="active", max_length=16)),
                ("enrolled_at", models.DateField()),
                ("expected_graduation_on", models.DateField(blank=True, null=True)),
                ("membership", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_program_enrollments", to="organizations.membership")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_program_enrollments", to="organizations.organization")),
                ("program", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="student_enrollments", to="academic.academicprogram")),
            ],
            options={"db_table": "academic_program_enrollments"},
        ),
        migrations.AddConstraint(
            model_name="academicprogramenrollment",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True), ("status", "active")), fields=("organization", "membership", "program"), name="acad_program_enroll_active_unique"),
        ),
        migrations.AddConstraint(
            model_name="academicprogramenrollment",
            constraint=models.CheckConstraint(condition=models.Q(("expected_graduation_on__isnull", True), ("expected_graduation_on__gte", models.F("enrolled_at")), _connector="OR"), name="acad_program_expected_grad_after_enroll"),
        ),
        migrations.AddIndex(
            model_name="academicprogramenrollment",
            index=models.Index(fields=["organization", "program", "status"], name="acad_prog_enroll_lookup_idx"),
        ),
        migrations.AddIndex(
            model_name="academicprogramenrollment",
            index=models.Index(fields=["membership", "status"], name="acad_prog_enroll_member_idx"),
        ),
        migrations.CreateModel(
            name="AcademicProgressSnapshot",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("version", models.PositiveIntegerField()),
                ("snapshot", models.JSONField()),
                ("snapshot_checksum", models.CharField(max_length=64)),
                ("generated_at", models.DateTimeField()),
                ("enrollment", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="progress_snapshots", to="academic.academicprogramenrollment")),
                ("generated_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="generated_academic_progress_snapshots", to="identity.nexorauser")),
            ],
            options={"db_table": "academic_progress_snapshots", "ordering": ("-version",)},
        ),
        migrations.AddConstraint(
            model_name="academicprogresssnapshot",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("enrollment", "version"), name="acad_progress_snapshot_version_unique"),
        ),
        migrations.AddIndex(
            model_name="academicprogresssnapshot",
            index=models.Index(fields=["enrollment", "-generated_at"], name="acad_progress_enroll_idx"),
        ),
    ]
