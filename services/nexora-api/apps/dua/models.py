from django.db import models
from apps.core.models import AuditableBaseModel
class DuaEntry(AuditableBaseModel):
    key=models.SlugField(max_length=120,unique=True); title=models.CharField(max_length=255); category=models.CharField(max_length=80); arabic=models.TextField(); transliteration=models.TextField(blank=True); translation=models.TextField(); reference=models.CharField(max_length=255,blank=True); is_published=models.BooleanField(default=True,db_index=True)
    class Meta: db_table="dua_entries"; ordering=("category","id")
