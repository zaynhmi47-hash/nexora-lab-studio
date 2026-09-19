from datetime import date

from django.utils import timezone

from apps.fasting.services import FastingService

RAMADAN_SEASONS = {
    2026: (date(2026, 2, 18), date(2026, 3, 19)),
}


class RamadanService:
    @staticmethod
    def _season(today):
        for year, (start_date, end_date) in RAMADAN_SEASONS.items():
            if start_date <= today <= end_date:
                return year, start_date, end_date
        return None

    @classmethod
    def dashboard(cls, user):
        today = timezone.localdate()
        season = cls._season(today)
        fasting = FastingService.summary(user)

        base = {
            "sourceStatus": "Expected dates require local moon-sighting verification.",
            "fasting": fasting,
            "targets": {"quranPages": 4, "dhikrCount": 100, "learningMinutes": 15},
        }

        if season is None:
            return {
                **base,
                "isRamadan": False,
                "year": None,
                "day": None,
                "startDate": None,
                "endDate": None,
                "dateStatus": "outside_season",
            }

        year, start_date, end_date = season
        return {
            **base,
            "isRamadan": True,
            "year": year,
            "day": (today - start_date).days + 1,
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "dateStatus": "expected",
        }
