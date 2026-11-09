from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import (
    NexverseChapter,
    NexverseModerator,
    NexverseReviewEvent,
    NexverseWork,
)


class IsActiveNexverseModerator(BasePermission):
    message = "An active Nexverse moderation role is required."

    def has_permission(self, request, view):
        moderator = (
            NexverseModerator.objects.select_related("user")
            .filter(user=request.user, is_active=True, deleted_at__isnull=True)
            .first()
        )
        if moderator is None:
            return False
        request.nexverse_moderator = moderator
        return True


def _moderation_payload(work, include_content=False):
    chapters = []
    for chapter in work.chapters.order_by("chapter_number"):
        item = {
            "id": str(chapter.id),
            "number": chapter.chapter_number,
            "title": chapter.title,
            "summary": chapter.summary,
            "freePreview": chapter.is_free_preview,
            "status": chapter.status,
        }
        if include_content:
            item["content"] = chapter.content
        chapters.append(item)
    return {
        "id": str(work.id),
        "slug": work.slug,
        "title": work.title,
        "synopsis": work.synopsis,
        "coverImageUrl": work.cover_image_url,
        "language": work.language_code,
        "genre": work.genre,
        "visibility": work.visibility,
        "contentRating": work.content_rating,
        "publicationStatus": work.status,
        "reviewStatus": work.review_status,
        "reviewNote": work.review_note,
        "submittedAt": work.submitted_at.isoformat() if work.submitted_at else None,
        "author": {
            "id": str(work.author_id),
            "penName": work.author.pen_name,
            "slug": work.author.slug,
            "verified": work.author.is_verified,
        },
        "chapters": chapters,
    }


class NexverseModerationQueueView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated, IsActiveNexverseModerator]

    def get(self, request):
        queryset = (
            NexverseWork.objects.filter(review_status=NexverseWork.ReviewStatus.SUBMITTED)
            .select_related("author")
            .order_by("submitted_at", "created_at")
        )
        try:
            page = max(1, int(request.query_params.get("page", "1")))
            page_size = min(50, max(1, int(request.query_params.get("page_size", "20"))))
        except (TypeError, ValueError):
            page, page_size = 1, 20
        total = queryset.count()
        start = (page - 1) * page_size
        items = [_moderation_payload(work) for work in queryset[start : start + page_size]]
        return Response({
            "items": items,
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "totalItems": total,
                "totalPages": (total + page_size - 1) // page_size,
            },
        })


class NexverseModerationWorkDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated, IsActiveNexverseModerator]

    def get(self, request, work_id):
        work = (
            NexverseWork.objects.select_related("author")
            .prefetch_related("chapters")
            .filter(pk=work_id)
            .first()
        )
        if work is None:
            return Response({"detail": "Work not found."}, status=404)
        return Response(_moderation_payload(work, include_content=True))


class NexverseModerationDecisionView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated, IsActiveNexverseModerator]

    def post(self, request, work_id):
        decision = str(request.data.get("decision", "")).strip().lower()
        note = str(request.data.get("note", "")).strip()
        if decision not in ("approve", "reject"):
            return Response({"detail": "decision must be approve or reject."}, status=400)
        if len(note) > 1000 or (decision == "reject" and not note):
            return Response({"detail": "A rejection note is required and must be at most 1000 characters."}, status=400)

        with transaction.atomic():
            work = (
                NexverseWork.objects.select_for_update()
                .select_related("author")
                .filter(pk=work_id)
                .first()
            )
            if work is None:
                return Response({"detail": "Work not found."}, status=404)
            if work.review_status != NexverseWork.ReviewStatus.SUBMITTED:
                return Response({"detail": "Only submitted works can be reviewed."}, status=409)

            now = timezone.now()
            moderator = request.nexverse_moderator
            if decision == "approve":
                if not work.chapters.exists():
                    return Response({"detail": "A work must contain at least one chapter."}, status=409)
                work.review_status = NexverseWork.ReviewStatus.APPROVED
                work.status = NexverseWork.Status.PUBLISHED
                work.published_at = work.published_at or now
                work.review_note = note
                NexverseChapter.objects.filter(work=work).update(
                    status=NexverseChapter.Status.PUBLISHED,
                    published_at=now,
                    updated_at=now,
                )
                event_decision = NexverseReviewEvent.Decision.APPROVED
            else:
                work.review_status = NexverseWork.ReviewStatus.REJECTED
                work.review_note = note
                event_decision = NexverseReviewEvent.Decision.REJECTED

            work.reviewed_at = now
            work.reviewed_by = request.user
            work.save(update_fields=(
                "review_status", "status", "published_at", "review_note",
                "reviewed_at", "reviewed_by", "updated_at",
            ))
            NexverseReviewEvent.objects.create(
                work=work,
                moderator=moderator,
                decision=event_decision,
                note=note,
            )

        return Response({
            "workId": str(work.id),
            "reviewStatus": work.review_status,
            "publicationStatus": work.status,
            "reviewedAt": work.reviewed_at.isoformat(),
            "reviewNote": work.review_note,
        }, status=status.HTTP_200_OK)
