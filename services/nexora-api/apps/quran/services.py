from __future__ import annotations\n\nfrom datetime import date, timedelta

from django.db import transaction

from apps.identity.models import NexoraUser

from .models import QuranAyah, QuranBookmark, QuranReadingGoal, QuranReadingLog, QuranReadingPosition, QuranRecitation, QuranSurah


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


    @transaction.atomic
    def get_or_create_reading_goal(self, user: NexoraUser):
        goal, _ = QuranReadingGoal.objects.select_for_update().get_or_create(user=user)
        return goal

    @transaction.atomic
    def update_reading_goal(self, user: NexoraUser, pages: int, minutes: int):
        if pages < 1 or pages > 604 or minutes < 1 or minutes > 1440:
            raise ValueError("Reading targets are outside the allowed range.")
        goal = self.get_or_create_reading_goal(user)
        goal.daily_target_pages = pages
        goal.daily_target_minutes = minutes
        goal.deleted_at = None
        goal.save(update_fields=["daily_target_pages", "daily_target_minutes", "deleted_at", "updated_at"])
        return goal

    @transaction.atomic
    def log_reading(self, user: NexoraUser, reading_date: date, pages: int, minutes: int):
        if pages < 0 or pages > 604 or minutes < 0 or minutes > 1440:
            raise ValueError("Reading log values are outside the allowed range.")
        log, _ = QuranReadingLog.objects.select_for_update().get_or_create(
            user=user, date=reading_date, defaults={"pages": pages, "minutes": minutes},
        )
        log.pages = pages
        log.minutes = minutes
        log.deleted_at = None
        log.save(update_fields=["pages", "minutes", "deleted_at", "updated_at"])
        return log

    def get_reading_statistics(self, user: NexoraUser, today: date | None = None):
        today = today or date.today()
        goal = self.get_or_create_reading_goal(user)
        logs = QuranReadingLog.objects.filter(user=user, deleted_at__isnull=True)
        current = logs.filter(date=today).first()
        total_pages = sum(item.pages for item in logs)
        total_minutes = sum(item.minutes for item in logs)
        streak = 0
        cursor = today
        while logs.filter(date=cursor, pages__gt=0).exists():
            streak += 1
            cursor -= timedelta(days=1)
        return {
            "goal": {"dailyTargetPages": goal.daily_target_pages, "dailyTargetMinutes": goal.daily_target_minutes},
            "today": {
                "date": today.isoformat(),
                "pages": current.pages if current else 0,
                "minutes": current.minutes if current else 0,
                "pagesProgress": min(1, (current.pages / goal.daily_target_pages) if current else 0),
                "minutesProgress": min(1, (current.minutes / goal.daily_target_minutes) if current else 0),
            },
            "total": {"pages": total_pages, "minutes": total_minutes},
            "currentStreak": streak,
        }
