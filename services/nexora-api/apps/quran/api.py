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
        return Response([{
            "number": item.number,
            "name": item.name,
            "arabicName": item.arabic_name,
            "revelationPlace": item.revelation_place,
            "ayahCount": item.ayah_count,
        } for item in QuranService().list_surahs()])


class QuranSurahDetailView(QuranBaseView):
    def get(self, request, number: int):
        surah = QuranService().get_surah(number)
        if surah is None:
            return Response({"detail": "Surah not found."}, status=404)
        return Response({
            "surah": {
                "number": surah.number,
                "name": surah.name,
                "arabicName": surah.arabic_name,
                "revelationPlace": surah.revelation_place,
                "ayahCount": surah.ayah_count,
            },
            "ayahs": [{
                "surahNumber": ayah.surah.number,
                "numberInSurah": ayah.number_in_surah,
                "globalNumber": ayah.global_number,
                "arabicText": ayah.arabic_text,
                "translation": ayah.translation or None,
            } for ayah in surah.ayahs.all()],
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
        except (KeyError, TypeError, ValueError, QuranService.__annotations__.get("save_reading_position", object)):
            return Response({"detail": "Invalid reading position."}, status=400)
        return Response({
            "surahNumber": position.surah.number,
            "ayahNumber": position.ayah_number,
            "updatedAt": position.updated_at.isoformat(),
        })


class QuranBookmarkListView(QuranBaseView):
    def get(self, request):
        return Response([{
            "id": str(item.id),
            "surahNumber": item.ayah.surah.number,
            "ayahNumber": item.ayah.number_in_surah,
            "note": item.note or None,
            "createdAt": item.created_at.isoformat(),
        } for item in QuranService().list_bookmarks(request.user)])

    def post(self, request):
        try:
            bookmark = QuranService().save_bookmark(request.user, request.data["ayahId"], request.data.get("note", ""))
        except (KeyError, ValueError):
            return Response({"detail": "Invalid bookmark."}, status=400)
        return Response({
            "id": str(bookmark.id),
            "surahNumber": bookmark.ayah.surah.number,
            "ayahNumber": bookmark.ayah.number_in_surah,
            "note": bookmark.note or None,
            "createdAt": bookmark.created_at.isoformat(),
        })


class QuranBookmarkDetailView(QuranBaseView):
    def delete(self, request, bookmark_id):
        QuranService().remove_bookmark(request.user, bookmark_id)
        return Response(status=204)
