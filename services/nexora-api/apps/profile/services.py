from __future__ import annotations

from django.db import transaction

from apps.identity.models import NexoraUser

from .models import ProfilePreference


class ProfileService:
    @staticmethod
    def get_snapshot(user: NexoraUser):
        preference, _ = ProfilePreference.objects.get_or_create(user=user)
        return {
            "progress": {"quranReading": 0, "tajwid": 0, "arabic": 0, "kitabKuning": 0},
            "preferences": {
                "notificationsEnabled": preference.notifications_enabled,
                "showArabicTransliteration": preference.show_arabic_transliteration,
            },
        }

    @staticmethod
    @transaction.atomic
    def update_preferences(user: NexoraUser, *, notifications_enabled: bool, show_arabic_transliteration: bool):
        preference, _ = ProfilePreference.objects.select_for_update().get_or_create(user=user)
        preference.notifications_enabled = notifications_enabled
        preference.show_arabic_transliteration = show_arabic_transliteration
        preference.deleted_at = None
        preference.save(update_fields=["notifications_enabled", "show_arabic_transliteration", "deleted_at", "updated_at"])
        return ProfileService.get_snapshot(user)
