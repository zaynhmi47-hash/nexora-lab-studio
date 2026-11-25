from django.db import models

from apps.core.models import AuditableBaseModel


class MedicalRecord(AuditableBaseModel):
    """A typed health record with explicit provenance and verification state."""

    class RecordType(models.TextChoices):
        CLINICAL_NOTE = "clinical_note", "Clinical note"
        DIAGNOSIS = "diagnosis", "Diagnosis"
        ALLERGY = "allergy", "Allergy"
        PROCEDURE = "procedure", "Procedure"
        LAB_RESULT = "lab_result", "Laboratory result"
        IMAGING = "imaging", "Imaging"
        VACCINATION = "vaccination", "Vaccination"
        DISCHARGE_SUMMARY = "discharge_summary", "Discharge summary"
        OTHER = "other", "Other"

    class SourceType(models.TextChoices):
        PATIENT_REPORTED = "patient_reported", "Patient reported"
        CLINICIAN_DOCUMENT = "clinician_document", "Clinician document"
        IMPORTED = "imported", "Imported"
        OTHER = "other", "Other"

    class VerificationStatus(models.TextChoices):
        UNVERIFIED = "unverified", "Unverified"
        VERIFIED = "verified", "Verified"
        DISPUTED = "disputed", "Disputed"

    profile = models.ForeignKey("health.HealthProfile", on_delete=models.PROTECT, related_name="medical_records")
    record_type = models.CharField(max_length=24, choices=RecordType.choices)
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    occurred_at = models.DateTimeField()
    source_type = models.CharField(max_length=24, choices=SourceType.choices)
    source_name = models.CharField(max_length=160, blank=True)
    facility_name = models.CharField(max_length=180, blank=True)
    clinician_name = models.CharField(max_length=160, blank=True)
    verification_status = models.CharField(
        max_length=16, choices=VerificationStatus.choices, default=VerificationStatus.UNVERIFIED,
    )
    recorded_by = models.ForeignKey(
        "identity.NexoraUser", on_delete=models.PROTECT, related_name="medical_records_created",
    )

    class Meta:
        db_table = "health_medical_records"
        ordering = ("-occurred_at", "-created_at")
        indexes = [
            models.Index(fields=("profile", "occurred_at"), name="health_record_profile_time_idx"),
            models.Index(fields=("profile", "record_type"), name="health_record_profile_type_idx"),
        ]

    def __str__(self):
        return self.title
