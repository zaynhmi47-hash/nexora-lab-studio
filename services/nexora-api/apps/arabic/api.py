from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import ArabicLesson
from .services import ArabicService


class ArabicBaseView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]


class ArabicPathsView(ArabicBaseView):
    def get(self, request):
        return Response(ArabicService.paths(request.user))


class ArabicProgressView(ArabicBaseView):
    def get(self, request):
        return Response(ArabicService.progress(request.user))


class ArabicPracticeView(ArabicBaseView):
    def get(self, request, lesson_key):
        items = ArabicService.practice(lesson_key)
        if not items:
            return Response({"detail": "Arabic lesson practice not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response([{"id": item.key, "lessonId": lesson_key, "prompt": item.prompt, "options": item.options, "correctOptionIndex": item.correct_option_index, "explanation": item.explanation} for item in items])


class ArabicCompleteLessonView(ArabicBaseView):
    def post(self, request, lesson_key):
        try:
            return Response(ArabicService.complete_lesson(request.user, lesson_key))
        except ArabicLesson.DoesNotExist:
            return Response({"detail": "Arabic lesson not found."}, status=status.HTTP_404_NOT_FOUND)
