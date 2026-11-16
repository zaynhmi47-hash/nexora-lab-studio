from rest_framework import serializers

from apps.academic.models import AcademicClassroom, AcademicProgram, AcademicTerm


class AcademicProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicProgram
        fields = ("id", "code", "name", "description", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = ("id", "code", "name", "starts_on", "ends_on", "status", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class AcademicClassroomSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name", read_only=True)
    term_code = serializers.CharField(source="term.code", read_only=True)

    class Meta:
        model = AcademicClassroom
        fields = (
            "id", "program", "program_name", "term", "term_code", "code", "name",
            "capacity", "status", "created_at", "updated_at",
        )
        read_only_fields = ("id", "program_name", "term_code", "created_at", "updated_at")
