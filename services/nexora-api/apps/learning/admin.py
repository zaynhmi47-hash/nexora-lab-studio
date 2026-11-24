from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import (
    LearningCompetency,
    LearningOutcome,
    LearningOutcomeLessonMapping,
    LearningOutcomeRubric,
    LearningMasteryAssessmentEvent,
)
from .evidence_review import validate_rubric_definition


@admin.register(LearningCompetency)
class LearningCompetencyAdmin(admin.ModelAdmin):
    list_display = ("key", "title", "domain", "parent", "is_published")
    list_filter = ("domain", "is_published")
    search_fields = ("key", "title", "description")


@admin.register(LearningOutcome)
class LearningOutcomeAdmin(admin.ModelAdmin):
    list_display = ("key", "title", "competency", "proficiency_level", "is_published")
    list_filter = ("is_published", "competency__domain", "proficiency_level")
    search_fields = ("key", "title", "description", "competency__title")


@admin.register(LearningOutcomeLessonMapping)
class LearningOutcomeLessonMappingAdmin(admin.ModelAdmin):
    list_display = ("lesson", "outcome", "contribution_type", "is_active")
    list_filter = ("contribution_type", "is_active", "lesson__course")
    search_fields = ("lesson__key", "lesson__title", "outcome__key", "outcome__title")



class LearningOutcomeRubricForm(forms.ModelForm):
    class Meta:
        model = LearningOutcomeRubric
        fields = "__all__"

    def clean_criteria(self):
        criteria = self.cleaned_data.get("criteria")
        try:
            return validate_rubric_definition(criteria)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc


@admin.register(LearningOutcomeRubric)
class LearningOutcomeRubricAdmin(admin.ModelAdmin):
    form = LearningOutcomeRubricForm
    list_display = ("outcome", "version", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("outcome__key", "outcome__title", "outcome__competency__title")
    readonly_fields = ("created_at", "updated_at", "deleted_at")


@admin.register(LearningMasteryAssessmentEvent)
class LearningMasteryAssessmentEventAdmin(admin.ModelAdmin):
    list_display = ("user", "outcome", "level", "status", "assessed_by", "assessed_at", "rubric_version")
    list_filter = ("status", "rubric_version")
    search_fields = ("user__email", "outcome__key", "outcome__title", "assessed_by__email")
    readonly_fields = (
        "id", "created_at", "updated_at", "deleted_at", "user", "outcome",
        "level", "status", "assessment_method", "rationale", "rubric_version",
        "criterion_scores", "assessed_by", "assessed_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
