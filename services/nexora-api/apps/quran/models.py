from __future__ import annotations

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class QuranSurah(AuditableBaseModel):
    number = models.PositiveSmallIntegerField(unique=True, validators=[MinValueValidator(1), MaxValueValidator(114)])
    name = models.CharField(max_length=100)
    arabic_name = models.CharField(max_length=100)
    revelation_place = models.CharField(max_length=16, choices=(("makkah", "Makkah"), ("madinah", "Madinah")))
    ayah_count = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        db_table = "quran_surahs"
        ordering = ("number",)


class QuranAyah(AuditableBaseModel):
    surah = models.ForeignKey(QuranSurah, on_delete=models.PROTECT, related_name="ayahs")
    number_in_surah = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    global_number = models.PositiveIntegerField(null=True, blank=True)
    arabic_text = models.TextField()
    translation = models.TextField(blank=True)

    class Meta:
        db_table = "quran_ayahs"
        ordering = ("surah", "number_in_surah")
        constraints = [models.UniqueConstraint(fields=("surah", "number_in_surah"), name="quran_surah_ayah_unique")]


class QuranReadingPosition(AuditableBaseModel):
    user = models.OneToOneField(NexoraUser, on_delete=models.CASCADE, related_name="quran_reading_position")
    surah = models.ForeignKey(QuranSurah, on_delete=models.PROTECT)
    ayah_number = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        db_table = "quran_reading_positions"


class QuranBookmark(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="quran_bookmarks")
    ayah = models.ForeignKey(QuranAyah, on_delete=models.PROTECT, related_name="bookmarks")
    note = models.TextField(blank=True)

    class Meta:
        db_table = "quran_bookmarks"
        constraints = [models.UniqueConstraint(fields=("user", "ayah"), name="quran_user_ayah_bookmark_unique")]
        indexes = [models.Index(fields=("user", "created_at"), name="quran_bookmark_user_date_idx")]


class QuranRecitation(AuditableBaseModel):
    key = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    language = models.CharField(max_length=16)
    audio_url = models.URLField(max_length=2048, blank=True)
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "quran_recitations"
        ordering = ("name",)
