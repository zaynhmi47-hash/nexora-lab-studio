from django.core.management.base import BaseCommand
from apps.tajwid.models import TajwidPracticeItem, TajwidTopic


TOPICS = [
    ("makharij", "Makharijul Huruf", "Mengenal tempat keluarnya huruf hijaiyah.", 1, 30),
    ("sifat-huruf", "Sifat Huruf", "Mengenal karakter dan sifat utama huruf.", 2, 30),
    ("nun-sukun-tanwin", "Nun Sukun & Tanwin", "Mempelajari hukum bacaan nun sukun dan tanwin.", 3, 40),
    ("mim-sukun", "Mim Sukun", "Mempelajari hukum bacaan mim sukun.", 4, 40),
    ("mad", "Mad", "Memahami dasar panjang-pendek bacaan mad.", 5, 40),
    ("qalqalah", "Qalqalah", "Berlatih karakter pantulan pada huruf qalqalah.", 6, 40),
    ("waqaf-ibtida", "Waqaf & Ibtida'", "Memahami dasar berhenti dan memulai bacaan.", 7, 50),
]

PRACTICE = {
    "makharij": ("makharij-1", "Apa yang dipelajari dalam Makharijul Huruf?", ["Tempat keluarnya huruf", "Jenis perjalanan", "Sejarah mushaf", "Perhitungan zakat"], 0, "Makharijul Huruf membahas tempat keluarnya huruf saat dilafalkan."),
    "sifat-huruf": ("sifat-1", "Apa fokus utama pembelajaran Sifat Huruf?", ["Karakteristik huruf saat dibaca", "Jadwal shalat", "Arah kiblat", "Manasik haji"], 0, "Sifat Huruf membantu memahami karakteristik bunyi huruf ketika dilafalkan."),
    "nun-sukun-tanwin": ("nun-1", "Topik apa yang menjadi fokus bab ini?", ["Hukum nun sukun dan tanwin", "Hukum waris", "Bahasa isyarat", "Sejarah Andalusia"], 0, "Bab ini memperkenalkan hukum bacaan yang berkaitan dengan nun sukun dan tanwin."),
    "mim-sukun": ("mim-1", "Bab Mim Sukun membahas apa?", ["Hukum bacaan mim sukun", "Tata cara wudhu", "Ilmu falak", "Adab bertamu"], 0, "Bab ini membahas kaidah bacaan yang berkaitan dengan mim sukun."),
    "mad": ("mad-1", "Apa konsep dasar yang dikenalkan dalam bab Mad?", ["Panjang-pendek bacaan", "Pembagian warisan", "Arah kiblat", "Kalender hijriah"], 0, "Mad berkaitan dengan pemanjangan suara dalam bacaan sesuai kaidahnya."),
    "qalqalah": ("qalqalah-1", "Apa yang dilatih dalam bab Qalqalah?", ["Pantulan suara pada huruf tertentu", "Kecepatan membaca", "Terjemahan bahasa Arab", "Tata cara safar"], 0, "Qalqalah adalah karakter pantulan suara pada huruf-huruf tertentu dalam kondisi yang sesuai."),
    "waqaf-ibtida": ("waqaf-1", "Apa fokus dasar Waqaf & Ibtida'?", ["Berhenti dan memulai bacaan dengan tepat", "Menghitung zakat", "Mencari arah kiblat", "Membuat jadwal belajar"], 0, "Waqaf berkaitan dengan berhenti, sedangkan ibtida' berkaitan dengan memulai bacaan."),
}


class Command(BaseCommand):
    help = "Seed the Tajwid educational demo catalog."

    def handle(self, *args, **options):
        topics = {}
        for key, title, description, sort_order, xp_reward in TOPICS:
            topic, _ = TajwidTopic.objects.update_or_create(
                key=key,
                defaults={
                    "title": title,
                    "short_description": description,
                    "sort_order": sort_order,
                    "xp_reward": xp_reward,
                    "is_published": True,
                },
            )
            topics[key] = topic

        for key, (item_key, prompt, options_list, correct_index, explanation) in PRACTICE.items():
            TajwidPracticeItem.objects.update_or_create(
                key=item_key,
                defaults={
                    "topic": topics[key],
                    "prompt": prompt,
                    "options": options_list,
                    "correct_option_index": correct_index,
                    "explanation": explanation,
                    "sort_order": 1,
                },
            )

        self.stdout.write(self.style.SUCCESS("Seeded Tajwid topics and practice items."))
