from rest_framework.permissions import AllowAny, BasePermission


class PublicEndpointPermission(AllowAny):
    """Explicit marker for endpoints intentionally public."""


class AuthenticatedNexoraUserPermission(BasePermission):
    message = "Authentication credentials are required."

    def has_permission(self, request, view):
        return bool(getattr(request, "user", None) and getattr(request.user, "is_authenticated", False))


class ProtectedEndpointMixin:
    permission_classes = [AuthenticatedNexoraUserPermission]
