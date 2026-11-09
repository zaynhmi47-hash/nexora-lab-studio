from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .models import NexverseAuthor, NexverseWork


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
