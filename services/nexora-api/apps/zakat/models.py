from django.db import models

from apps.core.models import AuditableBaseModel
from apps.identity.models import NexoraUser


class ZakatCalculation(AuditableBaseModel):
    user = models.ForeignKey(NexoraUser, on_delete=models.CASCADE, related_name="zakat_calculations")
    assets = models.DecimalField(max_digits=18, decimal_places=2)
    debts = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    nisab = models.DecimalField(max_digits=18, decimal_places=2)
    rate = models.DecimalField(max_digits=5, decimal_places=4, default=0.025)
    zakatable_amount = models.DecimalField(max_digits=18, decimal_places=2)
    zakat_amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=3, default="IDR")

    class Meta:
        db_table = "zakat_calculations"
        ordering = ("-created_at",)
