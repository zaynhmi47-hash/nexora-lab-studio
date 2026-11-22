from django.contrib import admin

from apps.academic.models import AcademicCourseOutcomeMapping


@admin.register(AcademicCourseOutcomeMapping)
class AcademicCourseOutcomeMappingAdmin(admin.ModelAdmin):
    list_display = ("course", "outcome", "contribution_type", "is_active")
    list_filter = ("contribution_type", "is_active", "course__organization")
    search_fields = ("course__code", "course__name", "outcome__key", "outcome__title")
