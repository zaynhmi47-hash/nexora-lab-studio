from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from .services import TajwidService



class TajwidBaseView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]


class TajwidTopicsView(TajwidBaseView):
    def get(self, request):
        return Response(TajwidService.topics(request.user))


class TajwidProgressView(TajwidBaseView):
    def get(self, request):
        return Response(TajwidService.progress(request.user))


class TajwidPracticeView(TajwidBaseView):
    def get(self, request, topic_key):
        payload = TajwidService.practice(topic_key)
        return Response(payload or {"detail": "Tajwid topic not found."}, status=200 if payload else 404)


class TajwidCompletePracticeView(TajwidBaseView):
    def post(self, request, practice_key):
        try:
            correct = bool(request.data.get("correct", False))
            return Response(TajwidService().complete_practice(request.user, practice_key, correct))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=404)


class TajwidCompleteTopicView(TajwidBaseView):
    def post(self, request, topic_key):
        try:
            return Response(TajwidService().complete_topic(request.user, topic_key))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=404)


class TajwidAssessmentView(TajwidBaseView):
    def post(self, request):
        try:
            correct = int(request.data.get("correctAnswers", 0))
            total = int(request.data.get("totalQuestions", 0))
            result = TajwidService().complete_assessment(request.user, correct, total)
        except (TypeError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(result)
