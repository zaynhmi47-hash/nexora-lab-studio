from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .models import (NexverseAuthor, NexverseChapter, NexverseChapterPrice, NexverseEntitlement, NexversePurchase, NexverseReadingProgress, NexverseWork)


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
            {"chapterId": str(self.preview.id), "positionChars": 12, "progressPercent": 42},
            format="json",
        )
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.data["item"]["positionChars"], 12)
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

    def test_entitled_reader_can_save_and_resume_paid_chapter_progress(self):
        price = NexverseChapterPrice.objects.create(
            chapter=self.paid, currency="IDR", amount_minor=12500
        )
        purchase = NexversePurchase.objects.create(
            user=self.user,
            chapter=self.paid,
            price=price,
            idempotency_key="paid-progress-test",
            currency="IDR",
            amount_minor=12500,
            status=NexversePurchase.Status.PAID,
            payment_provider="test",
            provider_reference="paid-progress-reference",
            paid_at=timezone.now(),
        )
        NexverseEntitlement.objects.create(
            purchase=purchase,
            user=self.user,
            work=self.work,
            chapter=self.paid,
            status=NexverseEntitlement.Status.ACTIVE,
            starts_at=timezone.now(),
        )

        saved = self.client.put(
            self.url,
            {"chapterId": str(self.paid.id), "positionChars": 8, "progressPercent": 35},
            format="json",
        )
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.data["item"]["chapterId"], str(self.paid.id))

        resumed = self.client.get(self.url)
        self.assertEqual(resumed.status_code, 200)
        self.assertEqual(resumed.data["item"]["progressPercent"], 35)

    def test_expired_entitlement_cannot_save_paid_chapter_progress(self):
        now = timezone.now()
        price = NexverseChapterPrice.objects.create(
            chapter=self.paid, currency="IDR", amount_minor=12500
        )
        purchase = NexversePurchase.objects.create(
            user=self.user,
            chapter=self.paid,
            price=price,
            idempotency_key="expired-paid-progress-test",
            currency="IDR",
            amount_minor=12500,
            status=NexversePurchase.Status.PAID,
            payment_provider="test",
            provider_reference="expired-paid-progress-reference",
            paid_at=now - timedelta(days=3),
        )
        NexverseEntitlement.objects.create(
            purchase=purchase,
            user=self.user,
            work=self.work,
            chapter=self.paid,
            status=NexverseEntitlement.Status.ACTIVE,
            starts_at=now - timedelta(days=2),
            expires_at=now - timedelta(days=1),
        )

        response = self.client.put(
            self.url,
            {"chapterId": str(self.paid.id), "positionChars": 8, "progressPercent": 35},
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

    def test_position_cannot_exceed_chapter_content_length(self):
        response = self.client.put(
            self.url,
            {"chapterId": str(self.preview.id), "positionChars": 1000, "progressPercent": 90},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(NexverseReadingProgress.objects.count(), 0)
