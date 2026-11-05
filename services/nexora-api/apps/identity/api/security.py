from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.models import IdentityDevice, IdentityLoginEvent, IdentityProviderAccount
from apps.identity.services.device_security import (
    mark_device_trusted,
    record_security_event,
    register_device,
)
from infrastructure.firebase.registry import FirebaseProviderRegistry


class DeviceRegistrationSerializer(serializers.Serializer):
    device_id = serializers.CharField(min_length=16, max_length=256, trim_whitespace=True)
    display_name = serializers.CharField(max_length=80, required=False, allow_blank=True)
    platform = serializers.ChoiceField(
        choices=IdentityDevice.Platform.choices, required=False, default=IdentityDevice.Platform.OTHER
    )


def _serialize_device(device):
    return {
        "id": str(device.id),
        "display_name": device.display_name,
        "platform": device.platform,
        "first_seen_at": device.first_seen_at.isoformat(),
        "last_seen_at": device.last_seen_at.isoformat(),
        "trusted_at": device.trusted_at.isoformat() if device.trusted_at else None,
        "revoked_at": device.revoked_at.isoformat() if device.revoked_at else None,
        "is_currently_revoked": device.revoked_at is not None,
    }


class IdentityDevicesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        devices = IdentityDevice.objects.filter(
            user=request.user, deleted_at__isnull=True
        ).order_by("-last_seen_at")
        return Response({"items": [_serialize_device(device) for device in devices]})

    def post(self, request):
        serializer = DeviceRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            device = register_device(
                user=request.user,
                device_id=serializer.validated_data["device_id"],
                display_name=serializer.validated_data.get("display_name", ""),
                platform=serializer.validated_data.get("platform", IdentityDevice.Platform.OTHER),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"data": _serialize_device(device)}, status=status.HTTP_201_CREATED)


class IdentityDeviceTrustView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, device_id):
        device = IdentityDevice.objects.filter(
            id=device_id, user=request.user, deleted_at__isnull=True
        ).first()
        if not device:
            return Response({"detail": "Device not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            device = mark_device_trusted(user=request.user, device=device)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"data": _serialize_device(device)})


class IdentitySessionRevocationView(APIView):
    permission_classes = (IsAuthenticated,)

    @staticmethod
    def _revoke_provider_sessions(user):
        account = IdentityProviderAccount.objects.filter(
            user=user, provider="firebase", deleted_at__isnull=True
        ).first()
        if account is None:
            return False
        FirebaseProviderRegistry().identity().revoke_session(account.provider_subject)
        return True

    def post(self, request, device_id=None):
        device = None
        if device_id is not None:
            device = IdentityDevice.objects.filter(
                id=device_id, user=request.user, deleted_at__isnull=True
            ).first()
            if not device:
                return Response({"detail": "Device not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            revoked = self._revoke_provider_sessions(request.user)
        except Exception:
            return Response(
                {"detail": "The identity provider could not revoke sessions. No local device state was changed."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not revoked:
            return Response(
                {"detail": "No revocable Firebase identity is linked to this account."},
                status=status.HTTP_409_CONFLICT,
            )

        now = timezone.now()
        with transaction.atomic():
            if device is not None:
                device.revoked_at = now
                device.save(update_fields=["revoked_at", "updated_at"])
                record_security_event(
                    user=request.user,
                    device=device,
                    event_type=IdentityLoginEvent.Type.DEVICE_REVOKED,
                    metadata={"scope": "all_firebase_sessions"},
                )
            else:
                record_security_event(
                    user=request.user,
                    event_type=IdentityLoginEvent.Type.ALL_SESSIONS_REVOKED,
                    metadata={"provider": "firebase"},
                )
        return Response({
            "status": "revoked",
            "scope": "all_firebase_sessions",
            "message": "Firebase refresh tokens for this account were revoked. Sign in again on devices that should remain active.",
        })
