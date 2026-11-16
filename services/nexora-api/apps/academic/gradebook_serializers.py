from decimal import Decimal

from rest_framework import serializers

from apps.academic.models import AcademicAssessmentComponent, AcademicFinalGrade, AcademicGradeEntry, AcademicGradingPolicy


class AcademicGradingPolicyCreateSerializer(serializers.Serializer):
    passing_score = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal("0"), max_value=Decimal("100"), required=False, allow_null=True)


class AcademicAssessmentComponentCreateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32)
    name = serializers.CharField(max_length=120)
    weight_percent = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=Decimal("0.01"), max_value=Decimal("100"))
    max_score = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal("0.01"))
    sequence = serializers.IntegerField(min_value=1, max_value=32767, required=False, default=1)


class AcademicGradeEntryCreateSerializer(serializers.Serializer):
    component_id = serializers.UUIDField()
    membership_id = serializers.UUIDField()
    score = serializers.DecimalField(max_digits=8, decimal_places=2, min_value=Decimal("0"))
    feedback = serializers.CharField(required=False, allow_blank=True, max_length=10000, default="")


class AcademicGradingPolicySerializer(serializers.ModelSerializer):
    components = serializers.SerializerMethodField()

    class Meta:
        model = AcademicGradingPolicy
        fields = ("id", "offering", "status", "passing_score", "components", "created_at", "updated_at")
        read_only_fields = fields

    def get_components(self, obj):
        items = obj.components.filter(deleted_at__isnull=True).order_by("sequence", "code")
        return AcademicAssessmentComponentSerializer(items, many=True).data


class AcademicAssessmentComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicAssessmentComponent
        fields = ("id", "code", "name", "weight_percent", "max_score", "sequence", "is_active", "created_at")
        read_only_fields = fields


class AcademicGradeEntrySerializer(serializers.ModelSerializer):
    component_code = serializers.CharField(source="component.code", read_only=True)
    student_membership_id = serializers.UUIDField(source="membership_id", read_only=True)

    class Meta:
        model = AcademicGradeEntry
        fields = ("id", "offering", "component", "component_code", "student_membership_id", "score", "feedback", "revision", "status", "published_at")
        read_only_fields = fields


class AcademicFinalGradeSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="offering.course.code", read_only=True)

    class Meta:
        model = AcademicFinalGrade
        fields = ("id", "offering", "course_code", "weighted_score", "is_pass", "revision", "published_at")
        read_only_fields = fields
