from __future__ import annotations

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class LearningCourse(AuditableBaseModel):
    key = models.CharField(max_length=100, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    level = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "learning_courses"
        ordering = ("sort_order", "title")


class LearningLesson(AuditableBaseModel):
    class Kind(models.TextChoices):
        LESSON = "lesson", "Lesson"
        QUIZ = "quiz", "Quiz"
        PRACTICE = "practice", "Practice"

    key = models.CharField(max_length=100, unique=True, db_index=True)
    course = models.ForeignKey(LearningCourse, on_delete=models.PROTECT, related_name="lessons")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.LESSON)
    sort_order = models.PositiveIntegerField(default=0)
    xp_reward = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "learning_lessons"
        ordering = ("course", "sort_order")
        constraints = [
            models.UniqueConstraint(fields=("course", "sort_order"), name="learning_course_lesson_order_unique"),
        ]


class LearningProgress(AuditableBaseModel):
    user = models.OneToOneField(NexoraUser, on_delete=models.CASCADE, related_name="learning_progress")
    xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    current_streak = models.PositiveIntegerField(default=0)
    last_completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "learning_progress"


class LearningLessonCompletion(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="learning_completions")
    lesson = models.ForeignKey(LearningLesson, on_delete=models.PROTECT, related_name="completions")
    completed_at = models.DateTimeField()

    class Meta:
        db_table = "learning_lesson_completions"
        constraints = [
            models.UniqueConstraint(fields=("user", "lesson"), name="learning_user_lesson_completion_unique"),
        ]
        indexes = [models.Index(fields=("user", "completed_at"), name="learning_lesson_user_date_idx")]


class LearningQuizQuestion(AuditableBaseModel):
    lesson = models.ForeignKey(LearningLesson, on_delete=models.CASCADE, related_name="quiz_questions")
    key = models.CharField(max_length=100, unique=True, db_index=True)
    prompt = models.TextField()
    options = models.JSONField(default=list)
    correct_option_index = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    explanation = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "learning_quiz_questions"
        ordering = ("sort_order",)
        constraints = [
            models.UniqueConstraint(fields=("lesson", "sort_order"), name="learning_quiz_question_order_unique"),
        ]


class LearningQuizAttempt(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="learning_quiz_attempts")
    lesson = models.ForeignKey(LearningLesson, on_delete=models.PROTECT, related_name="quiz_attempts")
    correct_answers = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=0)
    score_percent = models.PositiveIntegerField(default=0)
    passed = models.BooleanField(default=False)
    completed_at = models.DateTimeField()

    class Meta:
        db_table = "learning_quiz_attempts"
        indexes = [
            models.Index(fields=("user", "-completed_at"), name="learning_quiz_user_date_idx"),
        ]


class LearningAchievement(AuditableBaseModel):
    key = models.SlugField(max_length=100, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    xp_threshold = models.PositiveIntegerField(default=0)
    streak_threshold = models.PositiveIntegerField(default=0)
    lesson_threshold = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "learning_achievements"
        ordering = ("xp_threshold", "streak_threshold", "lesson_threshold", "title")


class LearningUserAchievement(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="learning_achievements")
    achievement = models.ForeignKey(LearningAchievement, on_delete=models.PROTECT, related_name="user_awards")
    earned_at = models.DateTimeField()

    class Meta:
        db_table = "learning_user_achievements"
        constraints = [
            models.UniqueConstraint(fields=("user", "achievement"), name="learning_user_achievement_unique"),
        ]
