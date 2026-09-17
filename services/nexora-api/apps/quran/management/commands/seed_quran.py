from django.core.management.base import BaseCommand
from django.db import transaction

from apps.quran.models import QuranAyah, QuranRecitation, QuranSurah


SURAHS = [
    (1, "Al-Fatihah", "الفاتحة", "makkah", 7),
    (2, "Al-Baqarah", "البقرة", "madinah", 286),
    (3, "Ali Imran", "آل عمران", "madinah", 200),
    (36, "Ya-Sin", "يس", "makkah", 83),
    (55, "Ar-Rahman", "الرحمن", "madinah", 78),
    (112, "Al-Ikhlas", "الإخلاص", "makkah", 4),
    (113, "Al-Falaq", "الفلق", "makkah", 5),
    (114, "An-Nas", "الناس", "makkah", 6),
]

DEMO_AYAH = {
    (2, 153): (
        "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
        "O believers! Seek comfort in patience and prayer.",
    ),
}


class Command(BaseCommand):
    help = "Seed the Quran domain with the initial catalog and demo content."

    @transaction.atomic
    def handle(self, *args, **options):
        surah_map = {}
        for number, name, arabic_name, place, ayah_count in SURAHS:
            surah, _ = QuranSurah.objects.update_or_create(
                number=number,
                defaults={
                    "name": name,
                    "arabic_name": arabic_name,
                    "revelation_place": place,
                    "ayah_count": ayah_count,
                    "deleted_at": None,
                },
            )
            surah_map[number] = surah

        for (surah_number, ayah_number), (arabic, translation) in DEMO_AYAH.items():
            QuranAyah.objects.update_or_create(
                surah=surah_map[surah_number],
                number_in_surah=ayah_number,
                defaults={
                    "arabic_text": arabic,
                    "translation": translation,
                    "deleted_at": None,
                },
            )

        QuranRecitation.objects.update_or_create(
            key="demo-1",
            defaults={
                "name": "Demo Recitation",
                "language": "ar",
                "audio_url": "",
                "is_published": True,
                "deleted_at": None,
            },
        )

        self.stdout.write(self.style.SUCCESS("Quran catalog seeded successfully."))
        self.stdout.write("Note: only the existing demo ayah content is seeded; full Quran text should be imported from an approved source later.")
