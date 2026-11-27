from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .assets import NexverseUploadSession
from .models import NexverseAuthor, NexverseChapter, NexverseWork


class NexverseManuscriptPipelineTests(APITestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create(email="pipeline@example.test", status=NexoraUser.Status.ACTIVE)
        author = NexverseAuthor.objects.create(user=self.user, slug="pipeline-author", pen_name="Pipeline")
        self.work = NexverseWork.objects.create(author=author, slug="pipeline-work", title="Pipeline Work")
        self.session = NexverseUploadSession.objects.create(
            work=self.work,
            owner=self.user,
            asset_type=NexverseUploadSession.AssetType.MANUSCRIPT,
            original_filename="manuscript.txt",
            content_type="text/plain",
            expected_size_bytes=len(b"BAB 1\\nAwal cerita.\\n\\nBAB 2\\nLanjutan cerita."),
            uploaded_size_bytes=len(b"BAB 1\\nAwal cerita.\\n\\nBAB 2\\nLanjutan cerita."),
            storage_path="nexverse/pipeline/uploads/manuscript.txt",
            status=NexverseUploadSession.Status.READY,
            expires_at=timezone.now() + timedelta(minutes=10),
            uploaded_at=timezone.now(),
            processing_metadata={"format": "TXT"},
        )
        self.client.force_authenticate(user=self.user)
        self.data = b"BAB 1\nAwal cerita.\n\nBAB 2\nLanjutan cerita."

    @patch("apps.nexverse.manuscript_pipeline.FirebaseProviderRegistry")
    def test_extracts_txt_sections_as_reviewable_proposals(self, registry):
        registry.return_value.storage.return_value.download.return_value = self.data
        response = self.client.get(
            f"/api/v1/nexverse/creator/uploads/{self.session.id}/extract/"
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["totalChapters"], 2)
        self.assertEqual(response.data["proposals"][0]["title"], "BAB 1")
        self.assertIn("Awal cerita", response.data["proposals"][0]["content"])
        self.assertEqual(self.work.chapters.count(), 0)

    @patch("apps.nexverse.manuscript_pipeline.FirebaseProviderRegistry")
    def test_creator_explicitly_imports_chapters_as_drafts_idempotently(self, registry):
        registry.return_value.storage.return_value.download.return_value = self.data
        extracted = self.client.get(
            f"/api/v1/nexverse/creator/uploads/{self.session.id}/extract/"
        )
        proposals = [
            {"title": item["title"], "content": item["content"]}
            for item in extracted.data["proposals"]
        ]
        url = f"/api/v1/nexverse/creator/uploads/{self.session.id}/chapters/"
        response = self.client.post(url, {"chapters": proposals}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.work.chapters.count(), 2)
        self.assertTrue(all(ch.status == NexverseChapter.Status.DRAFT for ch in self.work.chapters.all()))

        repeated = self.client.post(url, {"chapters": proposals}, format="json")
        self.assertEqual(repeated.status_code, 200)
        self.assertTrue(repeated.data["alreadyImported"])
        self.assertEqual(self.work.chapters.count(), 2)

    def test_another_user_cannot_extract_private_manuscript(self):
        other = NexoraUser.objects.create(email="intruder-pipeline@example.test", status=NexoraUser.Status.ACTIVE)
        self.client.force_authenticate(user=other)
        response = self.client.get(
            f"/api/v1/nexverse/creator/uploads/{self.session.id}/extract/"
        )
        self.assertEqual(response.status_code, 404)

    def test_pdf_extraction_is_explicitly_unavailable(self):
        self.session.content_type = "application/pdf"
        self.session.original_filename = "manuscript.pdf"
        self.session.save(update_fields=("content_type", "original_filename", "updated_at"))
        response = self.client.get(
            f"/api/v1/nexverse/creator/uploads/{self.session.id}/extract/"
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.data["code"], "PDF_EXTRACTION_UNAVAILABLE")
