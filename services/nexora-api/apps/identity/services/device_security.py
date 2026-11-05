import re

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import salted_hmac

from apps.identity.models import IdentityDevice, IdentityLoginEvent


DEVICE_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{16,256}$")


def fingerprint_hash(device_id: str) -> str:
    if not isinstance(device_id, str) or not DEVICE_ID_PATTERN.fullmatch(device_id):
        raise ValueError("device_id must be an opaque identifier between 16 and 256 safe characters.")
    return salted_hmac(
        "nexora.identity.device.v1",
        device_id,
        secret=settings.SECRET_KEY,
        algorithm="sha256",
    ).hexdigest()


@transaction.atomic
def register_device(*, user, device_id, display_name="", platform="other"):
    digest = fingerprint_hash(device_id)
    now = timezone.now()
    device = IdentityDevice.objects.select_for_update().filter(
        user=user, fingerprint_hash=digest, deleted_at__isnull=True
    ).first()
    event_type = IdentityLoginEvent.Type.DEVICE_SEEN
    if device is None:
        device = IdentityDevice.objects.create(
            user=user,
            fingerprint_hash=digest,
            display_name=display_name[:80],
            platform=platform if platform in IdentityDevice.Platform.values else IdentityDevice.Platform.OTHER,
            first_seen_at=now,
            last_seen_at=now,
        )
        event_type = IdentityLoginEvent.Type.DEVICE_REGISTERED
    elif device.revoked_at is not None:
        raise ValueError("This device has been revoked. Sign in again with a newly generated device identifier.")
    else:
        device.display_name = display_name[:80] or device.display_name
        if platform in IdentityDevice.Platform.values:
            device.platform = platform
        device.last_seen_at = now
        device.save(update_fields=["display_name", "platform", "last_seen_at", "updated_at"])
    user.last_login_at = now
    user.save(update_fields=["last_login_at", "updated_at"])
    IdentityLoginEvent.objects.create(
        user=user,
        device=device,
        event_type=event_type,
        occurred_at=now,
        metadata={"platform": device.platform},
    )
    return device


@transaction.atomic
def mark_device_trusted(*, user, device):
    locked = IdentityDevice.objects.select_for_update().get(
        pk=device.pk, user=user, deleted_at__isnull=True
    )
    if locked.revoked_at is not None:
        raise ValueError("A revoked device cannot be trusted.")
    now = timezone.now()
    locked.trusted_at = now
    locked.save(update_fields=["trusted_at", "updated_at"])
    IdentityLoginEvent.objects.create(
        user=user,
        device=locked,
        event_type=IdentityLoginEvent.Type.DEVICE_TRUSTED,
        occurred_at=now,
        metadata={},
    )
    return locked


def record_security_event(*, user, event_type, device=None, metadata=None):
    return IdentityLoginEvent.objects.create(
        user=user,
        device=device,
        event_type=event_type,
        occurred_at=timezone.now(),
        metadata=metadata or {},
    )
