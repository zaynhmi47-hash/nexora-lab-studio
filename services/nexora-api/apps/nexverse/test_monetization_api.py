from rest_framework.test import APITestCase

from apps.identity.models import NexoraUser
from .models import (
    NexverseAuthor,
    NexverseChapter,
    NexverseChapterPrice,
    NexverseEntitlement,
    NexversePurchase,
    NexverseWork,
)
from .monetization import confirm_verified_purchase, revoke_refunded_purchase


class NexverseMonetizationApiTests(APITestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create(
            email="premium-reader@example.test", status=NexoraUser.Status.ACTIVE
        )
        author_user = NexoraUser.objects.create(
            email="premium-author@example.test", status=NexoraUser.Status.ACTIVE
        )
        self.author_user = author_user
        author = NexverseAuthor.objects.create(
            user=author_user, slug="premium-author", pen_name="Premium Author"
        )
        self.work = NexverseWork.objects.create(
            author=author,
            slug="premium-work",
            title="Premium Work",
            status=NexverseWork.Status.PUBLISHED,
            review_status=NexverseWork.ReviewStatus.APPROVED,
            visibility=NexverseWork.Visibility.PUBLIC,
        )
        self.chapter = NexverseChapter.objects.create(
            work=self.work,
            chapter_number=1,
            slug="premium-chapter",
            title="Premium Chapter",
            content="Paid content is protected.",
            is_free_preview=False,
            status=NexverseChapter.Status.PUBLISHED,
        )
        self.price = NexverseChapterPrice.objects.create(
            chapter=self.chapter, currency="IDR", amount_minor=12500
        )
        self.client.force_authenticate(user=self.user)
        self.purchase_url = "/api/v1/nexverse/reader/purchases/"
        self.content_url = (
            f"/api/v1/nexverse/works/{self.work.slug}/chapters/{self.chapter.id}/"
        )

    def create_purchase_intent(self, key="premium-intent-001"):
        return self.client.post(
            self.purchase_url,
            {"chapterId": str(self.chapter.id)},
            format="json",
            HTTP_IDEMPOTENCY_KEY=key,
        )

    def test_purchase_intent_uses_server_price_and_starts_pending(self):
        response = self.create_purchase_intent()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["item"]["amountMinor"], 12500)
        self.assertEqual(response.data["item"]["currency"], "IDR")
        self.assertEqual(response.data["item"]["status"], NexversePurchase.Status.PENDING)
        self.assertEqual(NexversePurchase.objects.count(), 1)

    def test_purchase_intent_is_idempotent(self):
        first = self.create_purchase_intent()
        second = self.create_purchase_intent()
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["item"]["id"], second.data["item"]["id"])
        self.assertEqual(NexversePurchase.objects.count(), 1)

    def test_idempotency_key_cannot_be_reused_for_another_chapter(self):
        first = self.create_purchase_intent()
        other = NexverseChapter.objects.create(
            work=self.work,
            chapter_number=2,
            slug="another-paid-chapter",
            title="Another Paid Chapter",
            content="Another premium chapter.",
            is_free_preview=False,
            status=NexverseChapter.Status.PUBLISHED,
        )
        NexverseChapterPrice.objects.create(
            chapter=other, currency="IDR", amount_minor=15000
        )
        second = self.client.post(
            self.purchase_url,
            {"chapterId": str(other.id)},
            format="json",
            HTTP_IDEMPOTENCY_KEY="premium-intent-001",
        )
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 409)

    def test_pending_purchase_does_not_grant_paid_content(self):
        self.create_purchase_intent()
        response = self.client.get(self.content_url)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "ENTITLEMENT_REQUIRED")

    def test_verified_payment_grants_entitlement_and_is_idempotent(self):
        created = self.create_purchase_intent()
        purchase_id = created.data["item"]["id"]
        entitlement = confirm_verified_purchase(
            purchase_id=purchase_id,
            provider="test-gateway",
            provider_reference="txn-verified-001",
        )
        replay = confirm_verified_purchase(
            purchase_id=purchase_id,
            provider="test-gateway",
            provider_reference="txn-verified-001",
        )
        self.assertEqual(entitlement.id, replay.id)
        self.assertEqual(NexverseEntitlement.objects.count(), 1)
        response = self.client.get(self.content_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["content"], "Paid content is protected.")

    def test_refund_revokes_entitlement_and_locks_content_again(self):
        created = self.create_purchase_intent()
        purchase_id = created.data["item"]["id"]
        confirm_verified_purchase(
            purchase_id=purchase_id,
            provider="test-gateway",
            provider_reference="txn-refund-001",
        )
        self.assertTrue(revoke_refunded_purchase(purchase_id=purchase_id))
        self.assertFalse(revoke_refunded_purchase(purchase_id=purchase_id))
        response = self.client.get(self.content_url)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            NexverseEntitlement.objects.get(purchase_id=purchase_id).status,
            NexverseEntitlement.Status.REVOKED,
        )

    def test_offers_expose_active_server_price(self):
        response = self.client.get(
            f"/api/v1/nexverse/reader/offers/?workId={self.work.id}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["items"][0]["amountMinor"], 12500)

    def test_creator_earnings_are_recorded_and_refunds_are_reversed(self):
        created = self.create_purchase_intent()
        purchase_id = created.data["item"]["id"]
        confirm_verified_purchase(
            purchase_id=purchase_id,
            provider="test-gateway",
            provider_reference="txn-earnings-001",
        )
        self.client.force_authenticate(user=self.author_user)
        earnings = self.client.get("/api/v1/nexverse/creator/earnings/")
        self.assertEqual(earnings.status_code, 200)
        self.assertEqual(earnings.data["totals"][0]["creditedMinor"], 12500)
        self.assertEqual(earnings.data["totals"][0]["reversedMinor"], 0)
        self.assertEqual(len(earnings.data["items"]), 1)

        revoke_refunded_purchase(purchase_id=purchase_id)
        earnings = self.client.get("/api/v1/nexverse/creator/earnings/")
        self.assertEqual(earnings.data["totals"][0]["creditedMinor"], 12500)
        self.assertEqual(earnings.data["totals"][0]["reversedMinor"], 12500)
        self.assertEqual(len(earnings.data["items"]), 2)

    def test_creator_cannot_see_another_authors_earnings(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get("/api/v1/nexverse/creator/earnings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["items"], [])

    def test_purchase_history_is_scoped_to_current_account(self):
        self.create_purchase_intent()
        other = NexoraUser.objects.create(
            email="another-premium-reader@example.test",
            status=NexoraUser.Status.ACTIVE,
        )
        self.client.force_authenticate(user=other)
        response = self.client.get(self.purchase_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["items"], [])
