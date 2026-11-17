from rest_framework import serializers

from apps.academic.models import (
    AcademicAssessmentComponent,
    AcademicFinalGrade,
    AcademicGradeEntry,
    AcademicGradingPolicy,
)


class AcademicGradingPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicGradingPolicy
        fields = ("id", "offering", "version", "max_score", "passing_score", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "offering", "version", "is_active", "created_at", "updated_at")


class AcademicAssessmentComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicAssessmentComponent
        fields = ("id", "offering", "name", "description", "weight_percent", "max_score", "is_required", "is_active", "position", "created_at", "updated_at")
        read_only_fields = ("id", "offering", "created_at", "updated_at")


class AcademicGradeEntrySerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source="component.name", read_only=True)
    student_id = serializers.UUIDField(source="membership.user_id", read_only=True)

    class Meta:
        model = AcademicGradeEntry
        fields = ("id", "offering", "component", "component_name", "membership", "student_id", "score", "feedback", "status", "graded_by", "published_at", "created_at", "updated_at")
        read_only_fields = ("id", "offering", "component_name", "student_id", "status", "graded_by", "published_at", "created_at", "updated_at")


class AcademicFinalGradeSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="offering.course.code", read_only=True)
    course_name = serializers.CharField(source="offering.course.name", read_only=True)

    class Meta:
        model = AcademicFinalGrade
        fields = ("id", "offering", "course_code", "course_name", "final_score", "status", "outcome", "published_at", "published_by")
        read_only_fields = fields
