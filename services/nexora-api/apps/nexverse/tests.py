from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.identity.models import IdentityProviderAccount, NexoraUser
from .assets import NexverseUploadSession
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
            review_status=NexverseWork.ReviewStatus.APPROVED,
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
        NexverseWork.objects.create(
            author=self.work.author,
            slug="unreviewed-published-work",
            title="Unreviewed Published Work",
            status=NexverseWork.Status.PUBLISHED,
            visibility=NexverseWork.Visibility.PUBLIC,
            review_status=NexverseWork.ReviewStatus.DRAFT,
        )
        response = self.client.get("/api/v1/nexverse/works/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["slug"], "test-work")

    def test_catalog_search_matches_author_pen_name(self):
        response = self.client.get("/api/v1/nexverse/works/?q=Writer")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["slug"] for item in response.data["items"]], ["test-work"])

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



class NexverseUploadSessionApiTests(APITestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create(
            email="creator@example.test",
            status=NexoraUser.Status.ACTIVE,
        )
        IdentityProviderAccount.objects.create(
            user=self.user,
            provider="firebase",
            provider_subject="firebase-test-uid",
        )
        author = NexverseAuthor.objects.create(
            user=self.user,
            slug="creator-test",
            pen_name="Creator Test",
        )
        self.work = NexverseWork.objects.create(
            author=author,
            slug="draft-work-test",
            title="Draft Work",
            synopsis="A test synopsis.",
        )
        self.client.force_authenticate(user=self.user)

    def post_upload(self, payload):
        return self.client.post(
            f"/api/v1/nexverse/creator/works/{self.work.id}/uploads/",
            data=payload,
            format="json",
        )

    def test_creator_can_create_private_pdf_upload_session(self):
        response = self.post_upload({
            "assetType": "manuscript",
            "filename": "draft.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 1024,
        })

        self.assertEqual(response.status_code, 201)
        session = NexverseUploadSession.objects.get(pk=response.data["id"])
        self.assertEqual(session.owner, self.user)
        self.assertEqual(session.status, NexverseUploadSession.Status.CREATED)
        self.assertTrue(session.storage_path.startswith(
            "nexverse/firebase-test-uid/uploads/"
        ))

    def test_rejects_extension_and_mime_type_mismatch(self):
        response = self.post_upload({
            "assetType": "manuscript",
            "filename": "draft.pdf",
            "contentType": "image/png",
            "sizeBytes": 1024,
        })

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "UNSUPPORTED_FILE_TYPE")
        self.assertEqual(NexverseUploadSession.objects.count(), 0)

    def test_rejects_upload_larger_than_limit(self):
        response = self.post_upload({
            "assetType": "manuscript",
            "filename": "draft.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 50 * 1024 * 1024 + 1,
        })

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "FILE_SIZE_LIMIT")

    def test_limits_active_upload_sessions_per_creator(self):
        for index in range(5):
            NexverseUploadSession.objects.create(
                work=self.work,
                owner=self.user,
                asset_type=NexverseUploadSession.AssetType.MANUSCRIPT,
                original_filename=f"existing-{index}.pdf",
                content_type="application/pdf",
                expected_size_bytes=1024,
                storage_path=f"nexverse/firebase-test-uid/uploads/{index}/existing.pdf",
                expires_at=timezone.now() + timedelta(minutes=10),
            )

        response = self.post_upload({
            "assetType": "manuscript",
            "filename": "new.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 1024,
        })

        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.data["code"], "ACTIVE_UPLOAD_LIMIT")
        self.assertEqual(NexverseUploadSession.objects.count(), 5)

    def test_other_user_cannot_create_session_for_work(self):
        other_user = NexoraUser.objects.create(
            email="other@example.test",
            status=NexoraUser.Status.ACTIVE,
        )
        self.client.force_authenticate(user=other_user)
        response = self.post_upload({
            "assetType": "manuscript",
            "filename": "draft.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 1024,
        })

        self.assertEqual(response.status_code, 404)
