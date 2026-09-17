from __future__ import annotations

from django.db import transaction

from apps.identity.models import NexoraUser

from .models import QuranAyah, QuranBookmark, QuranReadingPosition, QuranRecitation, QuranSurah


class QuranService:
    def list_surahs(self):
        return QuranSurah.objects.all()

    def get_surah(self, number: int):
        return QuranSurah.objects.prefetch_related("ayahs").filter(number=number).first()

    def get_reading_position(self, user: NexoraUser):
        return QuranReadingPosition.objects.select_related("surah").filter(user=user).first()

    @transaction.atomic
    def save_reading_position(self, user: NexoraUser, surah_number: int, ayah_number: int):
        surah = QuranSurah.objects.get(number=surah_number)
        if ayah_number > surah.ayah_count:
            raise ValueError("Ayah number is outside the selected surah.")
        position, _ = QuranReadingPosition.objects.select_for_update().get_or_create(
            user=user,
            defaults={"surah": surah, "ayah_number": ayah_number},
        )
        position.surah = surah
        position.ayah_number = ayah_number
        position.save(update_fields=["surah", "ayah_number", "updated_at"])
        return position

    def list_bookmarks(self, user: NexoraUser):
        return QuranBookmark.objects.select_related("ayah", "ayah__surah").filter(user=user)

    @transaction.atomic
    def save_bookmark(self, user: NexoraUser, ayah_id, note: str = ""):
        ayah = QuranAyah.objects.select_related("surah").get(pk=ayah_id)
        bookmark, _ = QuranBookmark.objects.update_or_create(
            user=user,
            ayah=ayah,
            defaults={"note": note},
        )
        return bookmark

    def remove_bookmark(self, user: NexoraUser, bookmark_id):
        return QuranBookmark.objects.filter(pk=bookmark_id, user=user).delete()

    def list_recitations(self):
        return QuranRecitation.objects.filter(is_published=True)
