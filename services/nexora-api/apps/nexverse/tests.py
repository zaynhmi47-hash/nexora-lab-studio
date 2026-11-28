from datetime import timedelta
from unittest.mock import patch

from django.core.management import call_command
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


    def test_creator_can_list_only_own_work_uploads_with_status_counts(self):
        created = self.post_upload({
            "assetType": "manuscript",
            "filename": "draft.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 1024,
        })
        self.assertEqual(created.status_code, 201)

        response = self.client.get(
            f"/api/v1/nexverse/creator/works/{self.work.id}/uploads/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["filename"], "draft.pdf")
        self.assertEqual(response.data["items"][0]["status"], "created")
        self.assertEqual(response.data["counts"]["created"], 1)
        self.assertEqual(response.data["counts"]["uploaded"], 0)

    def test_upload_library_supports_asset_type_filter(self):
        self.post_upload({
            "assetType": "cover",
            "filename": "cover.png",
            "contentType": "image/png",
            "sizeBytes": 1024,
        })
        self.post_upload({
            "assetType": "manuscript",
            "filename": "draft.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 2048,
        })

        response = self.client.get(
            f"/api/v1/nexverse/creator/works/{self.work.id}/uploads/?assetType=cover"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["assetType"], "cover")

    def test_upload_library_rejects_unknown_filters(self):
        response = self.client.get(
            f"/api/v1/nexverse/creator/works/{self.work.id}/uploads/?status=unknown"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "INVALID_UPLOAD_STATUS")



class NexverseAssetProcessingApiTests(APITestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create(
            email="processor@example.test",
            status=NexoraUser.Status.ACTIVE,
        )
        author = NexverseAuthor.objects.create(
            user=self.user,
            slug="processor",
            pen_name="Processor",
        )
        self.work = NexverseWork.objects.create(
            author=author,
            slug="processing-work",
            title="Processing Work",
        )
        self.client.force_authenticate(user=self.user)

    def make_uploaded_session(self, *, filename="chapter.txt", content_type="text/plain", data=b"Hello Nexverse"):
        return NexverseUploadSession.objects.create(
            work=self.work,
            owner=self.user,
            asset_type=NexverseUploadSession.AssetType.MANUSCRIPT,
            original_filename=filename,
            content_type=content_type,
            expected_size_bytes=len(data),
            uploaded_size_bytes=len(data),
            storage_path="nexverse/processor/uploads/test/" + filename,
            status=NexverseUploadSession.Status.UPLOADED,
            expires_at=timezone.now() + timedelta(minutes=10),
            uploaded_at=timezone.now(),
        )

    @patch("apps.nexverse.upload_api.FirebaseProviderRegistry")
    def test_valid_utf8_manuscript_becomes_ready_with_metadata(self, registry):
        data = b"Hello Nexverse\nThis is a chapter."
        session = self.make_uploaded_session(data=data)
        registry.return_value.storage.return_value.download.return_value = data

        response = self.client.post(
            f"/api/v1/nexverse/creator/uploads/{session.id}/process/",
            data={},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        session.refresh_from_db()
        self.assertEqual(session.status, NexverseUploadSession.Status.READY)
        self.assertEqual(session.processing_metadata["format"], "TXT")
        self.assertGreater(session.processing_metadata["words"], 0)
        self.assertIsNotNone(session.processed_at)

    @patch("apps.nexverse.upload_api.FirebaseProviderRegistry")
    def test_mime_spoofed_pdf_is_rejected_by_signature(self, registry):
        data = b"not a pdf file"
        session = self.make_uploaded_session(
            filename="chapter.pdf",
            content_type="application/pdf",
            data=data,
        )
        registry.return_value.storage.return_value.download.return_value = data

        response = self.client.post(
            f"/api/v1/nexverse/creator/uploads/{session.id}/process/",
            data={},
            format="json",
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data["code"], "ASSET_VALIDATION_FAILED")
        session.refresh_from_db()
        self.assertEqual(session.status, NexverseUploadSession.Status.REJECTED)

    @patch("apps.nexverse.upload_api.FirebaseProviderRegistry")
    def test_storage_failure_is_retryable(self, registry):
        session = self.make_uploaded_session()
        registry.return_value.storage.return_value.download.side_effect = RuntimeError("storage unavailable")

        response = self.client.post(
            f"/api/v1/nexverse/creator/uploads/{session.id}/process/",
            data={},
            format="json",
        )

        self.assertEqual(response.status_code, 503)
        session.refresh_from_db()
        self.assertEqual(session.status, NexverseUploadSession.Status.FAILED)
        self.assertTrue(session.processing_error)

    def test_other_user_cannot_process_asset(self):
        session = self.make_uploaded_session()
        other_user = NexoraUser.objects.create(
            email="intruder@example.test",
            status=NexoraUser.Status.ACTIVE,
        )
        self.client.force_authenticate(user=other_user)

        response = self.client.post(
            f"/api/v1/nexverse/creator/uploads/{session.id}/process/",
            data={},
            format="json",
        )

        self.assertEqual(response.status_code, 404)


class NexverseAssetProcessingClaimTests(APITestCase):
    def test_processing_session_cannot_be_claimed_again(self):
        user = NexoraUser.objects.create(
            email="processing-claim@example.test",
            status=NexoraUser.Status.ACTIVE,
        )
        author = NexverseAuthor.objects.create(
            user=user,
            slug="processing-claim",
            pen_name="Processing Claim",
        )
        work = NexverseWork.objects.create(
            author=author,
            slug="processing-claim-work",
            title="Processing Claim Work",
        )
        session = NexverseUploadSession.objects.create(
            work=work,
            owner=user,
            asset_type=NexverseUploadSession.AssetType.MANUSCRIPT,
            original_filename="chapter.txt",
            content_type="text/plain",
            expected_size_bytes=12,
            storage_path="nexverse/processing-claim/uploads/already-processing/chapter.txt",
            status=NexverseUploadSession.Status.PROCESSING,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            f"/api/v1/nexverse/creator/uploads/{session.id}/process/",
            data={},
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["code"], "ASSET_NOT_UPLOADED")
        session.refresh_from_db()
        self.assertEqual(session.status, NexverseUploadSession.Status.PROCESSING)


class NexverseUploadCleanupCommandTests(APITestCase):
    def test_cleanup_deletes_only_expired_upload_objects(self):
        user = NexoraUser.objects.create(
            email="cleanup@example.test",
            status=NexoraUser.Status.ACTIVE,
        )
        author = NexverseAuthor.objects.create(
            user=user,
            slug="cleanup-author",
            pen_name="Cleanup Author",
        )
        work = NexverseWork.objects.create(
            author=author,
            slug="cleanup-work",
            title="Cleanup Work",
        )
        old = timezone.now() - timedelta(hours=3)
        expired = NexverseUploadSession.objects.create(
            work=work,
            owner=user,
            asset_type=NexverseUploadSession.AssetType.MANUSCRIPT,
            original_filename="abandoned.pdf",
            content_type="application/pdf",
            expected_size_bytes=128,
            storage_path="nexverse/cleanup/uploads/expired/abandoned.pdf",
            status=NexverseUploadSession.Status.EXPIRED,
            expires_at=old,
        )
        NexverseUploadSession.objects.filter(pk=expired.pk).update(updated_at=old)
        uploaded = NexverseUploadSession.objects.create(
            work=work,
            owner=user,
            asset_type=NexverseUploadSession.AssetType.MANUSCRIPT,
            original_filename="verified.pdf",
            content_type="application/pdf",
            expected_size_bytes=128,
            storage_path="nexverse/cleanup/uploads/uploaded/verified.pdf",
            status=NexverseUploadSession.Status.UPLOADED,
            expires_at=old,
        )

        with patch("apps.nexverse.management.commands.cleanup_nexverse_uploads.FirebaseProviderRegistry") as registry:
            call_command("cleanup_nexverse_uploads")
        storage = registry.return_value.storage.return_value
        storage.delete.assert_called_once()
        deleted_reference = storage.delete.call_args.args[0]
        self.assertEqual(deleted_reference.namespace, "nexverse")
        self.assertIn("expired/abandoned.pdf", deleted_reference.key)
        expired.refresh_from_db()
        uploaded.refresh_from_db()
        self.assertEqual(expired.status, NexverseUploadSession.Status.EXPIRED)
        self.assertEqual(uploaded.status, NexverseUploadSession.Status.UPLOADED)
