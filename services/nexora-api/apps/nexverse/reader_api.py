from __future__ import annotations

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import (
    NexverseBookmark,
    NexverseEntitlement,
    NexverseChapter,
    NexverseReadingProgress,
    NexversePurchase,
    NexverseWork,
)


def _readable_work_queryset():
    return NexverseWork.objects.filter(
        status__in=(NexverseWork.Status.PUBLISHED, NexverseWork.Status.COMPLETED),
        review_status=NexverseWork.ReviewStatus.APPROVED,
        visibility=NexverseWork.Visibility.PUBLIC,
    )


def _readable_progress_queryset(user):
    now = timezone.now()
    active_entitlement = (
        Q(
            chapter__entitlements__user=user,
            chapter__entitlements__status=NexverseEntitlement.Status.ACTIVE,
            chapter__entitlements__purchase__status=NexversePurchase.Status.PAID,
            chapter__entitlements__starts_at__lte=now,
            chapter__entitlements__deleted_at__isnull=True,
        )
        & (
            Q(chapter__entitlements__expires_at__isnull=True)
            | Q(chapter__entitlements__expires_at__gt=now)
        )
    )
    return (
        NexverseReadingProgress.objects.filter(
            chapter__status=NexverseChapter.Status.PUBLISHED,
            work__in=_readable_work_queryset(),
        )
        .filter(Q(chapter__is_free_preview=True) | active_entitlement)
        .distinct()
    )


def _progress_payload(progress):
    return {
        "workId": str(progress.work_id),
        "workSlug": progress.work.slug,
        "workTitle": progress.work.title,
        "chapterId": str(progress.chapter_id),
        "chapterNumber": progress.chapter.chapter_number,
        "chapterTitle": progress.chapter.title,
        "positionChars": progress.position_chars,
        "progressPercent": progress.progress_percent,
        "updatedAt": progress.updated_at.isoformat(),
    }


class NexverseReadingProgressListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress_items = (
            _readable_progress_queryset(request.user)
            .filter(user=request.user)
            .select_related("work", "chapter")
            .order_by("-updated_at")[:100]
        )
        return Response({"items": [_progress_payload(item) for item in progress_items]})


class NexverseReadingProgressDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, work_id):
        work = get_object_or_404(_readable_work_queryset(), pk=work_id)
        progress = (
            _readable_progress_queryset(request.user)
            .filter(user=request.user, work=work)
            .select_related("work", "chapter")
            .first()
        )
        if progress is None:
            return Response({"item": None})
        return Response({"item": _progress_payload(progress)})

    def put(self, request, work_id):
        work = get_object_or_404(_readable_work_queryset(), pk=work_id)
        chapter_id = request.data.get("chapterId")
        try:
            position_chars = int(request.data.get("positionChars", 0))
            progress_percent = int(request.data.get("progressPercent", 0))
        except (TypeError, ValueError):
            return Response(
                {"detail": "positionChars and progressPercent must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if position_chars < 0 or not 0 <= progress_percent <= 100:
            return Response(
                {"detail": "Reading position must be non-negative and progress must be between 0 and 100."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        entitled_chapter = (
            Q(entitlements__user=request.user)
            & Q(entitlements__status=NexverseEntitlement.Status.ACTIVE)
            & Q(entitlements__purchase__status=NexversePurchase.Status.PAID)
            & Q(entitlements__starts_at__lte=now)
            & Q(entitlements__deleted_at__isnull=True)
            & (Q(entitlements__expires_at__isnull=True) | Q(entitlements__expires_at__gt=now))
        )
        chapter = get_object_or_404(
            NexverseChapter.objects.filter(
                work=work,
                status=NexverseChapter.Status.PUBLISHED,
            ).filter(Q(is_free_preview=True) | entitled_chapter).distinct(),
            pk=chapter_id,
        )
        if position_chars > len(chapter.content):
            return Response(
                {"detail": "positionChars cannot exceed the chapter content length."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            progress, _ = NexverseReadingProgress.objects.update_or_create(
                user=request.user,
                work=work,
                defaults={
                    "chapter": chapter,
                    "position_chars": position_chars,
                    "progress_percent": progress_percent,
                },
            )
        progress = NexverseReadingProgress.objects.select_related("work", "chapter").get(
            pk=progress.pk
        )
        return Response({"item": _progress_payload(progress)})


class NexverseBookmarkListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookmarks = (
            NexverseBookmark.objects.filter(
                user=request.user,
                work__in=_readable_work_queryset(),
            )
            .select_related("work", "work__author")
            .order_by("-created_at")[:200]
        )
        return Response(
            {
                "items": [
                    {
                        "workId": str(item.work_id),
                        "workSlug": item.work.slug,
                        "title": item.work.title,
                        "author": item.work.author.pen_name,
                        "coverImageUrl": item.work.cover_image_url,
                        "genre": item.work.genre,
                        "bookmarkedAt": item.created_at.isoformat(),
                    }
                    for item in bookmarks
                ]
            }
        )


class NexverseBookmarkDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, work_id):
        work = get_object_or_404(_readable_work_queryset(), pk=work_id)
        _, created = NexverseBookmark.objects.get_or_create(user=request.user, work=work)
        return Response(
            {"bookmarked": True, "created": created, "workId": str(work.id)},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, work_id):
        work = get_object_or_404(_readable_work_queryset(), pk=work_id)
        deleted, _ = NexverseBookmark.objects.filter(user=request.user, work=work).delete()
        return Response(
            {"bookmarked": False, "deleted": bool(deleted), "workId": str(work.id)}
        )
