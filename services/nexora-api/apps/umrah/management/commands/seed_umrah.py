from django.core.management.base import BaseCommand
from django.db import transaction

from apps.umrah.models import UmrahChecklistItem, UmrahStage


STAGES = [
    ("learn", "Learn", "Understand the rites and sequence before travel."),
    ("prepare", "Prepare", "Organize documents, health, packing, and contacts."),
    ("travel", "Travel", "Keep your itinerary, companions, and offline information ready."),
    ("journey", "Journey", "Use the checklist as a preparation aid during the journey."),
    ("continue", "Continue", "Reflect after returning and maintain good habits."),
]

ITEMS = [
    ("passport", "learn", "Review passport validity", "Check travel document validity.", True),
    ("rites", "learn", "Study the Umrah sequence", "Review the major rites and their order.", True),
    ("health", "prepare", "Review health preparation", "Check current official health requirements.", True),
    ("packing", "prepare", "Prepare essential items", "Prepare clothing, medication, documents, and essentials.", False),
    ("contacts", "prepare", "Save important contacts", "Keep accommodation and emergency contacts available.", True),
    ("itinerary", "travel", "Review itinerary", "Keep transport and accommodation details accessible.", True),
    ("offline", "travel", "Prepare offline information", "Keep essential information available without connectivity.", False),
    ("miqat", "journey", "Review miqat guidance", "Review qualified guidance before the journey.", True),
    ("ihram", "journey", "Review ihram guidance", "Review qualified guidance for ihram.", True),
    ("checkpoints", "journey", "Review journey checkpoints", "Use your itinerary and trusted guidance.", False),
    ("reflection", "continue", "Record a reflection", "Capture useful lessons after returning.", False),
    ("consistency", "continue", "Continue good habits", "Choose sustainable habits after the journey.", False),
]


class Command(BaseCommand):
    help = "Seed the Umrah journey catalog."

    @transaction.atomic
    def handle(self, *args, **options):
        stage_map = {}
        for order, (key, title, description) in enumerate(STAGES):
            stage, _ = UmrahStage.objects.update_or_create(
                key=key,
                defaults={
                    "title": title,
                    "description": description,
                    "sort_order": order,
                    "is_published": True,
                    "deleted_at": None,
                },
            )
            stage_map[key] = stage

        stage_orders = {key: 0 for key, _, _ in STAGES}
        for key, stage_key, title, description, required in ITEMS:
            order = stage_orders[stage_key]
            UmrahChecklistItem.objects.update_or_create(
                key=key,
                defaults={
                    "stage": stage_map[stage_key],
                    "title": title,
                    "description": description,
                    "required": required,
                    "sort_order": order,
                    "deleted_at": None,
                },
            )
            stage_orders[stage_key] += 1

        self.stdout.write(self.style.SUCCESS("Umrah journey catalog seeded successfully."))
