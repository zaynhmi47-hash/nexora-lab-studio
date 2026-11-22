from django.core.exceptions import ValidationError
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.organizations.models import Organization

from .models import (
    ResearchContribution,
    ResearchEvidenceVerification,
    ResearchEvidenceVerificationEvent,
    ResearchOutput,
    ResearchProject,
)
from .services import ResearchEvidenceVerificationService, ResearchService


class ResearchProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchProject
        fields = ("id", "title", "abstract", "research_question", "field_of_study", "methodology", "status", "visibility", "started_at", "completed_at", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ResearchOutputSerializer(serializers.ModelSerializer):
    provenance_status = serializers.CharField(read_only=True)

    class Meta:
        model = ResearchOutput
        fields = ("id", "title", "output_type", "status", "abstract", "doi", "resource_url", "published_on", "provenance_status", "created_at")
        read_only_fields = ("id", "provenance_status", "created_at")


class ResearchContributionSerializer(serializers.ModelSerializer):
    attribution_status = serializers.CharField(read_only=True)

    class Meta:
        model = ResearchContribution
        fields = ("id", "contributor_name", "affiliation", "role", "contribution_type", "statement", "is_corresponding_author", "attribution_status", "created_at")
        read_only_fields = ("id", "attribution_status", "created_at")


class ResearchVerificationSubmitSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    consent = serializers.BooleanField()


class ResearchVerificationTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ResearchEvidenceVerification.Status.choices)
    reason = serializers.CharField(required=False, allow_blank=True, max_length=4000)


class ResearchVerificationEventSerializer(serializers.ModelSerializer):
    actor_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = ResearchEvidenceVerificationEvent
        fields = ("id", "actor_id", "from_status", "to_status", "reason", "created_at")
        read_only_fields = fields


class ResearchVerificationSerializer(serializers.ModelSerializer):
    events = ResearchVerificationEventSerializer(many=True, read_only=True)

    class Meta:
        model = ResearchEvidenceVerification
        fields = ("id", "output_id", "organization_id", "submitted_by_id", "reviewer_id", "status", "consented_at", "reviewed_at", "decision_reason", "events", "created_at")
        read_only_fields = fields


class ResearchVerificationQueueSerializer(serializers.ModelSerializer):
    events = ResearchVerificationEventSerializer(many=True, read_only=True)
    output_id = serializers.UUIDField(read_only=True)
    project_id = serializers.UUIDField(source="output.project_id", read_only=True)
    output_title = serializers.CharField(source="output.title", read_only=True)
    output_type = serializers.CharField(source="output.output_type", read_only=True)
    output_abstract = serializers.CharField(source="output.abstract", read_only=True)
    doi = serializers.CharField(source="output.doi", read_only=True)
    resource_url = serializers.CharField(source="output.resource_url", read_only=True)
    submitter_name = serializers.CharField(source="submitted_by.display_name", read_only=True)

    class Meta:
        model = ResearchEvidenceVerification
        fields = ("id", "project_id", "output_id", "organization_id", "status", "output_title", "output_type", "output_abstract", "doi", "resource_url", "submitter_name", "submitted_by_id", "reviewer_id", "consented_at", "reviewed_at", "events", "created_at")
        read_only_fields = fields


class ResearchProjectListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ResearchProjectSerializer(ResearchService.list_projects(user=request.user), many=True).data)

    def post(self, request):
        serializer = ResearchProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            project = ResearchService.create_project(user=request.user, **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(ResearchProjectSerializer(project).data, status=status.HTTP_201_CREATED)


class ResearchProjectDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        try:
            project = ResearchService.get_project(user=request.user, project_id=project_id)
        except ResearchProject.DoesNotExist:
            return Response({"detail": "Research project not found."}, status=404)
        return Response(ResearchProjectSerializer(project).data)

    def patch(self, request, project_id):
        serializer = ResearchProjectSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            project = ResearchService.update_project(user=request.user, project_id=project_id, **serializer.validated_data)
        except ResearchProject.DoesNotExist:
            return Response({"detail": "Research project not found."}, status=404)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(ResearchProjectSerializer(project).data)

    def delete(self, request, project_id):
        try:
            ResearchService.delete_project(user=request.user, project_id=project_id)
        except ResearchProject.DoesNotExist:
            return Response({"detail": "Research project not found."}, status=404)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchOutputListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        try:
            outputs = ResearchService.list_outputs(user=request.user, project_id=project_id)
        except ResearchProject.DoesNotExist:
            return Response({"detail": "Research project not found."}, status=404)
        return Response(ResearchOutputSerializer(outputs, many=True).data)

    def post(self, request, project_id):
        serializer = ResearchOutputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            output = ResearchService.create_output(user=request.user, project_id=project_id, **serializer.validated_data)
        except ResearchProject.DoesNotExist:
            return Response({"detail": "Research project not found."}, status=404)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(ResearchOutputSerializer(output).data, status=status.HTTP_201_CREATED)


class ResearchContributionListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        try:
            items = ResearchService.list_contributions(user=request.user, project_id=project_id)
        except ResearchProject.DoesNotExist:
            return Response({"detail": "Research project not found."}, status=404)
        return Response(ResearchContributionSerializer(items, many=True).data)

    def post(self, request, project_id):
        serializer = ResearchContributionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = ResearchService.create_contribution(user=request.user, project_id=project_id, **serializer.validated_data)
        except ResearchProject.DoesNotExist:
            return Response({"detail": "Research project not found."}, status=404)
        return Response(ResearchContributionSerializer(item).data, status=status.HTTP_201_CREATED)


class ResearchOutputDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, project_id, output_id):
        serializer = ResearchOutputSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            output = ResearchService.update_output(
                user=request.user, project_id=project_id, output_id=output_id,
                **serializer.validated_data,
            )
        except (ResearchProject.DoesNotExist, ResearchOutput.DoesNotExist):
            return Response({"detail": "Research output not found."}, status=404)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(ResearchOutputSerializer(output).data)

    def delete(self, request, project_id, output_id):
        try:
            ResearchService.delete_output(user=request.user, project_id=project_id, output_id=output_id)
        except (ResearchProject.DoesNotExist, ResearchOutput.DoesNotExist):
            return Response({"detail": "Research output not found."}, status=404)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchContributionDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, project_id, contribution_id):
        serializer = ResearchContributionSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            item = ResearchService.update_contribution(
                user=request.user, project_id=project_id, contribution_id=contribution_id,
                **serializer.validated_data,
            )
        except (ResearchProject.DoesNotExist, ResearchContribution.DoesNotExist):
            return Response({"detail": "Research contribution not found."}, status=404)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(ResearchContributionSerializer(item).data)

    def delete(self, request, project_id, contribution_id):
        try:
            ResearchService.delete_contribution(
                user=request.user, project_id=project_id, contribution_id=contribution_id,
            )
        except (ResearchProject.DoesNotExist, ResearchContribution.DoesNotExist):
            return Response({"detail": "Research contribution not found."}, status=404)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchEvidenceVerificationView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, output_id):
        try:
            output = ResearchService.get_output(user=request.user, project_id=project_id, output_id=output_id)
            cases = ResearchEvidenceVerificationService.list_for_owner(user=request.user, output=output)
        except (ResearchProject.DoesNotExist, ResearchOutput.DoesNotExist):
            return Response({"detail": "Research output not found."}, status=404)
        return Response(ResearchVerificationSerializer(cases, many=True).data)

    def post(self, request, project_id, output_id):
        serializer = ResearchVerificationSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            output = ResearchService.get_output(user=request.user, project_id=project_id, output_id=output_id)
            case = ResearchEvidenceVerificationService.submit(
                user=request.user,
                output=output,
                organization_id=serializer.validated_data["organization_id"],
                consent=serializer.validated_data["consent"],
            )
        except (ResearchProject.DoesNotExist, ResearchOutput.DoesNotExist):
            return Response({"detail": "Research output not found."}, status=404)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(ResearchVerificationSerializer(case).data, status=status.HTTP_201_CREATED)


class ResearchEvidenceVerificationTransitionView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id, output_id, verification_id):
        serializer = ResearchVerificationTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            case = ResearchEvidenceVerificationService.transition(
                actor=request.user,
                output_id=output_id,
                verification_id=verification_id,
                target_status=serializer.validated_data["status"],
                reason=serializer.validated_data.get("reason", ""),
            )
        except ResearchEvidenceVerification.DoesNotExist:
            return Response({"detail": "Verification case not found."}, status=404)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(ResearchVerificationSerializer(case).data)



class ResearchOrganizationVerificationQueueView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        organization = Organization.objects.active().filter(
            id=organization_id,
            status=Organization.Status.ACTIVE,
            deleted_at__isnull=True,
        ).first()
        if organization is None:
            return Response({"detail": "Organization not found."}, status=404)
        cases = ResearchEvidenceVerificationService.list_for_reviewer(
            actor=request.user,
            organization=organization,
        )
        return Response(ResearchVerificationQueueSerializer(cases, many=True).data)
