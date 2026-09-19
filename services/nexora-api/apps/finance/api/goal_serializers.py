from rest_framework import serializers

from apps.finance.models import FinanceGoal, FinanceGoalContribution


class FinanceGoalSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    organization_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = FinanceGoal
        fields = ("id", "organization_id", "name", "target_amount_minor", "currency",
                  "start_date", "target_date", "status", "metadata", "created_at", "updated_at")
        read_only_fields = ("id", "organization_id", "status", "created_at", "updated_at")

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        target_date = attrs.get("target_date", getattr(self.instance, "target_date", None))
        if start_date and target_date and target_date < start_date:
            raise serializers.ValidationError({"target_date": "target_date must be on or after start date."})
        return attrs


class FinanceGoalUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceGoal
        fields = ("name", "target_amount_minor", "currency", "start_date", "target_date", "metadata", "status")

    def validate(self, attrs):
        instance = self.instance
        if instance is not None and instance.status == FinanceGoal.Status.ARCHIVED:
            raise serializers.ValidationError("Archived goals cannot be edited.")
        start_date = attrs.get("start_date", instance.start_date)
        target_date = attrs.get("target_date", instance.target_date)
        if target_date < start_date:
            raise serializers.ValidationError({"target_date": "target_date must be on or after start date."})
        if attrs.get("status") == FinanceGoal.Status.ARCHIVED:
            raise serializers.ValidationError({"status": "Use DELETE to archive a goal."})
        return attrs


class FinanceGoalProgressSerializer(serializers.Serializer):
    goal_id = serializers.UUIDField()
    name = serializers.CharField()
    target_amount_minor = serializers.IntegerField()
    current_amount_minor = serializers.IntegerField()
    remaining_amount_minor = serializers.IntegerField()
    progress_percentage = serializers.FloatField(allow_null=True)
    start_date = serializers.DateField()
    target_date = serializers.DateField()
    status = serializers.CharField()
    configured_status = serializers.CharField()
    currency = serializers.CharField()
    contribution_count = serializers.IntegerField()
    days_remaining = serializers.IntegerField()


class FinanceGoalSummarySerializer(serializers.Serializer):
    currency = serializers.CharField()
    goal_count = serializers.IntegerField()
    active_count = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    overdue_count = serializers.IntegerField()
    total_target_amount_minor = serializers.IntegerField()
    total_current_amount_minor = serializers.IntegerField()
    goals = FinanceGoalProgressSerializer(many=True)


class FinanceGoalContributionSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    organization_id = serializers.UUIDField(read_only=True)
    goal_id = serializers.UUIDField(source="goal_id", read_only=True)

    class Meta:
        model = FinanceGoalContribution
        fields = ("id", "organization_id", "goal_id", "amount_minor", "currency",
                  "contributed_at", "status", "note", "reference", "idempotency_key",
                  "metadata", "created_at", "updated_at")
        read_only_fields = ("id", "organization_id", "goal_id", "status", "created_at", "updated_at")


class FinanceGoalContributionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceGoalContribution
        fields = ("amount_minor", "currency", "contributed_at", "note", "reference", "idempotency_key", "metadata")

    def validate(self, attrs):
        if attrs.get("currency", "IDR") != "IDR":
            raise serializers.ValidationError({"currency": "Only IDR is supported by the initial finance domain contract."})
        return attrs


class FinanceGoalListQuerySerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=FinanceGoal.Status.choices, required=False)


class FinanceGoalSummaryQuerySerializer(serializers.Serializer):
    today = serializers.DateField(required=False)
