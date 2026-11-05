import datetime

import pytest
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.dating_social_professional.interactions_api import DatingMomentCommentsView, DatingMomentReactionView
from apps.dating_social_professional.models import DatingMoment, DatingMomentComment, DatingMomentReaction, DatingProfile
from apps.identity.models import NexoraUser


@pytest.mark.django_db
def test_moment_like_is_idempotent_and_unlike_is_soft_deleted():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Member")
    DatingProfile.objects.create(user=user, display_name="Member", birth_date=datetime.date(1998, 1, 1))
    moment = DatingMoment.objects.create(author=user, caption="A moment")
    factory = APIRequestFactory()

    first = factory.post(f"/api/v1/dating/moments/{moment.id}/reactions/")
    force_authenticate(first, user=user)
    first_response = DatingMomentReactionView.as_view()(first, moment_id=moment.id)
    second = factory.post(f"/api/v1/dating/moments/{moment.id}/reactions/")
    force_authenticate(second, user=user)
    second_response = DatingMomentReactionView.as_view()(second, moment_id=moment.id)
    assert first_response.status_code == 201
    assert second_response.status_code == 200
    assert DatingMomentReaction.objects.filter(moment=moment, user=user).count() == 1

    unlike = factory.delete(f"/api/v1/dating/moments/{moment.id}/reactions/")
    force_authenticate(unlike, user=user)
    assert DatingMomentReactionView.as_view()(unlike, moment_id=moment.id).status_code == 200
    assert DatingMomentReaction.objects.filter(moment=moment, user=user).count() == 0


@pytest.mark.django_db
def test_moment_comment_and_reply_are_scoped_to_same_moment():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, display_name="Member")
    DatingProfile.objects.create(user=user, display_name="Member", birth_date=datetime.date(1998, 1, 1))
    moment = DatingMoment.objects.create(author=user, caption="A moment")
    other_moment = DatingMoment.objects.create(author=user, caption="Another moment")
    factory = APIRequestFactory()

    create = factory.post(f"/api/v1/dating/moments/{moment.id}/comments/", {"body": "First comment"}, format="json")
    force_authenticate(create, user=user)
    created = DatingMomentCommentsView.as_view()(create, moment_id=moment.id)
    assert created.status_code == 201

    reply = factory.post(f"/api/v1/dating/moments/{moment.id}/comments/", {"body": "A reply", "parent_id": created.data["id"]}, format="json")
    force_authenticate(reply, user=user)
    assert DatingMomentCommentsView.as_view()(reply, moment_id=moment.id).status_code == 201

    invalid = factory.post(f"/api/v1/dating/moments/{other_moment.id}/comments/", {"body": "Wrong thread", "parent_id": created.data["id"]}, format="json")
    force_authenticate(invalid, user=user)
    assert DatingMomentCommentsView.as_view()(invalid, moment_id=other_moment.id).status_code == 400
