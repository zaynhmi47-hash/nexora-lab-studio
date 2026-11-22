from django.core.exceptions import ValidationError
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import CareerExperience, CareerProject
from .services import CareerService


class CareerExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerExperience
        fields = ("id", "role_title", "organization_name", "employment_type", "location", "description", "start_date", "end_date", "is_current", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class CareerProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerProject
        fields = ("id", "title", "summary", "role", "skills", "artifact_url", "started_at", "completed_at", "status", "visibility", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_skills(self, value):
        if not isinstance(value, list) or any(not isinstance(item, str) or not item.strip() for item in value):
            raise serializers.ValidationError("skills must be a list of non-empty strings.")
        return value


class CareerExperienceListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CareerExperienceSerializer(CareerService.list_experiences(user=request.user), many=True).data)

    def post(self, request):
        serializer = CareerExperienceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = CareerService.create_experience(user=request.user, **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(CareerExperienceSerializer(item).data, status=status.HTTP_201_CREATED)


class CareerExperienceDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, experience_id):
        serializer = CareerExperienceSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            item = CareerService.update_experience(user=request.user, experience_id=experience_id, **serializer.validated_data)
        except CareerExperience.DoesNotExist:
            return Response({"detail": "Experience not found."}, status=404)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(CareerExperienceSerializer(item).data)

    def delete(self, request, experience_id):
        try:
            CareerService.delete_experience(user=request.user, experience_id=experience_id)
        except CareerExperience.DoesNotExist:
            return Response({"detail": "Experience not found."}, status=404)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CareerProjectListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CareerProjectSerializer(CareerService.list_projects(user=request.user), many=True).data)

    def post(self, request):
        serializer = CareerProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            item = CareerService.create_project(user=request.user, **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(CareerProjectSerializer(item).data, status=status.HTTP_201_CREATED)


class CareerProjectDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, project_id):
        serializer = CareerProjectSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            item = CareerService.update_project(user=request.user, project_id=project_id, **serializer.validated_data)
        except CareerProject.DoesNotExist:
            return Response({"detail": "Project not found."}, status=404)
        except ValidationError as exc:
            return Response({"detail": exc.message_dict if hasattr(exc, "message_dict") else exc.messages}, status=400)
        return Response(CareerProjectSerializer(item).data)

    def delete(self, request, project_id):
        try:
            CareerService.delete_project(user=request.user, project_id=project_id)
        except CareerProject.DoesNotExist:
            return Response({"detail": "Project not found."}, status=404)
        return Response(status=status.HTTP_204_NO_CONTENT)
