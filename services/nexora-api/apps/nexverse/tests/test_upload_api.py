from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.identity.models import IdentityProviderAccount, NexoraUser
from apps.nexverse.assets import NexverseUploadSession
from apps.nexverse.models import NexverseAuthor, NexverseWork
from apps.nexverse.upload_api import NexverseUploadSessionListCreateView


class NexverseUploadSessionApiTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = NexoraUser.objects.create(email="creator@example.test")
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

    def post_upload(self, payload, user=None):
        request = self.factory.post(
            f"/api/v1/nexverse/creator/works/{self.work.id}/uploads/",
            payload,
            format="json",
        )
        force_authenticate(request, user=user or self.user)
        return NexverseUploadSessionListCreateView.as_view()(
            request, work_id=self.work.id
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

    def test_other_user_cannot_create_session_for_work(self):
        other_user = NexoraUser.objects.create(email="other@example.test")
        response = self.post_upload({
            "assetType": "manuscript",
            "filename": "draft.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 1024,
        }, user=other_user)

        self.assertEqual(response.status_code, 404)
