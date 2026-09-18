from datetime import date
from django.core.management.base import BaseCommand
from apps.calendar.models import HijriEvent
DATA=[(date(2026,2,18),9,1,"Ramadan","Expected start date; verify locally with official moon-sighting authority."),(date(2026,3,20),10,1,"Shawwal","Expected Eid al-Fitr period; verify locally with official authority."),(date(2026,5,27),12,10,"Dhul Hijjah 10","Expected Eid al-Adha period; verify locally with official authority.")]
class Command(BaseCommand):
 def handle(self,*args,**kwargs):
  for d,m,day,title,desc in DATA: HijriEvent.objects.update_or_create(date=d,defaults={"hijri_month":m,"hijri_day":day,"title":title,"description":desc,"is_published":True})
  self.stdout.write(self.style.SUCCESS("Seeded calendar events."))
