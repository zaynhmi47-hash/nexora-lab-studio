from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .models import NexverseAuthor, NexverseChapter, NexverseChapterPrice, NexverseWork


class NexverseCreatorApiTests(APITestCase):
    def setUp(self):
        self.writer = NexoraUser.objects.create(
            email="creator@example.test", status=NexoraUser.Status.ACTIVE
        )
        self.other_user = NexoraUser.objects.create(
            email="other@example.test", status=NexoraUser.Status.ACTIVE
        )
        self.client.force_authenticate(user=self.writer)

    def test_creator_can_create_profile_and_draft_work(self):
        profile = self.client.post(
            "/api/v1/nexverse/creator/profile/",
            {"penName": "Aster Writer"},
            format="json",
        )
        self.assertEqual(profile.status_code, 201)
        work_response = self.client.post(
            "/api/v1/nexverse/creator/works/",
            {"title": "The First Story", "synopsis": "A story synopsis."},
            format="json",
        )
        self.assertEqual(work_response.status_code, 201)
        self.assertEqual(work_response.data["reviewStatus"], "draft")
        self.assertEqual(work_response.data["publicationStatus"], "draft")

    def test_creator_cannot_access_another_authors_work(self):
        author = NexverseAuthor.objects.create(
            user=self.other_user, slug="other-writer", pen_name="Other Writer"
        )
        work = NexverseWork.objects.create(
            author=author, slug="private-other-work", title="Private Work"
        )
        response = self.client.patch(
            f"/api/v1/nexverse/creator/works/{work.id}/",
            {"title": "Attempted takeover"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
        work.refresh_from_db()
        self.assertEqual(work.title, "Private Work")

    def test_published_work_is_locked_until_revision_workflow_exists(self):
        author = NexverseAuthor.objects.create(
            user=self.writer, slug="published-author", pen_name="Published Author"
        )
        work = NexverseWork.objects.create(
            author=author,
            slug="published-work",
            title="Published Work",
            status=NexverseWork.Status.PUBLISHED,
            review_status=NexverseWork.ReviewStatus.APPROVED,
        )
        response = self.client.patch(
            f"/api/v1/nexverse/creator/works/{work.id}/",
            {"title": "Unreviewed title change"},
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        work.refresh_from_db()
        self.assertEqual(work.title, "Published Work")

    def test_creator_can_submit_complete_work_for_review(self):
        self.client.post(
            "/api/v1/nexverse/creator/profile/",
            {"penName": "Aster Writer"},
            format="json",
        )
        created = self.client.post(
            "/api/v1/nexverse/creator/works/",
            {"title": "Reviewable Story", "synopsis": "A complete synopsis."},
            format="json",
        )
        work_id = created.data["id"]
        self.client.post(
            f"/api/v1/nexverse/creator/works/{work_id}/chapters/",
            {
                "number": 1,
                "title": "Opening",
                "content": "The first chapter.",
                "freePreview": True,
            },
            format="json",
        )
        response = self.client.post(
            f"/api/v1/nexverse/creator/works/{work_id}/submit/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.data["reviewStatus"], "submitted")


    def _create_pricing_chapter(self, *, free_preview=False, user=None):
        owner = user or self.writer
        author, _ = NexverseAuthor.objects.get_or_create(
            user=owner,
            defaults={"slug": f"author-{owner.id}", "pen_name": "Pricing Author"},
        )
        work = NexverseWork.objects.create(
            author=author, slug=f"pricing-work-{owner.id}", title="Pricing Work"
        )
        chapter = NexverseChapter.objects.create(
            work=work,
            chapter_number=1,
            slug="pricing-chapter",
            title="Pricing Chapter",
            content="Chapter content",
            is_free_preview=free_preview,
        )
        return work, chapter

    def test_creator_can_set_update_and_deactivate_chapter_price(self):
        work, chapter = self._create_pricing_chapter()
        url = f"/api/v1/nexverse/creator/works/{work.id}/chapters/{chapter.id}/price/"

        created = self.client.put(
            url, {"amountMinor": 12500, "currency": "IDR"}, format="json"
        )
        self.assertEqual(created.status_code, 200)
        self.assertEqual(created.data["price"]["amountMinor"], 12500)
        self.assertEqual(NexverseChapterPrice.objects.filter(chapter=chapter).count(), 1)

        updated = self.client.put(
            url, {"amountMinor": 15000, "currency": "IDR"}, format="json"
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["price"]["amountMinor"], 15000)
        self.assertEqual(NexverseChapterPrice.objects.filter(chapter=chapter).count(), 1)

        removed = self.client.delete(url)
        self.assertEqual(removed.status_code, 200)
        self.assertFalse(NexverseChapterPrice.objects.get(chapter=chapter).is_active)

    def test_creator_cannot_price_free_preview_chapter(self):
        work, chapter = self._create_pricing_chapter(free_preview=True)
        response = self.client.put(
            f"/api/v1/nexverse/creator/works/{work.id}/chapters/{chapter.id}/price/",
            {"amountMinor": 10000, "currency": "IDR"},
            format="json",
        )
        self.assertEqual(response.status_code, 409)

    def test_creator_cannot_manage_another_authors_chapter_price(self):
        work, chapter = self._create_pricing_chapter(user=self.other_user)
        response = self.client.put(
            f"/api/v1/nexverse/creator/works/{work.id}/chapters/{chapter.id}/price/",
            {"amountMinor": 10000, "currency": "IDR"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_creator_price_rejects_invalid_amount_and_currency(self):
        work, chapter = self._create_pricing_chapter()
        url = f"/api/v1/nexverse/creator/works/{work.id}/chapters/{chapter.id}/price/"
        for payload in (
            {"amountMinor": 0, "currency": "IDR"},
            {"amountMinor": -1, "currency": "IDR"},
            {"amountMinor": True, "currency": "IDR"},
            {"amountMinor": 10000, "currency": "ID"},
        ):
            response = self.client.put(url, payload, format="json")
            self.assertEqual(response.status_code, 400)
