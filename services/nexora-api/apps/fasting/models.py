from django.db import models
from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser

class FastingRecord(AuditableBaseModel):
    user=models.ForeignKey(NexoraUser,on_delete=models.CASCADE,related_name="fasting_records")
    date=models.DateField()
    status=models.CharField(max_length=20,choices=[("fasted","Fasted"),("broken","Broken"),("excused","Excused")],default="fasted")
    note=models.CharField(max_length=255,blank=True)
    class Meta:
        db_table="fasting_records"
        constraints=[models.UniqueConstraint(fields=("user","date"),name="fasting_user_date_unique")]
        ordering=("-date",)
