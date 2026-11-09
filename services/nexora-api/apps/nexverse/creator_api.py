from __future__ import annotations

from uuid import uuid4

from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import NexverseAuthor, NexverseChapter, NexverseWork


def _author_for(user):
    return NexverseAuthor.objects.filter(user=user).first()


def _work_payload(work, include_chapters=False):
    data = {
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
        "createdAt": work.created_at.isoformat(),
        "updatedAt": work.updated_at.isoformat(),
    }
    if include_chapters:
        data["chapters"] = [_chapter_payload(chapter) for chapter in work.chapters.all()]
    return data


def _chapter_payload(chapter):
    return {
        "id": str(chapter.id),
        "number": chapter.chapter_number,
        "slug": chapter.slug,
        "title": chapter.title,
        "summary": chapter.summary,
        "content": chapter.content,
        "freePreview": chapter.is_free_preview,
        "status": chapter.status,
        "publishedAt": chapter.published_at.isoformat() if chapter.published_at else None,
    }


def _owned_work(user, work_id):
    return NexverseWork.objects.filter(author__user=user, pk=work_id).first()


class NexverseCreatorProfileView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        author = _author_for(request.user)
        if author is None:
            return Response({"isCreator": False})
        return Response({
            "isCreator": True,
            "id": str(author.id),
            "slug": author.slug,
            "penName": author.pen_name,
            "bio": author.bio,
            "avatarUrl": author.avatar_url,
            "verified": author.is_verified,
        })

    def post(self, request):
        pen_name = str(request.data.get("penName", "")).strip()
        if not pen_name or len(pen_name) > 160:
            return Response({"detail": "penName is required and must be at most 160 characters."}, status=400)
        if _author_for(request.user):
            return Response({"detail": "Creator profile already exists."}, status=409)
        base_slug = slugify(pen_name)[:80] or "creator"
        with transaction.atomic():
            slug = f"{base_slug}-{uuid4().hex[:8]}"
            author = NexverseAuthor.objects.create(
                user=request.user,
                slug=slug,
                pen_name=pen_name,
                bio=str(request.data.get("bio", ""))[:5000],
                avatar_url=str(request.data.get("avatarUrl", ""))[:2048],
            )
        return Response({
            "isCreator": True,
            "id": str(author.id),
            "slug": author.slug,
            "penName": author.pen_name,
            "bio": author.bio,
            "avatarUrl": author.avatar_url,
            "verified": author.is_verified,
        }, status=status.HTTP_201_CREATED)


class NexverseCreatorWorkListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        author = _author_for(request.user)
        if author is None:
            return Response({"detail": "Create a creator profile first."}, status=409)
        works = NexverseWork.objects.filter(author=author).order_by("-updated_at")
        return Response({"items": [_work_payload(work) for work in works]})

    def post(self, request):
        author = _author_for(request.user)
        if author is None:
            return Response({"detail": "Create a creator profile first."}, status=409)
        title = str(request.data.get("title", "")).strip()
        if not title or len(title) > 255:
            return Response({"detail": "title is required and must be at most 255 characters."}, status=400)
        slug = f"{slugify(title)[:140] or 'work'}-{uuid4().hex[:8]}"
        work = NexverseWork.objects.create(
            author=author,
            slug=slug,
            title=title,
            synopsis=str(request.data.get("synopsis", ""))[:20000],
            cover_image_url=str(request.data.get("coverImageUrl", ""))[:2048],
            language_code=str(request.data.get("language", "id"))[:12],
            genre=str(request.data.get("genre", ""))[:64],
            content_rating=str(request.data.get("contentRating", "general"))[:16],
            visibility=request.data.get("visibility", NexverseWork.Visibility.PUBLIC)
            if request.data.get("visibility") in NexverseWork.Visibility.values
            else NexverseWork.Visibility.PUBLIC,
        )
        return Response(_work_payload(work, include_chapters=True), status=201)


class NexverseCreatorWorkDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, work_id):
        work = _owned_work(request.user, work_id)
        if work is None:
            return Response({"detail": "Work not found."}, status=404)
        return Response(_work_payload(work, include_chapters=True))

    def patch(self, request, work_id):
        work = _owned_work(request.user, work_id)
        if work is None:
            return Response({"detail": "Work not found."}, status=404)
        if work.review_status == NexverseWork.ReviewStatus.SUBMITTED:
            return Response({"detail": "A submitted work cannot be edited until review is complete."}, status=409)
        fields = {
            "title": ("title", 255),
            "synopsis": ("synopsis", 20000),
            "coverImageUrl": ("cover_image_url", 2048),
            "language": ("language_code", 12),
            "genre": ("genre", 64),
            "contentRating": ("content_rating", 16),
        }
        for input_key, (model_field, max_length) in fields.items():
            if input_key in request.data:
                value = str(request.data[input_key]).strip()
                if len(value) > max_length or (input_key == "title" and not value):
                    return Response({"detail": f"Invalid {input_key}."}, status=400)
                setattr(work, model_field, value)
        if "visibility" in request.data and request.data["visibility"] in NexverseWork.Visibility.values:
            work.visibility = request.data["visibility"]
        if work.review_status == NexverseWork.ReviewStatus.REJECTED:
            work.review_status = NexverseWork.ReviewStatus.DRAFT
            work.review_note = ""
            work.reviewed_at = None
        work.save()
        return Response(_work_payload(work, include_chapters=True))


