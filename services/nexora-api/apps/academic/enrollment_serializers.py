from rest_framework import serializers

from apps.academic.models import AcademicEnrollment


class AcademicEnrollmentCreateSerializer(serializers.Serializer):
    membership_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=AcademicEnrollment.Role.choices, default=AcademicEnrollment.Role.STUDENT)


class AcademicEnrollmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=AcademicEnrollment.Status.choices)


class AcademicEnrollmentSerializer(serializers.ModelSerializer):
    membership_id = serializers.UUIDField(read_only=True)
    classroom_id = serializers.UUIDField(read_only=True)
    term_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = AcademicEnrollment
        fields = (
            "id", "classroom_id", "term_id", "membership_id", "role", "status",
            "created_at", "updated_at",
        )
        read_only_fields = fields
