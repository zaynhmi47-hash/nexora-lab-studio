from django.core.exceptions import PermissionDenied as DjangoPermissionDenied, ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.health.models import HealthProfile, HealthProfileMember
from apps.health.services.access_grants import grant_profile_access, revoke_profile_access
from apps.health.services.profile_access import (
    PROFILE_READ_SCOPE,
    get_accessible_profile,
    get_accessible_profiles,
    record_profile_read,
)
from apps.identity.authentication import FirebaseIdentityAuthentication


class HealthProfileCreateSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=120, trim_whitespace=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)


class HealthProfileGrantSerializer(serializers.Serializer):
    grantee_id = serializers.UUIDField()
    scopes = serializers.ListField(
        child=serializers.CharField(max_length=80, allow_blank=False),
        allow_empty=False,
        max_length=20,
    )
    policy_version = serializers.CharField(max_length=32, allow_blank=False)
    role = serializers.ChoiceField(
        choices=[choice for choice in HealthProfileMember.Role.choices if choice[0] != HealthProfileMember.Role.OWNER],
        required=False,
        default=HealthProfileMember.Role.VIEWER,
    )
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class HealthProfileRevokeSerializer(serializers.Serializer):
    grantee_id = serializers.UUIDField()


class HealthProfileAPIView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _translate_domain_error(exc):
        if isinstance(exc, DjangoPermissionDenied):
            raise PermissionDenied(str(exc)) from exc
        if isinstance(exc, DjangoValidationError):
            detail = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            raise ValidationError(detail) from exc
        raise exc

    @staticmethod
    def _serialize(profile):
        return {
            "id": str(profile.pk),
            "ownerId": str(profile.owner_id),
            "displayName": profile.display_name,
            "dateOfBirth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
            "status": profile.status,
            "createdAt": profile.created_at.isoformat(),
            "updatedAt": profile.updated_at.isoformat(),
        }


class HealthProfileListCreateView(HealthProfileAPIView):
    def get(self, request):
        profiles = get_accessible_profiles(actor=request.user, scope=PROFILE_READ_SCOPE)
        for profile in profiles:
            record_profile_read(actor=request.user, profile=profile)
        return Response({"data": [self._serialize(profile) for profile in profiles]})

    def post(self, request):
        serializer = HealthProfileCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = HealthProfile.objects.create(owner=request.user, **serializer.validated_data)
        return Response({"data": self._serialize(profile)}, status=201)


class HealthProfileDetailView(HealthProfileAPIView):
    def get(self, request, profile_id):
        profile = get_accessible_profile(actor=request.user, profile_id=profile_id)
        record_profile_read(actor=request.user, profile=profile)
        return Response({"data": self._serialize(profile)})


class HealthProfileAccessGrantView(HealthProfileAPIView):
    def post(self, request, profile_id):
        serializer = HealthProfileGrantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            member, consent = grant_profile_access(
                actor=request.user,
                profile_id=profile_id,
                **serializer.validated_data,
            )
        except (DjangoPermissionDenied, DjangoValidationError) as exc:
            self._translate_domain_error(exc)
        return Response(
            {
                "data": {
                    "profileId": str(member.profile_id),
                    "granteeId": str(member.user_id),
                    "role": member.role,
                    "scopes": member.scopes,
                    "expiresAt": member.expires_at.isoformat() if member.expires_at else None,
                    "consentId": str(consent.pk),
                    "consentStatus": consent.status,
                }
            },
            status=201,
        )

    def delete(self, request, profile_id):
        serializer = HealthProfileRevokeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            revoked = revoke_profile_access(
                actor=request.user,
                profile_id=profile_id,
                grantee_id=serializer.validated_data["grantee_id"],
            )
        except (DjangoPermissionDenied, DjangoValidationError) as exc:
            self._translate_domain_error(exc)
        return Response({"data": {"revoked": revoked}})
