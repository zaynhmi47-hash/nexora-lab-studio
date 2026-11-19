import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("health", "0004_health_profile_created_audit_action"),
        ("identity", "0003_login_verified_event"),
    ]

    operations = [
        migrations.CreateModel(
            name="MedicalRecord",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("record_type", models.CharField(choices=[("clinical_note", "Clinical note"), ("diagnosis", "Diagnosis"), ("allergy", "Allergy"), ("procedure", "Procedure"), ("lab_result", "Laboratory result"), ("imaging", "Imaging"), ("vaccination", "Vaccination"), ("discharge_summary", "Discharge summary"), ("other", "Other")], max_length=24)),
                ("title", models.CharField(max_length=180)),
                ("description", models.TextField(blank=True)),
                ("occurred_at", models.DateTimeField()),
                ("source_type", models.CharField(choices=[("patient_reported", "Patient reported"), ("clinician_document", "Clinician document"), ("imported", "Imported"), ("other", "Other")], max_length=24)),
                ("source_name", models.CharField(blank=True, max_length=160)),
                ("facility_name", models.CharField(blank=True, max_length=180)),
                ("clinician_name", models.CharField(blank=True, max_length=160)),
                ("verification_status", models.CharField(choices=[("unverified", "Unverified"), ("verified", "Verified"), ("disputed", "Disputed")], default="unverified", max_length=16)),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="medical_records", to="health.healthprofile")),
                ("recorded_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="medical_records_created", to="identity.nexorauser")),
            ],
            options={
                "db_table": "health_medical_records",
                "ordering": ("-occurred_at", "-created_at"),
            },
        ),
        migrations.AddIndex(
            model_name="medicalrecord",
            index=models.Index(fields=["profile", "occurred_at"], name="health_record_profile_time_idx"),
        ),
        migrations.AddIndex(
            model_name="medicalrecord",
            index=models.Index(fields=["profile", "record_type"], name="health_record_profile_type_idx"),
        ),
        migrations.AlterField(
            model_name="healthaccessauditevent",
            name="action",
            field=models.CharField(choices=[
                ("access.granted", "Access granted"),
                ("access.revoked", "Access revoked"),
                ("profile.read", "Profile read"),
                ("profile.created", "Profile created"),
                ("record.read", "Medical record read"),
                ("record.created", "Medical record created"),
                ("record.updated", "Medical record updated"),
            ], max_length=24),
        ),
    ]
