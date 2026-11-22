from __future__ import annotations

from django.core.validators import MinValueValidator
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


class LearningLessonContent(AuditableBaseModel):
    """Versioned, provider-neutral lesson body represented as safe typed blocks."""

    lesson = models.OneToOneField(
        LearningLesson,
        on_delete=models.PROTECT,
        related_name="content",
    )
    version = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    estimated_minutes = models.PositiveIntegerField(default=0)
    blocks = models.JSONField(default=list)
    is_published = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "learning_lesson_contents"
        constraints = [
            models.CheckConstraint(condition=models.Q(version__gte=1), name="learning_content_version_gte_one"),
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


class LearningCompetency(AuditableBaseModel):
    """A versionable skill area in the learner-facing competency taxonomy."""

    key = models.SlugField(max_length=120, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    domain = models.CharField(max_length=80, db_index=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "learning_competencies"
        ordering = ("domain", "sort_order", "title")


class LearningOutcome(AuditableBaseModel):
    """A measurable outcome that contributes to one competency."""

    key = models.SlugField(max_length=140, unique=True)
    competency = models.ForeignKey(
        LearningCompetency,
        on_delete=models.PROTECT,
        related_name="outcomes",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    success_criteria = models.JSONField(default=list, blank=True)
    proficiency_level = models.PositiveSmallIntegerField(default=1)
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "learning_outcomes"
        ordering = ("competency__domain", "competency__sort_order", "sort_order", "title")
        constraints = [
            models.CheckConstraint(
                condition=models.Q(proficiency_level__gte=1, proficiency_level__lte=5),
                name="learning_outcome_level_1_5",
            ),
        ]


class LearningEvidence(AuditableBaseModel):
    """Learner-owned evidence; submission never implies verified mastery."""

    class EvidenceType(models.TextChoices):
        PROJECT = "project", "Project"
        ASSIGNMENT = "assignment", "Assignment"
        CERTIFICATE = "certificate", "Certificate"
        PRACTICE = "practice", "Practical demonstration"
        REFLECTION = "reflection", "Reflection"
        OTHER = "other", "Other"
        LEARNING_ACTIVITY = "learning_activity", "Recorded learning activity"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending review"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Needs revision"

    class SourceType(models.TextChoices):
        SELF_REPORTED = "self_reported", "Self reported"
        LEARNING = "learning", "Dignity Learn"
        ACADEMIC = "academic", "Academic"
        CAREER = "career", "Career"
        EXTERNAL = "external", "External"

    user = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.CASCADE,
        related_name="learning_evidence",
    )
    outcome = models.ForeignKey(
        LearningOutcome,
        on_delete=models.PROTECT,
        related_name="evidence",
    )
    evidence_type = models.CharField(max_length=20, choices=EvidenceType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    artifact_url = models.URLField(max_length=1000, blank=True)
    source_type = models.CharField(
        max_length=20,
        choices=SourceType.choices,
        default=SourceType.SELF_REPORTED,
    )
    source_reference = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    reviewed_by = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_learning_evidence",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True)

    class Meta:
        db_table = "learning_evidence"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("user", "status"), name="learn_ev_user_status_idx"),
            models.Index(fields=("outcome", "status"), name="learn_ev_out_status_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    ~models.Q(status__in=("verified", "rejected"))
                    | (models.Q(reviewed_by__isnull=False) & models.Q(reviewed_at__isnull=False))
                ),
                name="learn_evidence_review_audit_ck",
            ),
        ]


class LearningMastery(AuditableBaseModel):
    """An explicit assessment record; never inferred from course completion."""

    class Status(models.TextChoices):
        UNASSESSED = "unassessed", "Unassessed"
        PROVISIONAL = "provisional", "Provisional"
        VERIFIED = "verified", "Verified"

    user = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.CASCADE,
        related_name="learning_mastery",
    )
    outcome = models.ForeignKey(
        LearningOutcome,
        on_delete=models.PROTECT,
        related_name="mastery_records",
    )
    level = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.UNASSESSED,
        db_index=True,
    )
    assessment_method = models.CharField(max_length=80, blank=True)
    rationale = models.TextField(blank=True)
    assessed_by = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assessed_learning_mastery",
    )
    assessed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "learning_mastery"
        constraints = [
            models.UniqueConstraint(
                fields=("user", "outcome"),
                condition=models.Q(deleted_at__isnull=True),
                name="learning_user_outcome_mastery_unique",
            ),
            models.CheckConstraint(
                condition=models.Q(level__gte=0, level__lte=5),
                name="learning_mastery_level_0_5",
            ),
            models.CheckConstraint(
                condition=(
                    ~models.Q(status__in=("provisional", "verified"))
                    | (models.Q(assessed_by__isnull=False) & models.Q(assessed_at__isnull=False))
                ),
                name="learn_mastery_assessment_ck",
            ),
        ]


class LearningEvidenceShare(AuditableBaseModel):
    """Explicit, revocable consent to let one organization review one evidence item."""

    evidence = models.ForeignKey(
        LearningEvidence,
        on_delete=models.CASCADE,
        related_name="organization_shares",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        related_name="learning_evidence_shares",
    )
    shared_by = models.ForeignKey(
        "identity.NexoraUser",
        on_delete=models.PROTECT,
        related_name="shared_learning_evidence",
    )
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "learning_evidence_shares"
        constraints = [
            models.UniqueConstraint(
                fields=("evidence", "organization"),
                condition=models.Q(revoked_at__isnull=True, deleted_at__isnull=True),
                name="learn_evidence_active_share_unique",
            ),
        ]
        indexes = [
            models.Index(fields=("organization", "revoked_at"), name="learn_ev_share_org_idx"),
        ]


class LearningOutcomeLessonMapping(AuditableBaseModel):
    """Curated link between a lesson and the outcome it supports."""

    class ContributionType(models.TextChoices):
        INTRODUCED = "introduced", "Introduces"
        PRACTICED = "practiced", "Practices"
        ASSESSED = "assessed", "Assesses"

    lesson = models.ForeignKey(
        LearningLesson,
        on_delete=models.PROTECT,
        related_name="outcome_mappings",
    )
    outcome = models.ForeignKey(
        LearningOutcome,
        on_delete=models.PROTECT,
        related_name="lesson_mappings",
    )
    contribution_type = models.CharField(
        max_length=12,
        choices=ContributionType.choices,
        default=ContributionType.INTRODUCED,
    )
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "learning_outcome_lesson_mappings"
        ordering = ("lesson__course__sort_order", "lesson__sort_order", "outcome__sort_order")
        constraints = [
            models.UniqueConstraint(
                fields=("lesson", "outcome"),
                condition=models.Q(deleted_at__isnull=True),
                name="learning_lesson_outcome_map_uniq",
            ),
        ]
