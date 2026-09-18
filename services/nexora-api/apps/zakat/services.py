from decimal import Decimal

from .models import ZakatCalculation


class ZakatService:
    @staticmethod
    def calculate(user, assets, debts, nisab, currency="IDR", rate=Decimal("0.025")):
        assets = Decimal(str(assets))
        debts = Decimal(str(debts))
        nisab = Decimal(str(nisab))
        rate = Decimal(str(rate))
        if min(assets, debts, nisab, rate) < 0 or rate > 1:
            raise ValueError("Invalid zakat values.")
        amount = max(Decimal("0"), assets - debts)
        zakat = amount * rate if amount >= nisab else Decimal("0")
        return ZakatCalculation.objects.create(
            user=user, assets=assets, debts=debts, nisab=nisab, rate=rate,
            zakatable_amount=amount, zakat_amount=zakat, currency=currency.upper()
        )

    @staticmethod
    def history(user):
        return ZakatCalculation.objects.filter(user=user)[:20]
