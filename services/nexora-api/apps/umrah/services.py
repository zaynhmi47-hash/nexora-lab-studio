from __future__ import annotations

from django.db import transaction

from apps.identity.models import NexoraUser

from .models import UmrahChecklistItem, UmrahChecklistProgress, UmrahStage


class UmrahService:
    @staticmethod
    def _items():
        return UmrahChecklistItem.objects.select_related("stage").filter(
            stage__is_published=True,
            stage__deleted_at__isnull=True,
            deleted_at__isnull=True,
        )

    @classmethod
    def get_journey(cls, user: NexoraUser):
        stages = list(UmrahStage.objects.filter(is_published=True, deleted_at__isnull=True))
        items = list(cls._items())
        progress_map = {
            row.item_id: row.completed
            for row in UmrahChecklistProgress.objects.filter(
                user=user,
                item__in=items,
                deleted_at__isnull=True,
            )
        }
        checklist = [
            {
                "id": item.key,
                "stageId": item.stage.key,
                "title": item.title,
                "description": item.description,
                "completed": progress_map.get(item.id, False),
                "required": item.required,
            }
            for item in items
        ]
        stage_payload = []
        for stage in stages:
            stage_items = [item for item in items if item.stage_id == stage.id]
            completed = sum(progress_map.get(item.id, False) for item in stage_items)
            stage_payload.append({
                "id": stage.key,
                "title": stage.title,
                "description": stage.description,
                "status": "locked",
                "progress": completed / len(stage_items) if stage_items else 0,
                "checklistCount": len(stage_items),
                "completedChecklistCount": completed,
            })

        current_index = next(
            (index for index, stage in enumerate(stage_payload) if stage["progress"] < 1),
            len(stage_payload) - 1,
        )
        for index, stage in enumerate(stage_payload):
            if stage["progress"] >= 1:
                stage["status"] = "completed"
            elif index == current_index:
                stage["status"] = "current"
            else:
                stage["status"] = "locked"

        completed_total = sum(item["completed"] for item in checklist)
        return {
            "title": "Umrah Journey",
            "subtitle": "A structured preparation and reflection checklist.",
            "overallProgress": completed_total / len(checklist) if checklist else 0,
            "currentStageId": stage_payload[current_index]["id"] if stage_payload else "learn",
            "stages": stage_payload,
            "checklist": checklist,
        }

    @classmethod
    @transaction.atomic
    def toggle_checklist(cls, user: NexoraUser, item_key: str):
        item = cls._items().filter(key=item_key).first()
        if item is None:
            raise UmrahChecklistItem.DoesNotExist
        progress, _ = UmrahChecklistProgress.objects.select_for_update().get_or_create(
            user=user,
            item=item,
        )
        progress.completed = not progress.completed
        progress.deleted_at = None
        progress.save(update_fields=["completed", "deleted_at", "updated_at"])
        return cls.get_journey(user)
