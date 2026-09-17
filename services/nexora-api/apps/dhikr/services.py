from django.db import transaction
from django.utils import timezone

from apps.identity.models import NexoraUser

from .models import Dhikr, DhikrHistoryEntry, DhikrProgress


class DhikrService:
    @staticmethod
    def get_all():
        return Dhikr.objects.filter(is_published=True, deleted_at__isnull=True)

    @staticmethod
    def _progress(user, dhikr):
        progress, _ = DhikrProgress.objects.get_or_create(user=user, dhikr=dhikr)
        return progress

    @staticmethod
    @transaction.atomic
    def increment(user: NexoraUser, dhikr_key: str):
        dhikr = Dhikr.objects.select_for_update().filter(key=dhikr_key, is_published=True, deleted_at__isnull=True).first()
        if dhikr is None:
            raise Dhikr.DoesNotExist
        progress = DhikrProgress.objects.select_for_update().get_or_create(user=user, dhikr=dhikr)[0]
        if progress.completed < dhikr.target:
            progress.completed += 1
            progress.save(update_fields=["completed", "updated_at"])
            DhikrHistoryEntry.objects.create(user=user, dhikr=dhikr, count=1, completed_at=timezone.now())
        return progress

    @staticmethod
    @transaction.atomic
    def reset(user: NexoraUser, dhikr_key: str):
        dhikr = Dhikr.objects.filter(key=dhikr_key, is_published=True, deleted_at__isnull=True).first()
        if dhikr is None:
            raise Dhikr.DoesNotExist
        progress = DhikrProgress.objects.select_for_update().get_or_create(user=user, dhikr=dhikr)[0]
        progress.completed = 0
        progress.save(update_fields=["completed", "updated_at"])
        return progress

    @staticmethod
    def history(user: NexoraUser, dhikr_key: str | None = None):
        queryset = DhikrHistoryEntry.objects.select_related("dhikr").filter(user=user, deleted_at__isnull=True)
        if dhikr_key:
            queryset = queryset.filter(dhikr__key=dhikr_key)
        return queryset
