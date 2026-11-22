from django.contrib import admin

from .models import ResearchContribution, ResearchOutput, ResearchProject


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
