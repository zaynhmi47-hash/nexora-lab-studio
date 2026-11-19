from datetime import timedelta

import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from apps.health.models import HealthAccessAuditEvent, HealthConsent, HealthProfile, HealthProfileMember
from apps.health.services.access import can_access_profile
from apps.health.services.access_grants import grant_profile_access, revoke_profile_access
from apps.identity.models import NexoraUser


def make_user(email):
    return NexoraUser.objects.create(email=email, status=NexoraUser.Status.ACTIVE)


@pytest.mark.django_db
def test_owner_can_grant_scoped_access_and_event_is_recorded():
    owner = make_user("owner@example.com")
    caregiver = make_user("caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="My Health")

    member, consent = grant_profile_access(
        actor=owner, profile_id=profile.pk, grantee_id=caregiver.pk,
        scopes=["records.read", "vitals.read"], role=HealthProfileMember.Role.CAREGIVER,
        policy_version="health-consent-v1",
    )

    assert member.user_id == caregiver.pk
    assert consent.scopes == ["records.read", "vitals.read"]
    assert can_access_profile(actor=caregiver, profile=profile, scope="records.read")
    assert not can_access_profile(actor=caregiver, profile=profile, scope="records.write")
    event = HealthAccessAuditEvent.objects.get(profile=profile)
    assert event.action == HealthAccessAuditEvent.Action.ACCESS_GRANTED
    assert event.actor_id == owner.pk
    assert event.grantee_id == caregiver.pk
    assert event.policy_version == "health-consent-v1"


@pytest.mark.django_db
def test_non_owner_cannot_grant_access():
    owner = make_user("owner@example.com")
    stranger = make_user("stranger@example.com")
    caregiver = make_user("caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private Health")

    with pytest.raises(PermissionDenied):
        grant_profile_access(
            actor=stranger, profile_id=profile.pk, grantee_id=caregiver.pk,
            scopes=["records.read"], policy_version="v1",
        )
    assert HealthProfileMember.objects.count() == 0
    assert HealthAccessAuditEvent.objects.count() == 0


@pytest.mark.django_db
def test_grantee_can_revoke_own_access_and_consent_is_revoked():
    owner = make_user("owner@example.com")
    caregiver = make_user("caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private Health")
    grant_profile_access(
        actor=owner, profile_id=profile.pk, grantee_id=caregiver.pk,
        scopes=["records.read"], policy_version="v1",
    )
    assert can_access_profile(actor=caregiver, profile=profile, scope="records.read")

    assert revoke_profile_access(actor=caregiver, profile_id=profile.pk, grantee_id=caregiver.pk) is True
    assert not can_access_profile(actor=caregiver, profile=profile, scope="records.read")
    assert HealthConsent.objects.filter(profile=profile, status=HealthConsent.Status.REVOKED).count() == 1
    assert HealthAccessAuditEvent.objects.filter(action=HealthAccessAuditEvent.Action.ACCESS_REVOKED).count() == 1


@pytest.mark.django_db
def test_unrelated_actor_cannot_revoke_another_users_access():
    owner = make_user("owner@example.com")
    caregiver = make_user("caregiver@example.com")
    stranger = make_user("stranger@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private Health")
    grant_profile_access(
        actor=owner, profile_id=profile.pk, grantee_id=caregiver.pk,
        scopes=["records.read"], policy_version="v1",
    )

    with pytest.raises(PermissionDenied):
        revoke_profile_access(actor=stranger, profile_id=profile.pk, grantee_id=caregiver.pk)
    assert can_access_profile(actor=caregiver, profile=profile, scope="records.read")


@pytest.mark.django_db
def test_expired_grant_and_invalid_scope_are_rejected():
    owner = make_user("owner@example.com")
    caregiver = make_user("caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private Health")

    with pytest.raises(ValidationError):
        grant_profile_access(
            actor=owner, profile_id=profile.pk, grantee_id=caregiver.pk,
            scopes=["records.read"], policy_version="v1",
            expires_at=timezone.now() - timedelta(seconds=1),
        )
    with pytest.raises(ValidationError):
        grant_profile_access(
            actor=owner, profile_id=profile.pk, grantee_id=caregiver.pk,
            scopes=["not-a-scope"], policy_version="v1",
        )
    assert HealthAccessAuditEvent.objects.count() == 0


@pytest.mark.django_db
def test_audit_events_reject_update_and_delete():
    owner = make_user("owner@example.com")
    caregiver = make_user("caregiver@example.com")
    profile = HealthProfile.objects.create(owner=owner, display_name="Private Health")
    grant_profile_access(
        actor=owner, profile_id=profile.pk, grantee_id=caregiver.pk,
        scopes=["records.read"], policy_version="v1",
    )
    event = HealthAccessAuditEvent.objects.get(profile=profile)

    with pytest.raises(ValueError):
        event.save()
    with pytest.raises(ValueError):
        event.delete()
    with pytest.raises(ValueError):
        HealthAccessAuditEvent.objects.filter(pk=event.pk).update(action="tampered")
    with pytest.raises(ValueError):
        HealthAccessAuditEvent.objects.filter(pk=event.pk).delete()
