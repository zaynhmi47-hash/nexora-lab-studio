from django.db import models
from apps.core.models import AuditableBaseModel
class HijriEvent(AuditableBaseModel):
    date=models.DateField(unique=True); hijri_month=models.PositiveSmallIntegerField(); hijri_day=models.PositiveSmallIntegerField(); title=models.CharField(max_length=255); description=models.TextField(blank=True); is_published=models.BooleanField(default=True,db_index=True)
    class Meta: db_table="hijri_events"; ordering=("date",)
