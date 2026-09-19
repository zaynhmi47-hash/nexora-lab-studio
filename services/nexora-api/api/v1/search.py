from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication
from apps.quran.models import QuranAyah, QuranSurah
from apps.knowledge.models import HadithEntry
from apps.dua.models import DuaEntry
from apps.learning.models import LearningCourse, LearningLesson


class GlobalSearchView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = str(request.query_params.get("q", "")).strip()
        if len(query) < 2:
            return Response({"query": query, "results": [], "total": 0})

        needle = query[:100]
        results = []

        for item in QuranSurah.objects.filter(
            Q(name__icontains=needle) | Q(arabic_name__icontains=needle),
            deleted_at__isnull=True,
        )[:10]:
            results.append({"type": "quran_surah", "id": item.number, "title": item.name, "subtitle": item.arabic_name, "route": "/quran"})

        for item in QuranAyah.objects.filter(
            Q(arabic_text__icontains=needle) | Q(translation__icontains=needle),
            deleted_at__isnull=True,
        ).select_related("surah")[:10]:
            results.append({"type": "quran_ayah", "id": str(item.id), "title": f"{item.surah.name} {item.number_in_surah}", "subtitle": item.translation or item.arabic_text[:120], "route": "/quran"})

        for item in HadithEntry.objects.filter(
            Q(title__icontains=needle) | Q(summary__icontains=needle) | Q(reference__icontains=needle),
            deleted_at__isnull=True,
        )[:10]:
            results.append({"type": "hadith", "id": str(item.id), "title": item.title, "subtitle": item.summary[:160], "route": "/knowledge"})

        for item in DuaEntry.objects.filter(
            Q(title__icontains=needle) | Q(category__icontains=needle) | Q(arabic__icontains=needle) | Q(translation__icontains=needle),
            is_published=True, deleted_at__isnull=True,
        )[:10]:
            results.append({"type": "dua", "id": str(item.id), "title": item.title, "subtitle": item.translation[:160], "route": "/dua"})

        for item in LearningLesson.objects.filter(
            Q(title__icontains=needle) | Q(description__icontains=needle),
            is_published=True, course__is_published=True, deleted_at__isnull=True,
        ).select_related("course")[:10]:
            results.append({"type": "learning_lesson", "id": item.key, "title": item.title, "subtitle": item.description[:160], "route": f"/lesson/{item.key}"})

        for item in LearningCourse.objects.filter(
            Q(title__icontains=needle) | Q(description__icontains=needle),
            is_published=True, deleted_at__isnull=True,
        )[:10]:
            results.append({"type": "learning_course", "id": item.key, "title": item.title, "subtitle": item.description[:160], "route": f"/course/{item.key}"})

        return Response({"query": query, "results": results[:50], "total": len(results[:50])})
