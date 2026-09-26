from datetime import date

from django.db import IntegrityError, transaction
from django.db.models import Q

from apps.identity.models import NexoraUser

from .models import DatingBlock, DatingMatch, DatingProfile, DatingReport, DatingSwipe


class DatingSafetyService:
    @staticmethod
    @transaction.atomic
    def block(*, actor: NexoraUser, target: NexoraUser) -> DatingBlock:
        if actor.id == target.id:
            raise ValueError("A user cannot block themselves.")
        block, _ = DatingBlock.objects.get_or_create(blocker=actor, blocked=target)
        DatingMatch.objects.filter(Q(user_a=actor, user_b=target) | Q(user_a=target, user_b=actor)).update(active=False)
        return block

    @staticmethod
    def report(*, actor: NexoraUser, target: NexoraUser, reason: str, details: str = "") -> DatingReport:
        if actor.id == target.id:
            raise ValueError("A user cannot report themselves.")
        return DatingReport.objects.create(reporter=actor, reported=target, reason=reason, details=details)


class DatingSwipeService:
    @staticmethod
    @transaction.atomic
    def record(*, actor: NexoraUser, target_profile: DatingProfile, action: str) -> tuple[DatingSwipe, DatingMatch | None]:
        if target_profile.user_id == actor.id:
            raise ValueError("A user cannot swipe on their own profile.")
        if DatingBlock.objects.filter(Q(blocker=actor, blocked=target_profile.user) | Q(blocker=target_profile.user, blocked=actor)).exists():
            raise ValueError("This profile is unavailable.")

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
    actor_profile = DatingProfile.objects.filter(user=actor).first()
    excluded = DatingSwipe.objects.filter(actor=actor).values_list("target_id", flat=True)
    blocked_ids = set(DatingBlock.objects.filter(Q(blocker=actor) | Q(blocked=actor)).values_list("blocker_id", flat=True)) | set(DatingBlock.objects.filter(Q(blocker=actor) | Q(blocked=actor)).values_list("blocked_id", flat=True))
    queryset = (
        DatingProfile.objects.filter(discovery_enabled=True)
        .exclude(user=actor)
        .exclude(user_id__in=blocked_ids)
        .exclude(id__in=excluded)
        .exclude(user__status__in=[NexoraUser.Status.SUSPENDED, NexoraUser.Status.DISABLED, NexoraUser.Status.DELETED])
        .order_by("-updated_at")
    )
    if actor_profile:
        today = date.today()
        latest_birth_date = today.replace(year=today.year - actor_profile.preferred_min_age)
        earliest_birth_date = today.replace(year=today.year - actor_profile.preferred_max_age - 1)
        queryset = queryset.filter(birth_date__gt=earliest_birth_date, birth_date__lte=latest_birth_date)
        if actor_profile.relationship_intent:
            queryset = queryset.filter(relationship_intent=actor_profile.relationship_intent)
    return queryset[:limit]
