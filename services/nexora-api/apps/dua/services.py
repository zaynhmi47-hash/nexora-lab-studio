from .models import DuaEntry
class DuaService:
 @staticmethod
 def list_entries(category=None):
  qs=DuaEntry.objects.filter(is_published=True,deleted_at__isnull=True)
  return qs.filter(category=category) if category else qs


from django.db import transaction
from apps.identity.models import NexoraUser
from .models import DuaFavorite

class DuaFavoriteService:
    @staticmethod
    def list_favorites(user: NexoraUser):
        return DuaFavorite.objects.select_related("dua").filter(
            user=user, deleted_at__isnull=True, dua__deleted_at__isnull=True, dua__is_published=True
        )

    @staticmethod
    @transaction.atomic
    def toggle(user: NexoraUser, dua_id):
        favorite = DuaFavorite.objects.filter(user=user, dua_id=dua_id).first()
        if favorite is None:
            return DuaFavorite.objects.create(user=user, dua_id=dua_id), True
        if favorite.deleted_at is None:
            favorite.soft_delete()
            return favorite, False
        favorite.deleted_at = None
        favorite.save(update_fields=["deleted_at", "updated_at"])
        return favorite, True