class NexverseCreatorChapterListView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, work_id):
        work = _owned_work(request.user, work_id)
        if work is None:
            return Response({"detail": "Work not found."}, status=404)
        return Response({"items": [_chapter_payload(chapter) for chapter in work.chapters.all()]})

    def post(self, request, work_id):
        work = _owned_work(request.user, work_id)
        if work is None:
            return Response({"detail": "Work not found."}, status=404)
        if work.review_status == NexverseWork.ReviewStatus.SUBMITTED:
            return Response({"detail": "A submitted work cannot be edited until review is complete."}, status=409)
        try:
            number = int(request.data.get("number"))
        except (TypeError, ValueError):
            return Response({"detail": "number must be a positive integer."}, status=400)
        title = str(request.data.get("title", "")).strip()
        content = str(request.data.get("content", ""))
        if number < 1 or not title or len(title) > 255 or not content or len(content) > 500000:
            return Response({"detail": "Valid number, title, and content are required."}, status=400)
        chapter_slug = f"{slugify(title)[:140] or 'chapter'}-{uuid4().hex[:8]}"
        try:
            chapter = NexverseChapter.objects.create(
                work=work,
                chapter_number=number,
                slug=chapter_slug,
                title=title,
                summary=str(request.data.get("summary", ""))[:500],
                content=content,
                is_free_preview=bool(request.data.get("freePreview", False)),
            )
        except IntegrityError:
            return Response({"detail": "Chapter number already exists for this work."}, status=409)
        if work.review_status == NexverseWork.ReviewStatus.REJECTED:
            work.review_status = NexverseWork.ReviewStatus.DRAFT
            work.review_note = ""
            work.reviewed_at = None
            work.save(update_fields=("review_status", "review_note", "reviewed_at", "updated_at"))
        return Response(_chapter_payload(chapter), status=201)


class NexverseCreatorChapterDetailView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, work_id, chapter_id):
        work = _owned_work(request.user, work_id)
        if work is None:
            return Response({"detail": "Work not found."}, status=404)
        if work.review_status == NexverseWork.ReviewStatus.SUBMITTED:
            return Response({"detail": "A submitted work cannot be edited until review is complete."}, status=409)
        chapter = work.chapters.filter(pk=chapter_id).first()
        if chapter is None:
            return Response({"detail": "Chapter not found."}, status=404)
        fields = {"title": (255, False), "summary": (500, True), "content": (500000, False)}
        for key, (limit, allow_empty) in fields.items():
            if key in request.data:
                value = str(request.data[key])
                if len(value) > limit or (not allow_empty and not value.strip()):
                    return Response({"detail": f"Invalid {key}."}, status=400)
                setattr(chapter, key, value)
        if "freePreview" in request.data:
            chapter.is_free_preview = bool(request.data["freePreview"])
        chapter.save()
        if work.review_status == NexverseWork.ReviewStatus.REJECTED:
            work.review_status = NexverseWork.ReviewStatus.DRAFT
            work.review_note = ""
            work.reviewed_at = None
            work.save(update_fields=("review_status", "review_note", "reviewed_at", "updated_at"))
        return Response(_chapter_payload(chapter))


class NexverseSubmitWorkView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, work_id):
        work = _owned_work(request.user, work_id)
        if work is None:
            return Response({"detail": "Work not found."}, status=404)
        if work.review_status == NexverseWork.ReviewStatus.SUBMITTED:
            return Response({"detail": "Work is already awaiting review."}, status=409)
        if not work.title.strip() or not work.synopsis.strip():
            return Response({"detail": "Add a title and synopsis before submitting."}, status=400)
        if not work.chapters.exists():
            return Response({"detail": "Add at least one chapter before submitting."}, status=400)
        work.review_status = NexverseWork.ReviewStatus.SUBMITTED
        work.submitted_at = timezone.now()
        work.reviewed_at = None
        work.review_note = ""
        work.save(update_fields=("review_status", "submitted_at", "reviewed_at", "review_note", "updated_at"))
        return Response(_work_payload(work), status=202)
