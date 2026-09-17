from django.db import migrations


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


DEMO_AYAH = (
    2,
    153,
    "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    "O believers! Seek comfort in patience and prayer.",
)


def seed_content(apps, schema_editor):
    Surah = apps.get_model("quran", "QuranSurah")
    Ayah = apps.get_model("quran", "QuranAyah")
    Recitation = apps.get_model("quran", "QuranRecitation")

    surah_by_number = {}
    for number, name, arabic_name, place, ayah_count in SURAHS:
        surah, _ = Surah.objects.update_or_create(
            number=number,
            defaults={
                "name": name,
                "arabic_name": arabic_name,
                "revelation_place": place,
                "ayah_count": ayah_count,
                "deleted_at": None,
            },
        )
        surah_by_number[number] = surah

    number, ayah_number, arabic_text, translation = DEMO_AYAH
    Ayah.objects.update_or_create(
        surah=surah_by_number[number],
        number_in_surah=ayah_number,
        defaults={
            "global_number": None,
            "arabic_text": arabic_text,
            "translation": translation,
            "deleted_at": None,
        },
    )

    Recitation.objects.update_or_create(
        key="demo-1",
        defaults={
            "name": "Demo Recitation",
            "language": "ar",
            "audio_url": "",
            "is_published": True,
            "deleted_at": None,
        },
    )


def unseed_content(apps, schema_editor):
    apps.get_model("quran", "QuranAyah").objects.filter(
        surah__number=DEMO_AYAH[0], number_in_surah=DEMO_AYAH[1]
    ).delete()
    apps.get_model("quran", "QuranRecitation").objects.filter(key="demo-1").delete()
    apps.get_model("quran", "QuranSurah").objects.filter(number__in=[item[0] for item in SURAHS]).delete()


class Migration(migrations.Migration):
    dependencies = [("quran", "0001_initial")]
    operations = [migrations.RunPython(seed_content, unseed_content)]
