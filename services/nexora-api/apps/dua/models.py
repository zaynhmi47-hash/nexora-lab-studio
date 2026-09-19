from django.db import models
from apps.core.models import AuditableBaseModel
class DuaEntry(AuditableBaseModel):
    key=models.SlugField(max_length=120,unique=True); title=models.CharField(max_length=255); category=models.CharField(max_length=80); arabic=models.TextField(); transliteration=models.TextField(blank=True); translation=models.TextField(); reference=models.CharField(max_length=255,blank=True); is_published=models.BooleanField(default=True,db_index=True)
    class Meta: db_table="dua_entries"; ordering=("category","id")


class DuaFavorite(AuditableBaseModel):
    user = models.ForeignKey("identity.NexoraUser", on_delete=models.CASCADE, related_name="dua_favorites")
    dua = models.ForeignKey(DuaEntry, on_delete=models.CASCADE, related_name="favorites")

    class Meta:
        db_table = "dua_favorites"
        constraints = [models.UniqueConstraint(fields=("user", "dua"), name="dua_user_entry_unique")]
        indexes = [models.Index(fields=("user", "-created_at"), name="dua_favorite_user_date_idx")]
