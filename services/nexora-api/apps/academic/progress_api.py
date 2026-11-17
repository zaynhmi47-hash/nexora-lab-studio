from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.models import AcademicCurriculumCourse, AcademicProgram, AcademicProgramEnrollment, AcademicProgressSnapshot
from apps.academic.progress_services import AcademicProgressService
from apps.control_plane.audit import record_control_plane_audit
from apps.core.api.response import success_response
from apps.organizations.models import Membership, Organization


class ProgramEnrollmentInputSerializer(serializers.Serializer):
    membership_id = serializers.UUIDField()
    program_id = serializers.UUIDField()
    curriculum_version = serializers.CharField(max_length=32)
    cohort_code = serializers.CharField(max_length=32, required=False, allow_blank=True)
    enrolled_at = serializers.DateField()
    expected_graduation_on = serializers.DateField(required=False, allow_null=True)


class AcademicProgramEnrollmentOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicProgramEnrollment
        fields = (
            "id", "membership", "program", "curriculum_version", "cohort_code",
            "status", "enrolled_at", "expected_graduation_on", "created_at",
        )


class AcademicProgressSnapshotOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicProgressSnapshot
        fields = ("id", "version", "snapshot", "snapshot_checksum", "generated_at", "generated_by")


def _organization(organization_id):
    organization = Organization.objects.active().filter(
        id=organization_id, status=Organization.Status.ACTIVE,
    ).first()
    if organization is None:
        raise NotFound("Organization not found.")
    return organization


class AcademicProgramEnrollmentListCreateView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    def get(self, request, organization_id):
        organization = _organization(organization_id)
        queryset = AcademicProgramEnrollment.objects.active().filter(
            organization=organization,
        ).select_related("membership", "program")
        membership_id = request.query_params.get("membership_id")
        if membership_id:
            queryset = queryset.filter(membership_id=membership_id)
        if not request.user.is_staff:
            queryset = queryset.filter(membership__user_id=request.user.id)
        return success_response(AcademicProgramEnrollmentOutputSerializer(queryset, many=True).data)

    def post(self, request, organization_id):
        organization = _organization(organization_id)
        serializer = ProgramEnrollmentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        membership = Membership.objects.active().filter(
            id=data["membership_id"], organization=organization, status=Membership.Status.ACTIVE,
        ).first()
        program = AcademicProgram.objects.active().filter(
            id=data["program_id"], organization=organization, is_active=True,
        ).first()
        if membership is None or program is None:
            raise NotFound("Active organization membership or academic program not found.")
        if not AcademicCurriculumCourse.objects.active().filter(
            organization=organization, program=program,
            curriculum_version=data["curriculum_version"], is_active=True,
        ).exists():
            raise ValidationError({"curriculum_version": "No active curriculum exists for this version."})
        enrollment = AcademicProgramEnrollment(
            organization=organization,
            membership=membership,
            program=program,
            curriculum_version=data["curriculum_version"],
            cohort_code=data.get("cohort_code", ""),
            enrolled_at=data["enrolled_at"],
            expected_graduation_on=data.get("expected_graduation_on"),
        )
        try:
            enrollment.full_clean()
            enrollment.save()
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}) from exc
        record_control_plane_audit(
            event_type="ACADEMIC_RESOURCE_CHANGED",
            actor=request.user,
            metadata={
                "organization_id": str(organization.pk),
                "action": "program_enrolled",
                "resource": "academic_program_enrollment",
                "resource_id": str(enrollment.pk),
                "membership_id": str(membership.pk),
                "program_id": str(program.pk),
                "curriculum_version": enrollment.curriculum_version,
            },
        )
        return success_response(AcademicProgramEnrollmentOutputSerializer(enrollment).data, status=201)


class AcademicProgramProgressView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.grade" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    def _enrollment(self, request, organization_id, enrollment_id):
        organization = _organization(organization_id)
        enrollment = AcademicProgramEnrollment.objects.active().filter(
            pk=enrollment_id, organization=organization,
        ).select_related("organization", "membership", "program").first()
        if enrollment is None:
            raise NotFound("Program enrollment not found.")
        if not request.user.is_staff and enrollment.membership.user_id != request.user.id:
            raise NotFound("Program enrollment not found.")
        return enrollment

    def get(self, request, organization_id, enrollment_id):
        enrollment = self._enrollment(request, organization_id, enrollment_id)
        snapshot = AcademicProgressSnapshot.objects.filter(
            enrollment=enrollment, deleted_at__isnull=True,
        ).order_by("-version").first()
        if snapshot is None:
            try:
                payload = AcademicProgressService.calculate(enrollment)
            except DjangoValidationError as exc:
                raise ValidationError(exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}) from exc
            return success_response({"snapshot": payload, "persisted": False})
        if AcademicProgressService.checksum(snapshot.snapshot) != snapshot.snapshot_checksum:
            raise ValidationError({"integrity": "Academic progress snapshot checksum verification failed."})
        return success_response({
            **AcademicProgressSnapshotOutputSerializer(snapshot).data,
            "persisted": True,
        })

    def post(self, request, organization_id, enrollment_id):
        enrollment = self._enrollment(request, organization_id, enrollment_id)
        try:
            snapshot = AcademicProgressService.create_snapshot(
                enrollment=enrollment, generated_by=request.user,
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}) from exc
        record_control_plane_audit(
            event_type="ACADEMIC_RESOURCE_CHANGED",
            actor=request.user,
            metadata={
                "organization_id": str(enrollment.organization_id),
                "action": "progress_snapshot_created",
                "resource": "academic_progress_snapshot",
                "resource_id": str(snapshot.pk),
                "enrollment_id": str(enrollment.pk),
                "version": snapshot.version,
                "snapshot_checksum": snapshot.snapshot_checksum,
            },
        )
        return success_response(AcademicProgressSnapshotOutputSerializer(snapshot).data, status=201)
