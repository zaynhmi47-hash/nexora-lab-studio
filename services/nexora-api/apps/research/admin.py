from django.contrib import admin

from .models import (
    ResearchContribution,
    ResearchEvidenceVerification,
    ResearchEvidenceVerificationEvent,
    ResearchOutput,
    ResearchOutputOutcomeMapping,
    ResearchProject,
)


class ResearchContributionInline(admin.TabularInline):
    model = ResearchContribution
    extra = 0


class ResearchOutputInline(admin.TabularInline):
    model = ResearchOutput
    extra = 0


@admin.register(ResearchProject)
class ResearchProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "field_of_study", "status", "visibility", "updated_at")
    list_filter = ("status", "visibility", "field_of_study")
    search_fields = ("title", "research_question", "owner__email")
    inlines = (ResearchContributionInline, ResearchOutputInline)


@admin.register(ResearchOutput)
class ResearchOutputAdmin(admin.ModelAdmin):
    list_display = ("title", "output_type", "status", "provenance_status", "created_at")
    list_filter = ("output_type", "status", "provenance_status")
    search_fields = ("title", "doi", "project__title")


@admin.register(ResearchContribution)
class ResearchContributionAdmin(admin.ModelAdmin):
    list_display = ("contributor_name", "project", "contribution_type", "attribution_status")
    list_filter = ("contribution_type", "attribution_status")
    search_fields = ("contributor_name", "project__title")


class ResearchEvidenceVerificationEventInline(admin.TabularInline):
    model = ResearchEvidenceVerificationEvent
    extra = 0
    can_delete = False
    readonly_fields = ("actor", "from_status", "to_status", "reason", "created_at")


@admin.register(ResearchEvidenceVerification)
class ResearchEvidenceVerificationAdmin(admin.ModelAdmin):
    list_display = ("output", "organization", "submitted_by", "reviewer", "status", "created_at")
    list_filter = ("status", "organization")
    search_fields = ("output__title", "submitted_by__email", "reviewer__email")
    readonly_fields = ("output", "organization", "submitted_by", "reviewer", "status", "consented_at", "reviewed_at", "decision_reason")
    inlines = (ResearchEvidenceVerificationEventInline,)


@admin.register(ResearchEvidenceVerificationEvent)
class ResearchEvidenceVerificationEventAdmin(admin.ModelAdmin):
    list_display = ("verification", "actor", "from_status", "to_status", "created_at")
    readonly_fields = ("verification", "actor", "from_status", "to_status", "reason", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ResearchOutputOutcomeMapping)
class ResearchOutputOutcomeMappingAdmin(admin.ModelAdmin):
    list_display = ("output", "outcome", "created_by", "created_at")
    search_fields = ("output__title", "outcome__key", "outcome__title", "created_by__email")
    readonly_fields = ("output", "outcome", "created_by", "created_at", "updated_at", "deleted_at")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
