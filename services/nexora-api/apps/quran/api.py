from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .services import QuranService


class QuranBaseView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]


class QuranSurahListView(QuranBaseView):
    def get(self, request):
        return Response([
            {"number": item.number, "name": item.name, "arabicName": item.arabic_name,
             "revelationPlace": item.revelation_place, "ayahCount": item.ayah_count}
            for item in QuranService().list_surahs()
        ])


class QuranSurahDetailView(QuranBaseView):
    def get(self, request, number: int):
        surah = QuranService().get_surah(number)
        if surah is None:
            return Response({"detail": "Surah not found."}, status=404)
        return Response({
            "surah": {"number": surah.number, "name": surah.name, "arabicName": surah.arabic_name,
                       "revelationPlace": surah.revelation_place, "ayahCount": surah.ayah_count},
            "ayahs": [
                {"id": str(ayah.id), "surahNumber": ayah.surah.number,
                 "numberInSurah": ayah.number_in_surah, "globalNumber": ayah.global_number,
                 "arabicText": ayah.arabic_text, "translation": ayah.translation or None}
                for ayah in surah.ayahs.all()
            ],
        })


class QuranReadingPositionView(QuranBaseView):
    def get(self, request):
        position = QuranService().get_reading_position(request.user)
        return Response(None if position is None else {
            "surahNumber": position.surah.number,
            "ayahNumber": position.ayah_number,
            "updatedAt": position.updated_at.isoformat(),
        })

    def put(self, request):
        try:
            position = QuranService().save_reading_position(
                request.user, int(request.data["surahNumber"]), int(request.data["ayahNumber"])
            )
        except (KeyError, TypeError, ValueError):
            return Response({"detail": "Invalid reading position."}, status=400)
        return Response({
            "surahNumber": position.surah.number,
            "ayahNumber": position.ayah_number,
            "updatedAt": position.updated_at.isoformat(),
        })


class QuranBookmarkListView(QuranBaseView):
    def get(self, request):
        return Response([
            {"id": str(item.id), "surahNumber": item.ayah.surah.number,
             "ayahNumber": item.ayah.number_in_surah, "note": item.note or None,
             "createdAt": item.created_at.isoformat()}
            for item in QuranService().list_bookmarks(request.user)
        ])

    def post(self, request):
        try:
            bookmark = QuranService().save_bookmark(
                request.user,
                int(request.data["surahNumber"]),
                int(request.data["ayahNumber"]),
                str(request.data.get("note", "")),
            )
        except (KeyError, TypeError, ValueError):
            return Response({"detail": "Invalid bookmark."}, status=400)
        return Response({
            "id": str(bookmark.id), "surahNumber": bookmark.ayah.surah.number,
            "ayahNumber": bookmark.ayah.number_in_surah, "note": bookmark.note or None,
            "createdAt": bookmark.created_at.isoformat(),
        })


class QuranBookmarkDetailView(QuranBaseView):
    def delete(self, request, bookmark_id):
        QuranService().remove_bookmark(request.user, bookmark_id)
        return Response(status=204)


class QuranRecitationListView(QuranBaseView):
    def get(self, request):
        return Response([
            {"id": str(item.id), "name": item.name, "language": item.language, "audioUrl": item.audio_url}
            for item in QuranService().list_recitations()
        ])


class QuranReadingGoalView(QuranBaseView):
    def get(self, request):
        goal = QuranService().get_or_create_reading_goal(request.user)
        return Response({"dailyTargetPages": goal.daily_target_pages, "dailyTargetMinutes": goal.daily_target_minutes})

    def put(self, request):
        try:
            goal = QuranService().update_reading_goal(
                request.user,
                int(request.data["dailyTargetPages"]),
                int(request.data["dailyTargetMinutes"]),
            )
        except (KeyError, TypeError, ValueError):
            return Response({"detail": "Invalid reading goal."}, status=400)
        return Response({"dailyTargetPages": goal.daily_target_pages, "dailyTargetMinutes": goal.daily_target_minutes})


class QuranReadingStatisticsView(QuranBaseView):
    def get(self, request):
        return Response(QuranService().get_reading_statistics(request.user))


class QuranReadingLogView(QuranBaseView):
    def post(self, request):
        try:
            reading_date = date.fromisoformat(str(request.data.get("date") or date.today().isoformat()))
            log = QuranService().log_reading(
                request.user,
                reading_date,
                int(request.data.get("pages", 0)),
                int(request.data.get("minutes", 0)),
            )
        except (TypeError, ValueError):
            return Response({"detail": "Invalid reading log."}, status=400)
        return Response({"date": log.date.isoformat(), "pages": log.pages, "minutes": log.minutes})
