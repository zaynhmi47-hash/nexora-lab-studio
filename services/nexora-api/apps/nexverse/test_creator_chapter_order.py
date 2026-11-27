from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .models import NexverseAuthor, NexverseChapter, NexverseWork


class NexverseCreatorChapterOrderTests(APITestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create(
            email="chapter-order@example.test",
            status=NexoraUser.Status.ACTIVE,
        )
        author = NexverseAuthor.objects.create(
            user=self.user, slug="chapter-order-author", pen_name="Chapter Order"
        )
        self.work = NexverseWork.objects.create(
            author=author, slug="chapter-order-work", title="Chapter Order Work"
        )
        self.chapters = [
            NexverseChapter.objects.create(
                work=self.work,
                chapter_number=index,
                slug=f"chapter-{index}",
                title=f"Chapter {index}",
                content=f"Text {index}",
                status=NexverseChapter.Status.DRAFT,
            )
            for index in range(1, 4)
        ]
        self.client.force_authenticate(user=self.user)
        self.url = f"/api/v1/nexverse/creator/works/{self.work.id}/chapters/order/"

    def test_creator_can_reorder_all_draft_chapters_transactionally(self):
        response = self.client.put(
            self.url,
            {"chapterIds": [str(self.chapters[2].id), str(self.chapters[0].id), str(self.chapters[1].id)]},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            list(self.work.chapters.order_by("chapter_number").values_list("id", flat=True)),
            [self.chapters[2].id, self.chapters[0].id, self.chapters[1].id],
        )
        self.assertEqual(
            list(self.work.chapters.order_by("chapter_number").values_list("chapter_number", flat=True)),
            [1, 2, 3],
        )

    def test_reorder_requires_complete_unique_chapter_list(self):
        response = self.client.put(
            self.url,
            {"chapterIds": [str(self.chapters[0].id), str(self.chapters[0].id)]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_reorder_is_blocked_after_work_submission(self):
        self.work.review_status = NexverseWork.ReviewStatus.SUBMITTED
        self.work.save(update_fields=("review_status", "updated_at"))
        response = self.client.put(
            self.url,
            {"chapterIds": [str(ch.id) for ch in reversed(self.chapters)]},
            format="json",
        )
        self.assertEqual(response.status_code, 409)

    def test_another_creator_cannot_reorder_work_chapters(self):
        other = NexoraUser.objects.create(
            email="other-chapter-order@example.test",
            status=NexoraUser.Status.ACTIVE,
        )
        self.client.force_authenticate(user=other)
        response = self.client.put(
            self.url,
            {"chapterIds": [str(ch.id) for ch in reversed(self.chapters)]},
            format="json",
        )
        self.assertEqual(response.status_code, 404)
