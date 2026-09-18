from django.test import TestCase

from apps.identity.models import NexoraUser

from ..models import UmrahChecklistItem, UmrahStage
from ..services import UmrahService


class UmrahServiceTests(TestCase):
    def setUp(self):
        self.user = NexoraUser.objects.create()
        self.other_user = NexoraUser.objects.create()
        stage = UmrahStage.objects.create(key="learn", title="Learn", sort_order=0)
        self.item = UmrahChecklistItem.objects.create(
            key="rites", stage=stage, title="Study the rites", sort_order=0, required=True
        )
        UmrahChecklistItem.objects.create(
            key="packing", stage=stage, title="Prepare essentials", sort_order=1
        )

    def test_journey_is_user_scoped(self):
        first = UmrahService.get_journey(self.user)
        self.assertEqual(first["overallProgress"], 0)
        UmrahService.toggle_checklist(self.user, "rites")
        mine = UmrahService.get_journey(self.user)
        theirs = UmrahService.get_journey(self.other_user)
        self.assertEqual(mine["checklist"][0]["completed"], True)
        self.assertEqual(theirs["checklist"][0]["completed"], False)

    def test_toggle_is_idempotently_reversible(self):
        first = UmrahService.toggle_checklist(self.user, "rites")
        self.assertEqual(first["overallProgress"], 0.5)
        second = UmrahService.toggle_checklist(self.user, "rites")
        self.assertEqual(second["overallProgress"], 0)
