from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import KnowledgeService

class KnowledgeView(APIView):
    permission_classes = [AllowAny]
    def get(self, request): return Response(KnowledgeService.snapshot())

class KnowledgeTopicView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, key):
        payload = KnowledgeService.topic_detail(key)
        return Response(payload or {"detail": "Topic not found."}, status=200 if payload else 404)

class KnowledgeHadithView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, key):
        payload = KnowledgeService.hadith_detail(key)
        return Response(payload or {"detail": "Hadith not found."}, status=200 if payload else 404)
