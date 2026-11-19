from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.health.models import MedicalRecord
from apps.health.services.medical_records import (
    create_medical_record,
    get_accessible_record,
    get_accessible_records,
    record_medical_record_read,
    update_medical_record,
)
from apps.health.services.profile_access import get_accessible_profile
from apps.identity.authentication import FirebaseIdentityAuthentication


class MedicalRecordSerializer(serializers.Serializer):
    record_type = serializers.ChoiceField(choices=MedicalRecord.RecordType.choices)
    title = serializers.CharField(max_length=180, trim_whitespace=True)
    description = serializers.CharField(required=False, allow_blank=True, max_length=20000)
    occurred_at = serializers.DateTimeField()
    source_type = serializers.ChoiceField(choices=MedicalRecord.SourceType.choices)
    source_name = serializers.CharField(required=False, allow_blank=True, max_length=160)
    facility_name = serializers.CharField(required=False, allow_blank=True, max_length=180)
    clinician_name = serializers.CharField(required=False, allow_blank=True, max_length=160)
    verification_status = serializers.ChoiceField(
        choices=MedicalRecord.VerificationStatus.choices, required=False,
    )

    def validate_verification_status(self, value):
        request = self.context["request"]
        # Only the record owner may mark a record verified or disputed.
        if value != MedicalRecord.VerificationStatus.UNVERIFIED:
            profile = self.context.get("profile")
            if profile is not None and profile.owner_id != request.user.pk:
                raise serializers.ValidationError("Only the profile owner may change verification status.")
        return value


class HealthMedicalRecordAPIView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    @staticmethod
    def serialize(record):
        return {
            "id": str(record.pk),
            "profileId": str(record.profile_id),
            "recordType": record.record_type,
            "title": record.title,
            "description": record.description,
            "occurredAt": record.occurred_at.isoformat(),
            "sourceType": record.source_type,
            "sourceName": record.source_name,
            "facilityName": record.facility_name,
            "clinicianName": record.clinician_name,
            "verificationStatus": record.verification_status,
            "recordedById": str(record.recorded_by_id),
            "createdAt": record.created_at.isoformat(),
            "updatedAt": record.updated_at.isoformat(),
        }

    @staticmethod
    def translate_error(exc):
        if isinstance(exc, DjangoValidationError):
            detail = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            raise ValidationError(detail) from exc
        if isinstance(exc, PermissionError):
            raise PermissionDenied(str(exc)) from exc
        raise exc


class MedicalRecordListCreateView(HealthMedicalRecordAPIView):
    def get(self, request, profile_id):
        profile = get_accessible_profile(actor=request.user, profile_id=profile_id, scope="records.read")
        records = get_accessible_records(actor=request.user, profile=profile)
        data = list(records)
        for record in data:
            record_medical_record_read(actor=request.user, record=record)
        return Response({"data": [self.serialize(record) for record in data]})

    def post(self, request, profile_id):
        profile = get_accessible_profile(actor=request.user, profile_id=profile_id, scope="records.write")
        serializer = MedicalRecordSerializer(data=request.data, context={"request": request, "profile": profile})
        serializer.is_valid(raise_exception=True)
        try:
            record = create_medical_record(actor=request.user, profile=profile, **serializer.validated_data)
        except DjangoValidationError as exc:
            self.translate_error(exc)
        except Exception as exc:
            from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
            if isinstance(exc, DjangoPermissionDenied):
                raise PermissionDenied(str(exc)) from exc
            raise
        return Response({"data": self.serialize(record)}, status=201)


class MedicalRecordDetailView(HealthMedicalRecordAPIView):
    def get(self, request, profile_id, record_id):
        record = get_accessible_record(actor=request.user, profile_id=profile_id, record_id=record_id)
        record_medical_record_read(actor=request.user, record=record)
        return Response({"data": self.serialize(record)})

    def patch(self, request, profile_id, record_id):
        record = get_accessible_record(
            actor=request.user, profile_id=profile_id, record_id=record_id, scope="records.write",
        )
        serializer = MedicalRecordSerializer(
            data=request.data, partial=True, context={"request": request, "profile": record.profile},
        )
        serializer.is_valid(raise_exception=True)
        if "verification_status" in serializer.validated_data and record.profile.owner_id != request.user.pk:
            raise PermissionDenied("Only the profile owner may change verification status.")
        try:
            updated = update_medical_record(
                actor=request.user, record=record, changes=serializer.validated_data,
            )
        except Exception as exc:
            from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
            if isinstance(exc, DjangoPermissionDenied):
                raise PermissionDenied(str(exc)) from exc
            raise
        return Response({"data": self.serialize(updated)})
