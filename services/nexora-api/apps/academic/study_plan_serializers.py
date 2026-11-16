from rest_framework import serializers

from apps.academic.models import AcademicStudyPlan, AcademicStudyPlanItem


class AcademicStudyPlanItemSerializer(serializers.ModelSerializer):
    offering_code = serializers.CharField(source="offering.code", read_only=True)
    course_code = serializers.CharField(source="offering.course.code", read_only=True)
    course_name = serializers.CharField(source="offering.course.name", read_only=True)

    class Meta:
        model = AcademicStudyPlanItem
        fields = ("id", "offering", "offering_code", "course_code", "course_name", "credit_units_snapshot", "created_at")
        read_only_fields = fields


class AcademicStudyPlanSerializer(serializers.ModelSerializer):
    term_code = serializers.CharField(source="term.code", read_only=True)
    items = AcademicStudyPlanItemSerializer(many=True, read_only=True)
    total_credit_units = serializers.SerializerMethodField()

    class Meta:
        model = AcademicStudyPlan
        fields = (
            "id", "term", "term_code", "status", "max_credit_units",
            "total_credit_units", "submitted_at", "decided_at", "advisor_note",
            "items", "created_at", "updated_at",
        )
        read_only_fields = fields

    def get_total_credit_units(self, obj):
        return sum(obj.items.filter(deleted_at__isnull=True).values_list("credit_units_snapshot", flat=True))


class AcademicStudyPlanCreateSerializer(serializers.Serializer):
    term = serializers.UUIDField()
