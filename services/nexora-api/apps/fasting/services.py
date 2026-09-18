from django.utils import timezone
from .models import FastingRecord

class FastingService:
    @staticmethod
    def list_records(user,limit=60):
        return list(FastingRecord.objects.filter(user=user).order_by("-date")[:limit])
    @staticmethod
    def toggle_today(user):
        today=timezone.localdate()
        record,created=FastingRecord.objects.get_or_create(user=user,date=today,defaults={"status":"fasted"})
        if not created:
            record.status="broken" if record.status=="fasted" else "fasted"
            record.save(update_fields=["status","updated_at"])
        return record
    @staticmethod
    def summary(user):
        records=FastingRecord.objects.filter(user=user)
        return {"fastedDays":records.filter(status="fasted").count(),"brokenDays":records.filter(status="broken").count(),"excusedDays":records.filter(status="excused").count()}
