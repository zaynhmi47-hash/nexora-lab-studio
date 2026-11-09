from __future__ import annotations

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class NexverseAuthor(AuditableBaseModel):
    user = models.OneToOneField(
        NexoraUser, on_delete=models.PROTECT, related_name="nexverse_author"
    )
    slug = models.SlugField(max_length=100, unique=True)
    pen_name = models.CharField(max_length=160)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(max_length=2048, blank=True)
    is_verified = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "nexverse_authors"
        ordering = ("pen_name",)

    def __str__(self) -> str:
        return self.pen_name


class NexverseWork(AuditableBaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        COMPLETED = "completed", "Completed"
        HIATUS = "hiatus", "Hiatus"

    class Visibility(models.TextChoices):
        PUBLIC = "public", "Public"
        UNLISTED = "unlisted", "Unlisted"

    class ReviewStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted for review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    author = models.ForeignKey(
        NexverseAuthor, on_delete=models.PROTECT, related_name="works"
    )
    slug = models.SlugField(max_length=160, unique=True)
    title = models.CharField(max_length=255)
    synopsis = models.TextField(blank=True)
    cover_image_url = models.URLField(max_length=2048, blank=True)
    language_code = models.CharField(max_length=12, default="id", db_index=True)
    genre = models.CharField(max_length=64, blank=True, db_index=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    visibility = models.CharField(
        max_length=16, choices=Visibility.choices, default=Visibility.PUBLIC
    )
    content_rating = models.CharField(max_length=16, default="general")
    published_at = models.DateTimeField(null=True, blank=True)
    view_count = models.PositiveBigIntegerField(default=0)
    review_status = models.CharField(
        max_length=16, choices=ReviewStatus.choices, default=ReviewStatus.DRAFT, db_index=True
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.CharField(max_length=1000, blank=True)

    class Meta:
        db_table = "nexverse_works"
        ordering = ("-published_at", "-created_at")
        indexes = [
            models.Index(fields=("status", "visibility", "published_at"), name="nex_work_catalog_idx"),
            models.Index(fields=("genre", "language_code"), name="nex_work_genre_lang_idx"),
        ]

    def publish(self) -> None:
        self.status = self.Status.PUBLISHED
        self.published_at = self.published_at or timezone.now()
        self.save(update_fields=("status", "published_at", "updated_at"))

    def __str__(self) -> str:
        return self.title


class NexverseChapter(AuditableBaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"

    work = models.ForeignKey(
        NexverseWork, on_delete=models.CASCADE, related_name="chapters"
    )
    chapter_number = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    slug = models.SlugField(max_length=160)
    title = models.CharField(max_length=255)
    summary = models.CharField(max_length=500, blank=True)
    content = models.TextField()
    is_free_preview = models.BooleanField(default=False, db_index=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "nexverse_chapters"
        ordering = ("chapter_number",)
        constraints = [
            models.UniqueConstraint(
                fields=("work", "chapter_number"), name="nex_chapter_number_unique"
            ),
            models.UniqueConstraint(
                fields=("work", "slug"), name="nex_chapter_slug_unique"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.work.title} — {self.title}"
