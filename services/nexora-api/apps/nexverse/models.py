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


class NexverseModerator(AuditableBaseModel):
    class Role(models.TextChoices):
        REVIEWER = "reviewer", "Reviewer"
        PUBLISHER = "publisher", "Publisher"
        ADMIN = "admin", "Administrator"

    user = models.OneToOneField(
        NexoraUser, on_delete=models.PROTECT, related_name="nexverse_moderator"
    )
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.REVIEWER)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "nexverse_moderators"

    def __str__(self) -> str:
        return f"{self.user_id}:{self.role}"


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
    reviewed_by = models.ForeignKey(
        NexoraUser, null=True, blank=True, on_delete=models.PROTECT,
        related_name="nexverse_reviewed_works",
    )

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



class NexverseReviewEvent(AuditableBaseModel):
    class Decision(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    work = models.ForeignKey(
        NexverseWork, on_delete=models.PROTECT, related_name="review_events"
    )
    moderator = models.ForeignKey(
        NexverseModerator, on_delete=models.PROTECT, related_name="review_events"
    )
    decision = models.CharField(max_length=16, choices=Decision.choices)
    note = models.CharField(max_length=1000, blank=True)

    class Meta:
        db_table = "nexverse_review_events"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.work_id}:{self.decision}"


class NexverseReadingProgress(AuditableBaseModel):
    user = models.ForeignKey(
        NexoraUser, on_delete=models.CASCADE, related_name="nexverse_reading_progress"
    )
    work = models.ForeignKey(
        NexverseWork, on_delete=models.CASCADE, related_name="reading_progress"
    )
    chapter = models.ForeignKey(
        NexverseChapter, on_delete=models.CASCADE, related_name="reading_progress"
    )
    position_chars = models.PositiveIntegerField(default=0)
    progress_percent = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "nexverse_reading_progress"
        constraints = [
            models.UniqueConstraint(fields=("user", "work"), name="nex_read_progress_user_work_uniq"),
        ]
        indexes = [models.Index(fields=("user", "updated_at"), name="nex_read_progress_user_idx")]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.work_id}:{self.chapter_id}"


class NexverseBookmark(AuditableBaseModel):
    user = models.ForeignKey(
        NexoraUser, on_delete=models.CASCADE, related_name="nexverse_bookmarks"
    )
    work = models.ForeignKey(
        NexverseWork, on_delete=models.CASCADE, related_name="bookmarks"
    )

    class Meta:
        db_table = "nexverse_bookmarks"
        constraints = [
            models.UniqueConstraint(fields=("user", "work"), name="nex_bookmark_user_work_uniq"),
        ]
        indexes = [models.Index(fields=("user", "created_at"), name="nex_bookmark_user_idx")]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.work_id}"


class NexverseChapterPrice(AuditableBaseModel):
    chapter = models.OneToOneField(
        NexverseChapter, on_delete=models.PROTECT, related_name="price"
    )
    currency = models.CharField(max_length=3, default="IDR")
    amount_minor = models.PositiveBigIntegerField()
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "nexverse_chapter_prices"
        constraints = [
            models.CheckConstraint(condition=models.Q(amount_minor__gt=0), name="nex_chapter_price_positive"),
        ]

    def __str__(self) -> str:
        return f"{self.chapter_id}:{self.currency}:{self.amount_minor}"


class NexversePurchase(AuditableBaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        NexoraUser, on_delete=models.PROTECT, related_name="nexverse_purchases"
    )
    chapter = models.ForeignKey(
        NexverseChapter, on_delete=models.PROTECT, related_name="purchases"
    )
    price = models.ForeignKey(
        NexverseChapterPrice, on_delete=models.PROTECT, related_name="purchases"
    )
    idempotency_key = models.CharField(max_length=128)
    currency = models.CharField(max_length=3)
    amount_minor = models.PositiveBigIntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    payment_provider = models.CharField(max_length=40, blank=True)
    provider_reference = models.CharField(max_length=160, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "nexverse_purchases"
        constraints = [
            models.UniqueConstraint(fields=("user", "idempotency_key"), name="nex_purchase_user_idem_uniq"),
            models.CheckConstraint(condition=models.Q(amount_minor__gt=0), name="nex_purchase_amount_positive"),
        ]
        indexes = [models.Index(fields=("user", "status", "created_at"), name="nex_purchase_user_idx")]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.chapter_id}:{self.status}"


class NexverseEntitlement(AuditableBaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        REVOKED = "revoked", "Revoked"

    purchase = models.OneToOneField(
        NexversePurchase, on_delete=models.PROTECT, related_name="entitlement"
    )
    user = models.ForeignKey(
        NexoraUser, on_delete=models.PROTECT, related_name="nexverse_entitlements"
    )
    work = models.ForeignKey(
        NexverseWork, on_delete=models.PROTECT, related_name="entitlements"
    )
    chapter = models.ForeignKey(
        NexverseChapter, on_delete=models.PROTECT, related_name="entitlements"
    )
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    starts_at = models.DateTimeField()
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "nexverse_entitlements"
        indexes = [
            models.Index(fields=("user", "work", "chapter", "status"), name="nex_entitlement_lookup_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.chapter_id}:{self.status}"


class NexverseRoyaltyEntry(AuditableBaseModel):
    """Append-only gross-sales attribution; this is not a payable or withdrawable balance."""

    class EntryType(models.TextChoices):
        CREDIT = "credit", "Purchase credit"
        REVERSAL = "reversal", "Refund reversal"

    purchase = models.ForeignKey(
        NexversePurchase, on_delete=models.PROTECT, related_name="royalty_entries"
    )
    author = models.ForeignKey(
        NexverseAuthor, on_delete=models.PROTECT, related_name="royalty_entries"
    )
    entry_type = models.CharField(max_length=12, choices=EntryType.choices)
    currency = models.CharField(max_length=3)
    amount_minor = models.PositiveBigIntegerField()

    class Meta:
        db_table = "nexverse_royalty_entries"
        constraints = [
            models.UniqueConstraint(
                fields=("purchase", "entry_type"), name="nex_royalty_purchase_type_uniq"
            ),
            models.CheckConstraint(
                condition=models.Q(amount_minor__gt=0), name="nex_royalty_amount_positive"
            ),
        ]
        indexes = [
            models.Index(fields=("author", "currency", "created_at"), name="nex_royalty_author_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.author_id}:{self.purchase_id}:{self.entry_type}"
