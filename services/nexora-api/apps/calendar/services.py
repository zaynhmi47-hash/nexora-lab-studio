from .models import HijriEvent
class CalendarService:
 @staticmethod
 def events(): return HijriEvent.objects.filter(is_published=True,deleted_at__isnull=True)
