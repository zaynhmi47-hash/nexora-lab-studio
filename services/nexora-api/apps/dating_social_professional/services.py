from django.db import IntegrityError, transaction

from apps.identity.models import NexoraUser

from .models import DatingMatch, DatingProfile, DatingSwipe


class DatingSwipeService:
    @staticmethod
    @transaction.atomic
    def record(*, actor: NexoraUser, target_profile: DatingProfile, action: str) -> tuple[DatingSwipe, DatingMatch | None]:
        if target_profile.user_id == actor.id:
            raise ValueError("A user cannot swipe on their own profile.")

        swipe, _ = DatingSwipe.objects.get_or_create(
            actor=actor,
            target=target_profile,
            defaults={"action": action},
        )
        if swipe.action != action:
            swipe.action = action
            swipe.save(update_fields=["action", "updated_at"])

        if action != DatingSwipe.Action.LIKE:
            return swipe, None

        reciprocal = DatingSwipe.objects.filter(
            actor=target_profile.user,
            target__user=actor,
            action=DatingSwipe.Action.LIKE,
        ).exists()
        if not reciprocal:
            return swipe, None

        first, second = sorted((actor.id, target_profile.user_id), key=str)
        try:
            with transaction.atomic():
                match, _ = DatingMatch.objects.get_or_create(user_a_id=first, user_b_id=second)
        except IntegrityError:
            match = DatingMatch.objects.get(user_a_id=first, user_b_id=second)
        return swipe, match


def discovery_for(actor: NexoraUser, limit: int = 20):
    excluded = DatingSwipe.objects.filter(actor=actor).values_list("target_id", flat=True)
    return (
        DatingProfile.objects.filter(discovery_enabled=True)
        .exclude(user=actor)
        .exclude(id__in=excluded)
        .exclude(user__status__in=[NexoraUser.Status.SUSPENDED, NexoraUser.Status.DISABLED, NexoraUser.Status.DELETED])
        .order_by("-updated_at")[:limit]
    )
