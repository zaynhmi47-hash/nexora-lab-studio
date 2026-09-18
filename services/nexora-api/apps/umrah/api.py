from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import UmrahChecklistItem
from .services import UmrahService


class UmrahBaseView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]


class UmrahJourneyView(UmrahBaseView):
    def get(self, request):
        return Response(UmrahService.get_journey(request.user))


class UmrahChecklistToggleView(UmrahBaseView):
    def post(self, request, item_key):
        try:
            return Response(UmrahService.toggle_checklist(request.user, item_key))
        except UmrahChecklistItem.DoesNotExist:
            return Response({"detail": "Checklist item not found."}, status=status.HTTP_404_NOT_FOUND)
