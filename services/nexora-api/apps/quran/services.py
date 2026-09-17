from __future__ import annotations

from django.db import transaction

from apps.identity.models import NexoraUser

from .models import QuranAyah, QuranBookmark, QuranReadingPosition, QuranRecitation, QuranSurah


class QuranService:
    def list_surahs(self):
        return QuranSurah.objects.filter(deleted_at__isnull=True)

    def get_surah(self, number: int):
        return QuranSurah.objects.prefetch_related("ayahs").filter(number=number, deleted_at__isnull=True).first()

    def get_reading_position(self, user: NexoraUser):
        return QuranReadingPosition.objects.select_related("surah").filter(user=user, deleted_at__isnull=True).first()

    @transaction.atomic
    def save_reading_position(self, user: NexoraUser, surah_number: int, ayah_number: int):
        surah = QuranSurah.objects.filter(number=surah_number, deleted_at__isnull=True).first()
        if surah is None or ayah_number < 1 or ayah_number > surah.ayah_count:
            raise ValueError("Ayah number is outside the selected surah.")
        position, _ = QuranReadingPosition.objects.select_for_update().get_or_create(
            user=user,
            defaults={"surah": surah, "ayah_number": ayah_number},
        )
        position.surah = surah
        position.ayah_number = ayah_number
        position.deleted_at = None
        position.save(update_fields=["surah", "ayah_number", "deleted_at", "updated_at"])
        return position

    def list_bookmarks(self, user: NexoraUser):
        return QuranBookmark.objects.select_related("ayah", "ayah__surah").filter(
            user=user, deleted_at__isnull=True, ayah__deleted_at__isnull=True
        )

    @transaction.atomic
    def save_bookmark(self, user: NexoraUser, surah_number: int, ayah_number: int, note: str = ""):
        ayah = QuranAyah.objects.select_related("surah").filter(
            surah__number=surah_number,
            number_in_surah=ayah_number,
            surah__deleted_at__isnull=True,
            deleted_at__isnull=True,
        ).first()
        if ayah is None:
            raise ValueError("Ayah not found.")
        bookmark, created = QuranBookmark.objects.update_or_create(
            user=user,
            ayah=ayah,
            defaults={"note": note, "deleted_at": None},
        )
        if not created:
            bookmark.deleted_at = None
            bookmark.save(update_fields=["note", "deleted_at", "updated_at"])
        return bookmark

    def remove_bookmark(self, user: NexoraUser, bookmark_id):
        bookmark = QuranBookmark.objects.filter(pk=bookmark_id, user=user, deleted_at__isnull=True).first()
        if bookmark is not None:
            bookmark.soft_delete()
        return bookmark

    def list_recitations(self):
        return QuranRecitation.objects.filter(is_published=True, deleted_at__isnull=True)
