from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .models import (
    NexverseAuthor,
    NexverseChapter,
    NexverseModerator,
    NexverseReviewEvent,
    NexverseWork,
)


class NexverseModerationApiTests(APITestCase):
    def setUp(self):
        self.moderator_user = NexoraUser.objects.create(
            email="moderator@example.test", status=NexoraUser.Status.ACTIVE
        )
        self.writer_user = NexoraUser.objects.create(
            email="writer-moderation@example.test", status=NexoraUser.Status.ACTIVE
        )
        self.author = NexverseAuthor.objects.create(
            user=self.writer_user, slug="moderation-writer", pen_name="Moderation Writer"
        )
        self.work = NexverseWork.objects.create(
            author=self.author,
            slug="submitted-work",
            title="Submitted Work",
            synopsis="A synopsis for review.",
            review_status=NexverseWork.ReviewStatus.SUBMITTED,
        )
        self.chapter = NexverseChapter.objects.create(
            work=self.work,
            chapter_number=1,
            slug="opening-chapter",
            title="Opening Chapter",
            content="The complete manuscript content.",
        )
        self.client.force_authenticate(user=self.moderator_user)

    def test_user_without_moderator_assignment_cannot_open_queue(self):
        response = self.client.get("/api/v1/nexverse/moderation/queue/")
        self.assertEqual(response.status_code, 403)

    def test_active_moderator_can_view_queue_and_manuscript(self):
        NexverseModerator.objects.create(user=self.moderator_user)
        queue = self.client.get("/api/v1/nexverse/moderation/queue/")
        self.assertEqual(queue.status_code, 200)
        self.assertEqual(queue.data["pagination"]["totalItems"], 1)
        detail = self.client.get(
            f"/api/v1/nexverse/moderation/works/{self.work.id}/"
        )
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["chapters"][0]["content"], "The complete manuscript content.")

    def test_approval_publishes_work_and_chapters_and_records_audit(self):
        moderator = NexverseModerator.objects.create(
            user=self.moderator_user, role=NexverseModerator.Role.PUBLISHER
        )
        response = self.client.post(
            f"/api/v1/nexverse/moderation/works/{self.work.id}/decision/",
            {"decision": "approve", "note": "Ready for publication."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.work.refresh_from_db()
        self.chapter.refresh_from_db()
        self.assertEqual(self.work.review_status, NexverseWork.ReviewStatus.APPROVED)
        self.assertEqual(self.work.status, NexverseWork.Status.PUBLISHED)
        self.assertEqual(self.chapter.status, NexverseChapter.Status.PUBLISHED)
        self.assertEqual(self.work.reviewed_by_id, self.moderator_user.id)
        self.assertTrue(
            NexverseReviewEvent.objects.filter(
                work=self.work,
                moderator=moderator,
                decision=NexverseReviewEvent.Decision.APPROVED,
            ).exists()
        )

    def test_rejection_requires_note_and_keeps_work_unpublished(self):
        NexverseModerator.objects.create(user=self.moderator_user)
        missing_note = self.client.post(
            f"/api/v1/nexverse/moderation/works/{self.work.id}/decision/",
            {"decision": "reject"},
            format="json",
        )
        self.assertEqual(missing_note.status_code, 400)
        rejected = self.client.post(
            f"/api/v1/nexverse/moderation/works/{self.work.id}/decision/",
            {"decision": "reject", "note": "Please revise the ending."},
            format="json",
        )
        self.assertEqual(rejected.status_code, 200)
        self.work.refresh_from_db()
        self.assertEqual(self.work.review_status, NexverseWork.ReviewStatus.REJECTED)
        self.assertEqual(self.work.status, NexverseWork.Status.DRAFT)
        self.assertEqual(self.work.review_note, "Please revise the ending.")
