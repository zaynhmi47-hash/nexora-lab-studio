from django.urls import reverse
from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .models import NexverseAuthor, NexverseChapter, NexverseWork


class NexversePublicApiTests(APITestCase):
    def setUp(self):
        user = NexoraUser.objects.create(email="writer@example.test", status=NexoraUser.Status.ACTIVE)
        author = NexverseAuthor.objects.create(user=user, slug="writer", pen_name="Writer")
        self.work = NexverseWork.objects.create(
            author=author,
            slug="test-work",
            title="Test Work",
            status=NexverseWork.Status.PUBLISHED,
            visibility=NexverseWork.Visibility.PUBLIC,
        )
        self.preview = NexverseChapter.objects.create(
            work=self.work,
            chapter_number=1,
            slug="chapter-one",
            title="Chapter One",
            content="A public preview.",
            is_free_preview=True,
            status=NexverseChapter.Status.PUBLISHED,
        )
        self.paid = NexverseChapter.objects.create(
            work=self.work,
            chapter_number=2,
            slug="chapter-two",
            title="Chapter Two",
            content="Premium content must remain private.",
            is_free_preview=False,
            status=NexverseChapter.Status.PUBLISHED,
        )

    def test_catalog_only_returns_public_published_work(self):
        NexverseWork.objects.create(
            author=self.work.author,
            slug="draft-work",
            title="Draft Work",
        )
        response = self.client.get("/api/v1/nexverse/works/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["slug"], "test-work")

    def test_work_detail_lists_chapter_metadata(self):
        response = self.client.get("/api/v1/nexverse/works/test-work/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["chapterCount"], 2)
        self.assertEqual(len(response.data["chapters"]), 2)
        self.assertNotIn("content", response.data["chapters"][0])

    def test_free_preview_content_is_available(self):
        response = self.client.get(
            f"/api/v1/nexverse/works/test-work/chapters/{self.preview.id}/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["content"], "A public preview.")

    def test_paid_chapter_content_is_not_exposed_without_entitlement(self):
        response = self.client.get(
            f"/api/v1/nexverse/works/test-work/chapters/{self.paid.id}/"
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "ENTITLEMENT_REQUIRED")
        self.assertNotIn("content", response.data)
