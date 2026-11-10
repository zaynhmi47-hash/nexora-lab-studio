from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .models import NexverseAuthor, NexverseBookmark, NexverseWork


class NexverseBookmarkApiTests(APITestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create(
            email="bookmark-reader@example.test", status=NexoraUser.Status.ACTIVE
        )
        author_user = NexoraUser.objects.create(
            email="bookmark-author@example.test", status=NexoraUser.Status.ACTIVE
        )
        author = NexverseAuthor.objects.create(
            user=author_user, slug="bookmark-author", pen_name="Bookmark Author"
        )
        self.work = NexverseWork.objects.create(
            author=author,
            slug="bookmark-work",
            title="Bookmark Work",
            status=NexverseWork.Status.PUBLISHED,
            review_status=NexverseWork.ReviewStatus.APPROVED,
            visibility=NexverseWork.Visibility.PUBLIC,
        )
        self.client.force_authenticate(user=self.user)
        self.detail_url = f"/api/v1/nexverse/reader/bookmarks/{self.work.id}/"

    def test_reader_can_add_list_and_remove_bookmark(self):
        added = self.client.post(self.detail_url, {}, format="json")
        self.assertEqual(added.status_code, 201)
        self.assertTrue(added.data["bookmarked"])
        listed = self.client.get("/api/v1/nexverse/reader/bookmarks/")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.data["items"][0]["workId"], str(self.work.id))
        removed = self.client.delete(self.detail_url)
        self.assertEqual(removed.status_code, 200)
        self.assertFalse(removed.data["bookmarked"])
        self.assertEqual(NexverseBookmark.objects.count(), 0)

    def test_bookmark_creation_is_idempotent(self):
        first = self.client.post(self.detail_url, {}, format="json")
        second = self.client.post(self.detail_url, {}, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(NexverseBookmark.objects.count(), 1)

    def test_bookmarks_are_private_to_the_account(self):
        self.client.post(self.detail_url, {}, format="json")
        other = NexoraUser.objects.create(
            email="different-bookmark-reader@example.test", status=NexoraUser.Status.ACTIVE
        )
        self.client.force_authenticate(user=other)
        listed = self.client.get("/api/v1/nexverse/reader/bookmarks/")
        self.assertEqual(listed.data["items"], [])
