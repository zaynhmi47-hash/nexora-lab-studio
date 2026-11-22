from django.contrib import admin

from .models import CareerExperience, CareerProject


@admin.register(CareerExperience)
class CareerExperienceAdmin(admin.ModelAdmin):
    list_display = ("role_title", "organization_name", "employment_type", "user", "start_date", "is_current")
    list_filter = ("employment_type", "is_current")
    search_fields = ("role_title", "organization_name", "user__email")


@admin.register(CareerProject)
class CareerProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "status", "visibility", "updated_at")
    list_filter = ("status", "visibility")
    search_fields = ("title", "summary", "user__email")
