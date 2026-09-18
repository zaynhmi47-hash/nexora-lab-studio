from django.db import models
from apps.core.models import AuditableBaseModel

class IslamicPlace(AuditableBaseModel):
    class PlaceType(models.TextChoices):
        MOSQUE = "mosque", "Mosque"
        MUSALLA = "musalla", "Musalla"
        ISLAMIC_CENTER = "islamic_center", "Islamic Center"

    name = models.CharField(max_length=255)
    place_type = models.CharField(max_length=30, choices=PlaceType.choices, default=PlaceType.MOSQUE)
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=120, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    description = models.TextField(blank=True)
    is_published = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "islamic_places"
        ordering = ("name",)
