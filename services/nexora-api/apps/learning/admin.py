from django.contrib import admin

from .models import (
    LearningCompetency,
    LearningOutcome,
    LearningOutcomeLessonMapping,
)


@admin.register(LearningCompetency)
class LearningCompetencyAdmin(admin.ModelAdmin):
    list_display = ("key", "title", "domain", "parent", "is_published")
    list_filter = ("domain", "is_published")
    search_fields = ("key", "title", "description")
    autocomplete_fields = ("parent",)


@admin.register(LearningOutcome)
class LearningOutcomeAdmin(admin.ModelAdmin):
    list_display = ("key", "title", "competency", "proficiency_level", "is_published")
    list_filter = ("is_published", "competency__domain", "proficiency_level")
    search_fields = ("key", "title", "description", "competency__title")
    autocomplete_fields = ("competency",)


@admin.register(LearningOutcomeLessonMapping)
class LearningOutcomeLessonMappingAdmin(admin.ModelAdmin):
    list_display = ("lesson", "outcome", "contribution_type", "is_active")
    list_filter = ("contribution_type", "is_active", "lesson__course")
    search_fields = ("lesson__key", "lesson__title", "outcome__key", "outcome__title")
    autocomplete_fields = ("lesson", "outcome")
