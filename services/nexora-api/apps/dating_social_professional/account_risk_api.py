from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .account_risk import recalculate_account_risk
from .api import DatingActiveUserPermission
from .moderation_api import DatingMomentModeratorPermission
from .models import DatingAccountRiskProfile, DatingAccountSecurityEvent
from apps.identity.models import NexoraUser


class MyAccountSecurityView(APIView):
    permission_classes = [DatingActiveUserPermission]

    def get(self, request):
        profile = DatingAccountRiskProfile.objects.filter(
            user=request.user, deleted_at__isnull=True
        ).first()
        events = DatingAccountSecurityEvent.objects.filter(
            subject=request.user, deleted_at__isnull=True
        ).order_by("-created_at")[:10]
        return Response({
            "account_status": request.user.status,
            "risk_level": profile.level if profile else DatingAccountRiskProfile.Level.LOW,
            "risk_profile_updated_at": profile.calculated_at.isoformat() if profile and profile.calculated_at else None,
            "security_events": [{
                "type": event.event_type,
                "created_at": event.created_at.isoformat(),
            } for event in events],
        })


class TrustSafetyAccountRiskView(APIView):
    permission_classes = [DatingActiveUserPermission, DatingMomentModeratorPermission]

    def get(self, request):
        queryset = DatingAccountRiskProfile.objects.filter(
            deleted_at__isnull=True
        ).select_related("user").order_by("-score", "-updated_at")
        level = request.query_params.get("level")
        if level:
            if level not in DatingAccountRiskProfile.Level.values:
                return Response({"detail": "Invalid risk level."}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(level=level)
        try:
            limit = min(100, max(1, int(request.query_params.get("limit", "30"))))
        except (TypeError, ValueError):
            return Response({"detail": "limit must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"items": [{
            "user_id": str(item.user_id),
            "display_name": item.user.display_name,
            "account_status": item.user.status,
            "risk_score": item.score,
            "risk_level": item.level,
            "confirmed_report_count": item.confirmed_report_count,
            "received_block_count": item.received_block_count,
            "signals": item.signals,
            "calculated_at": item.calculated_at.isoformat() if item.calculated_at else None,
        } for item in queryset[:limit]]})

    def post(self, request, user_id):
        user = NexoraUser.objects.filter(
            id=user_id, deleted_at__isnull=True
        ).first()
        if not user:
            return Response({"detail": "Account not found."}, status=status.HTTP_404_NOT_FOUND)
        profile = recalculate_account_risk(user, actor=request.user)
        return Response({
            "user_id": str(user.id),
            "risk_score": profile.score,
            "risk_level": profile.level,
            "signals": profile.signals,
            "calculated_at": profile.calculated_at.isoformat() if profile.calculated_at else None,
            "enforcement_applied": False,
        })
