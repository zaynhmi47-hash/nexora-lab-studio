from django.core.exceptions import ValidationError
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import GrowthGoal, GrowthJournalEntry
from .services import GrowthService


class GrowthGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrowthGoal
        fields = (
            "id", "title", "description", "category", "success_criteria",
            "start_date", "target_date", "status", "completed_at", "created_at", "updated_at",
        )
        read_only_fields = ("id", "status", "completed_at", "created_at", "updated_at")

    def validate_success_criteria(self, value):
        if not isinstance(value, list) or any(not isinstance(item, str) or not item.strip() for item in value):
            raise serializers.ValidationError("success_criteria must be a list of non-empty strings.")
        return value


class GrowthJournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = GrowthJournalEntry
        fields = (
            "id", "entry_date", "title", "prompt", "body", "mood", "gratitude",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError("Journal entry cannot be empty.")
        return value

    def validate_gratitude(self, value):
        if not isinstance(value, list) or any(not isinstance(item, str) or not item.strip() for item in value):
            raise serializers.ValidationError("gratitude must be a list of non-empty strings.")
        return value


class GrowthGoalListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        goals = GrowthGoal.objects.filter(user=request.user, deleted_at__isnull=True)
        return Response(GrowthGoalSerializer(goals, many=True).data)

    def post(self, request):
        serializer = GrowthGoalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            goal = GrowthService.create_goal(user=request.user, **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GrowthGoalSerializer(goal).data, status=status.HTTP_201_CREATED)


class GrowthGoalDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, goal_id):
        serializer = GrowthGoalSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            goal = GrowthService.update_goal(user=request.user, goal_id=goal_id, **serializer.validated_data)
        except GrowthGoal.DoesNotExist:
            return Response({"detail": "Goal not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GrowthGoalSerializer(goal).data)


class GrowthJournalListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = GrowthJournalEntry.objects.filter(user=request.user, deleted_at__isnull=True)
        return Response(GrowthJournalEntrySerializer(entries, many=True).data)

    def post(self, request):
        serializer = GrowthJournalEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            entry = GrowthService.create_journal_entry(user=request.user, **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GrowthJournalEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class GrowthJournalDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, entry_id):
        serializer = GrowthJournalEntrySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            entry = GrowthService.update_journal_entry(user=request.user, entry_id=entry_id, **serializer.validated_data)
        except GrowthJournalEntry.DoesNotExist:
            return Response({"detail": "Journal entry not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(GrowthJournalEntrySerializer(entry).data)

    def delete(self, request, entry_id):
        try:
            GrowthService.delete_journal_entry(user=request.user, entry_id=entry_id)
        except GrowthJournalEntry.DoesNotExist:
            return Response({"detail": "Journal entry not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
