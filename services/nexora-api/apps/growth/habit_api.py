from django.core.exceptions import ValidationError
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import GrowthGoal, GrowthHabit, GrowthHabitCheckIn
from .services import GrowthHabitService


class GrowthHabitSerializer(serializers.ModelSerializer):
    goal = serializers.PrimaryKeyRelatedField(
        queryset=GrowthGoal.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = GrowthHabit
        fields = (
            "id", "goal", "title", "description", "frequency", "weekly_target",
            "start_date", "end_date", "status", "created_at", "updated_at",
        )
        read_only_fields = ("id", "status", "created_at", "updated_at")

    def validate(self, attrs):
        frequency = attrs.get("frequency", getattr(self.instance, "frequency", GrowthHabit.Frequency.DAILY))
        target = attrs.get("weekly_target", getattr(self.instance, "weekly_target", 7))
        if frequency == GrowthHabit.Frequency.DAILY and target != 7:
            raise serializers.ValidationError({"weekly_target": "Daily habits use a seven-day target."})
        return attrs


class GrowthHabitUpdateSerializer(GrowthHabitSerializer):
    status = serializers.ChoiceField(choices=GrowthHabit.Status.choices, required=False)

    class Meta(GrowthHabitSerializer.Meta):
        read_only_fields = ("id", "created_at", "updated_at")


class GrowthHabitCheckInSerializer(serializers.Serializer):
    entry_date = serializers.DateField()
    status = serializers.ChoiceField(choices=GrowthHabitCheckIn.Status.choices)
    note = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")


class GrowthHabitListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        habits = GrowthHabit.objects.filter(
            user=request.user,
            deleted_at__isnull=True,
        ).select_related("goal")
        data = []
        for habit in habits:
            item = GrowthHabitSerializer(habit).data
            item["summary"] = GrowthHabitService.habit_summary(user=request.user, habit=habit)
            data.append(item)
        return Response(data)

    def post(self, request):
        serializer = GrowthHabitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            habit = GrowthHabitService.create_habit(user=request.user, **serializer.validated_data)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        item = GrowthHabitSerializer(habit).data
        item["summary"] = GrowthHabitService.habit_summary(user=request.user, habit=habit)
        return Response(item, status=status.HTTP_201_CREATED)


class GrowthHabitDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, habit_id):
        serializer = GrowthHabitUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            habit = GrowthHabitService.update_habit(
                user=request.user,
                habit_id=habit_id,
                **serializer.validated_data,
            )
        except GrowthHabit.DoesNotExist:
            return Response({"detail": "Habit not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        item = GrowthHabitSerializer(habit).data
        item["summary"] = GrowthHabitService.habit_summary(user=request.user, habit=habit)
        return Response(item)


class GrowthHabitCheckInView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, habit_id):
        serializer = GrowthHabitCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            check_in = GrowthHabitService.check_in(
                user=request.user,
                habit_id=habit_id,
                **serializer.validated_data,
            )
        except GrowthHabit.DoesNotExist:
            return Response({"detail": "Active habit not found for this date."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "id": str(check_in.id),
                "habitId": str(check_in.habit_id),
                "date": check_in.entry_date.isoformat(),
                "status": check_in.status,
                "note": check_in.note,
            },
            status=status.HTTP_201_CREATED,
        )
