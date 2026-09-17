from django.db import migrations

ITEMS = [
    ("morning-praise", "Morning praise", "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", "Subhanallahi wa bihamdihi", "Glory is to Allah and praise is for Him.", 100, "morning"),
    ("istighfar", "Istighfar", "أَسْتَغْفِرُ اللَّهَ", "Astaghfirullah", "I seek forgiveness from Allah.", 100, "general"),
    ("salawat", "Salawat", "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", "Allahumma salli ala Muhammad", "O Allah, send blessings upon Muhammad.", 100, "general"),
]


def seed(apps, schema_editor):
    Dhikr = apps.get_model("dhikr", "Dhikr")
    for key, title, arabic, transliteration, translation, target, category in ITEMS:
        Dhikr.objects.update_or_create(key=key, defaults={"title": title, "arabic": arabic, "transliteration": transliteration, "translation": translation, "target": target, "category": category, "is_published": True, "deleted_at": None})


def unseed(apps, schema_editor):
    apps.get_model("dhikr", "Dhikr").objects.filter(key__in=[item[0] for item in ITEMS]).delete()


class Migration(migrations.Migration):
    dependencies = [("dhikr", "0001_initial")]
    operations = [migrations.RunPython(seed, unseed)]
