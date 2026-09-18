from .models import DuaEntry
class DuaService:
 @staticmethod
 def list_entries(category=None):
  qs=DuaEntry.objects.filter(is_published=True,deleted_at__isnull=True)
  return qs.filter(category=category) if category else qs
