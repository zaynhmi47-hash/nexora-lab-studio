import datetime

import pytest

from apps.dating_social_professional.models import DatingProfile, DatingSwipe
from apps.dating_social_professional.services import DatingSwipeService
from apps.identity.models import NexoraUser


@pytest.mark.django_db
def test_like_is_idempotent_for_same_actor_and_target():
    actor = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Actor")
    target_user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Target")
    target = DatingProfile.objects.create(
        user=target_user,
        display_name="Target",
        birth_date=datetime.date(2000, 1, 1),
    )

    first, first_match = DatingSwipeService.record(
        actor=actor, target_profile=target, action=DatingSwipe.Action.LIKE
    )
    second, second_match = DatingSwipeService.record(
        actor=actor, target_profile=target, action=DatingSwipe.Action.LIKE
    )

    assert first.id == second.id
    assert first_match is None
    assert second_match is None
    assert DatingSwipe.objects.filter(actor=actor, target=target).count() == 1


@pytest.mark.django_db
def test_reciprocal_likes_create_one_match():
    user_a = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="A")
    user_b = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="B")
    profile_a = DatingProfile.objects.create(user=user_a, display_name="A")
    profile_b = DatingProfile.objects.create(user=user_b, display_name="B")

    _, first_match = DatingSwipeService.record(
        actor=user_a, target_profile=profile_b, action=DatingSwipe.Action.LIKE
    )
    _, second_match = DatingSwipeService.record(
        actor=user_b, target_profile=profile_a, action=DatingSwipe.Action.LIKE
    )

    assert first_match is None
    assert second_match is not None
    assert second_match.user_a_id == min(user_a.id, user_b.id)
    assert second_match.user_b_id == max(user_a.id, user_b.id)


@pytest.mark.django_db
def test_user_cannot_swipe_on_own_profile():
    actor = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Actor")
    profile = DatingProfile.objects.create(user=actor, display_name="Actor")

    with pytest.raises(ValueError, match="own profile"):
        DatingSwipeService.record(
            actor=actor, target_profile=profile, action=DatingSwipe.Action.LIKE
        )
