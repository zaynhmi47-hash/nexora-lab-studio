from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .models import NexverseAuthor, NexverseChapter, NexverseReadingProgress, NexverseWork


class NexverseReadingProgressApiTests(APITestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create(
            email="reader@example.test", status=NexoraUser.Status.ACTIVE
        )
        author_user = NexoraUser.objects.create(
            email="reader-author@example.test", status=NexoraUser.Status.ACTIVE
        )
        author = NexverseAuthor.objects.create(
            user=author_user, slug="reader-author", pen_name="Reader Author"
        )
        self.work = NexverseWork.objects.create(
            author=author,
            slug="reader-progress-work",
            title="Reader Progress Work",
            status=NexverseWork.Status.PUBLISHED,
            review_status=NexverseWork.ReviewStatus.APPROVED,
            visibility=NexverseWork.Visibility.PUBLIC,
        )
        self.preview = NexverseChapter.objects.create(
            work=self.work,
            chapter_number=1,
            slug="reader-preview",
            title="Preview",
            content="A free chapter.",
            is_free_preview=True,
            status=NexverseChapter.Status.PUBLISHED,
        )
        self.paid = NexverseChapter.objects.create(
            work=self.work,
            chapter_number=2,
            slug="reader-paid",
            title="Paid",
            content="Premium content.",
            is_free_preview=False,
            status=NexverseChapter.Status.PUBLISHED,
        )
        self.client.force_authenticate(user=self.user)
        self.url = f"/api/v1/nexverse/reader/progress/{self.work.id}/"

    def test_reader_can_save_and_resume_progress(self):
        saved = self.client.put(
            self.url,
            {"chapterId": str(self.preview.id), "positionChars": 125, "progressPercent": 42},
            format="json",
        )
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.data["item"]["positionChars"], 125)
        resumed = self.client.get(self.url)
        self.assertEqual(resumed.status_code, 200)
        self.assertEqual(resumed.data["item"]["chapterId"], str(self.preview.id))
        self.assertEqual(resumed.data["item"]["progressPercent"], 42)

    def test_progress_is_scoped_to_authenticated_user(self):
        self.client.put(
            self.url,
            {"chapterId": str(self.preview.id), "positionChars": 10, "progressPercent": 5},
            format="json",
        )
        other = NexoraUser.objects.create(
            email="other-reader@example.test", status=NexoraUser.Status.ACTIVE
        )
        self.client.force_authenticate(user=other)
        response = self.client.get(self.url)
        self.assertIsNone(response.data["item"])

    def test_paid_chapter_cannot_be_used_to_write_progress(self):
        response = self.client.put(
            self.url,
            {"chapterId": str(self.paid.id), "positionChars": 10, "progressPercent": 5},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(NexverseReadingProgress.objects.count(), 0)

    def test_invalid_position_is_rejected(self):
        response = self.client.put(
            self.url,
            {"chapterId": str(self.preview.id), "positionChars": -1, "progressPercent": 5},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
