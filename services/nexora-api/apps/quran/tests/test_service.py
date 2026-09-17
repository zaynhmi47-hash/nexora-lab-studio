from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.identity.models import NexoraUser

from ..models import QuranBookmark, QuranReadingPosition, QuranSurah
from ..services import QuranService


class QuranServiceTests(TestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create()
        self.other_user = NexoraUser.objects.create()
        self.surah = QuranSurah.objects.create(
            number=2,
            name="Al-Baqarah",
            arabic_name="البقرة",
            revelation_place="madinah",
            ayah_count=2,
        )
        self.ayah1 = self.surah.ayahs.create(number_in_surah=1, arabic_text="آلم", translation="Alif Lam Mim")
        self.ayah2 = self.surah.ayahs.create(number_in_surah=2, arabic_text="ذَٰلِكَ الْكِتَابُ", translation="This is the Book")
        self.service = QuranService()

    def test_reading_position_is_user_scoped_and_validated(self):
        position = self.service.save_reading_position(self.user, 2, 2)
        self.assertEqual(position.ayah_number, 2)
        self.assertEqual(self.service.get_reading_position(self.other_user), None)
        with self.assertRaises(ValueError):
            self.service.save_reading_position(self.user, 2, 3)

    def test_bookmark_is_idempotent_for_same_user_and_ayah(self):
        first = self.service.save_bookmark(self.user, 2, 1)
        second = self.service.save_bookmark(self.user, 2, 1, "note")
        self.assertEqual(first.id, second.id)
        self.assertEqual(QuranBookmark.objects.filter(user=self.user).count(), 1)
        self.assertEqual(self.service.list_bookmarks(self.other_user).count(), 0)

    def test_soft_deleted_bookmark_can_be_restored(self):
        bookmark = self.service.save_bookmark(self.user, 2, 1)
        self.service.remove_bookmark(self.user, bookmark.id)
        self.assertEqual(self.service.list_bookmarks(self.user).count(), 0)
        restored = self.service.save_bookmark(self.user, 2, 1)
        self.assertEqual(restored.id, bookmark.id)
        self.assertIsNone(restored.deleted_at)
