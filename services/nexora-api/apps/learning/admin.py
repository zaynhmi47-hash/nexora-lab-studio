from django.contrib import admin

from .models import (
    LearningAchievement,
    LearningContentBlock,
    LearningCourse,
    LearningLesson,
    LearningLessonCompletion,
    LearningProgress,
    LearningQuizAttempt,
    LearningQuizQuestion,
    LearningUserAchievement,
)


class LearningContentBlockInline(admin.StackedInline):
    model = LearningContentBlock
    extra = 0
    ordering = ("sort_order",)
    fields = ("sort_order", "kind", "title", "body", "file", "external_url", "is_published")
    show_change_link = True


@admin.register(LearningCourse)
class LearningCourseAdmin(admin.ModelAdmin):
    list_display = ("title", "key", "level", "sort_order", "is_published")
    list_filter = ("is_published", "level")
    search_fields = ("title", "key", "description")
    ordering = ("sort_order", "title")


@admin.register(LearningLesson)
class LearningLessonAdmin(admin.ModelAdmin):
    list_display = ("title", "key", "course", "kind", "sort_order", "is_published")
    list_filter = ("course", "kind", "is_published")
    search_fields = ("title", "key", "description", "course__title")
    ordering = ("course", "sort_order")
    list_select_related = ("course",)
    inlines = (LearningContentBlockInline,)


@admin.register(LearningContentBlock)
class LearningContentBlockAdmin(admin.ModelAdmin):
    list_display = ("title", "lesson", "kind", "sort_order", "is_published", "updated_at")
    list_filter = ("kind", "is_published", "lesson__course")
    search_fields = ("title", "body", "lesson__title", "lesson__course__title")
    ordering = ("lesson__course__sort_order", "lesson__sort_order", "sort_order")
    list_select_related = ("lesson", "lesson__course")


@admin.register(LearningQuizQuestion)
class LearningQuizQuestionAdmin(admin.ModelAdmin):
    list_display = ("key", "lesson", "sort_order")
    list_filter = ("lesson__course", "lesson")
    search_fields = ("key", "prompt", "lesson__title")
    ordering = ("lesson", "sort_order")


admin.site.register(LearningProgress)
admin.site.register(LearningLessonCompletion)
admin.site.register(LearningQuizAttempt)
admin.site.register(LearningAchievement)
admin.site.register(LearningUserAchievement)
