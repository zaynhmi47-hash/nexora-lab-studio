from django.core.exceptions import ValidationError
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import ResearchContribution, ResearchOutput, ResearchProject
from .services import ResearchService


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
