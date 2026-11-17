from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.access.api.permissions import NexoraPermission
from apps.academic.models import AcademicProgram, AcademicTerm, AcademicTranscript
from apps.academic.transcript_services import AcademicTranscriptService
from apps.control_plane.audit import record_control_plane_audit
from apps.core.api.response import success_response
from apps.organizations.models import Membership, Organization


class TranscriptIssueInputSerializer(serializers.Serializer):
    membership_id = serializers.UUIDField()
    program_id = serializers.UUIDField()
    through_term_id = serializers.UUIDField(required=False, allow_null=True)


class TranscriptRevokeInputSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=2000, trim_whitespace=True)


class AcademicTranscriptOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTranscript
        fields = (
            "id", "transcript_number", "version", "status",
            "snapshot", "snapshot_checksum", "issued_at", "issued_by",
            "revoked_at", "revoked_by", "revocation_reason",
        )


def _organization(organization_id):
    organization = Organization.objects.active().filter(
        id=organization_id, status=Organization.Status.ACTIVE,
    ).first()
    if organization is None:
        raise NotFound("Organization not found.")
    return organization


def _can_read_transcript(*, request, transcript):
    return (
        request.user.is_staff
        or transcript.membership.user_id == request.user.id
        or transcript.issued_by_id == request.user.id
        or transcript.revoked_by_id == request.user.id
    )


class AcademicTranscriptListIssueView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]

    def get_permissions(self):
        self.required_permission = "academic.manage" if self.request.method == "POST" else "academic.read"
        return super().get_permissions()

    def get(self, request, organization_id):
        organization = _organization(organization_id)
        queryset = AcademicTranscript.objects.active().filter(organization=organization)
        membership_id = request.query_params.get("membership_id")
        program_id = request.query_params.get("program_id")
        if membership_id:
            queryset = queryset.filter(membership_id=membership_id)
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if not request.user.is_staff:
            queryset = queryset.filter(
                models_q_for_transcript_reader(request.user.id),
            )
        queryset = queryset.select_related("membership", "program", "issued_by")
        return success_response(AcademicTranscriptOutputSerializer(queryset, many=True).data)

    def post(self, request, organization_id):
        organization = _organization(organization_id)
        serializer = TranscriptIssueInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = Membership.objects.active().filter(
            id=serializer.validated_data["membership_id"],
            organization=organization,
            status=Membership.Status.ACTIVE,
        ).first()
        if membership is None:
            raise NotFound("Active student membership not found.")
        program = AcademicProgram.objects.active().filter(
            id=serializer.validated_data["program_id"],
            organization=organization,
            is_active=True,
        ).first()
        if program is None:
            raise NotFound("Active academic program not found.")
        through_term_id = serializer.validated_data.get("through_term_id")
        through_term = None
        if through_term_id:
            through_term = AcademicTerm.objects.active().filter(
                id=through_term_id, organization=organization,
            ).first()
            if through_term is None:
                raise NotFound("Academic term not found.")
        try:
            transcript = AcademicTranscriptService.issue(
                organization=organization,
                membership=membership,
                program=program,
                through_term=through_term,
                issued_by=request.user,
            )
        except DjangoValidationError as exc:
            raise ValidationError(
                exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}
            ) from exc
        record_control_plane_audit(
            event_type="ACADEMIC_RESOURCE_CHANGED",
            actor=request.user,
            metadata={
                "organization_id": str(organization.pk),
                "action": "issued",
                "resource": "academic_transcript",
                "resource_id": str(transcript.pk),
                "transcript_number": transcript.transcript_number,
                "membership_id": str(membership.pk),
                "program_id": str(program.pk),
                "version": transcript.version,
                "snapshot_checksum": transcript.snapshot_checksum,
            },
        )
        return success_response(AcademicTranscriptOutputSerializer(transcript).data, status=201)


class AcademicTranscriptDetailView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.read"

    def get(self, request, organization_id, transcript_id):
        organization = _organization(organization_id)
        transcript = AcademicTranscript.objects.active().filter(
            id=transcript_id, organization=organization,
        ).select_related("membership", "program", "issued_by", "revoked_by").first()
        if transcript is None or not _can_read_transcript(request=request, transcript=transcript):
            raise NotFound("Transcript not found.")
        if not AcademicTranscriptService.verify(transcript):
            raise ValidationError({"integrity": "Transcript checksum verification failed."})
        return success_response(AcademicTranscriptOutputSerializer(transcript).data)


class AcademicTranscriptRevokeView(APIView):
    permission_classes = [IsAuthenticated, NexoraPermission]
    required_permission = "academic.manage"

    def post(self, request, organization_id, transcript_id):
        organization = _organization(organization_id)
        transcript = AcademicTranscript.objects.select_related(
            "membership", "program",
        ).filter(
            id=transcript_id, organization=organization, deleted_at__isnull=True,
        ).first()
        if transcript is None:
            raise NotFound("Transcript not found.")
        serializer = TranscriptRevokeInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            revoked = AcademicTranscriptService.revoke(
                transcript=transcript,
                revoked_by=request.user,
                reason=serializer.validated_data["reason"],
            )
        except DjangoValidationError as exc:
            raise ValidationError(
                exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}
            ) from exc
        record_control_plane_audit(
            event_type="ACADEMIC_RESOURCE_CHANGED",
            actor=request.user,
            metadata={
                "organization_id": str(organization.pk),
                "action": "revoked",
                "resource": "academic_transcript",
                "resource_id": str(revoked.pk),
                "transcript_number": revoked.transcript_number,
                "reason": revoked.revocation_reason,
            },
        )
        return success_response(AcademicTranscriptOutputSerializer(revoked).data)


def models_q_for_transcript_reader(user_id):
    from django.db.models import Q

    return Q(membership__user_id=user_id) | Q(issued_by_id=user_id) | Q(revoked_by_id=user_id)
