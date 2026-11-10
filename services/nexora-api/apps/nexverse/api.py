from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.db.models import Count, F, Prefetch, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NexverseChapter, NexverseWork
from .monetization import user_has_chapter_entitlement


def author_payload(author):
    return {
        "id": str(author.id),
        "slug": author.slug,
        "name": author.pen_name,
        "bio": author.bio,
        "avatarUrl": author.avatar_url,
        "verified": author.is_verified,
    }


def work_payload(work, include_chapters=False):
    chapter_count = getattr(work, "published_chapter_count", None)
    if chapter_count is None:
        chapter_count = work.chapters.filter(status=NexverseChapter.Status.PUBLISHED).count()

    payload = {
        "id": str(work.id),
        "slug": work.slug,
        "title": work.title,
        "synopsis": work.synopsis,
        "coverImageUrl": work.cover_image_url,
        "language": work.language_code,
        "genre": work.genre,
        "status": work.status,
        "contentRating": work.content_rating,
        "author": author_payload(work.author),
        "chapterCount": chapter_count,
        "viewCount": work.view_count,
        "publishedAt": work.published_at.isoformat() if work.published_at else None,
    }
    if include_chapters:
        chapters = getattr(work, "published_chapters", None)
        if chapters is None:
            chapters = work.chapters.filter(status=NexverseChapter.Status.PUBLISHED)
        payload["chapters"] = [
            {
                "id": str(chapter.id),
                "number": chapter.chapter_number,
                "slug": chapter.slug,
                "title": chapter.title,
                "summary": chapter.summary,
                "freePreview": chapter.is_free_preview,
                "publishedAt": chapter.published_at.isoformat() if chapter.published_at else None,
            }
            for chapter in chapters
        ]
    return payload


class NexverseCatalogView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        queryset = NexverseWork.objects.filter(
            status__in=(NexverseWork.Status.PUBLISHED, NexverseWork.Status.COMPLETED),
            review_status=NexverseWork.ReviewStatus.APPROVED,
            visibility=NexverseWork.Visibility.PUBLIC,
        ).select_related("author").order_by("-published_at", "-created_at", "id").annotate(
            published_chapter_count=Count(
                "chapters", filter=Q(chapters__status=NexverseChapter.Status.PUBLISHED)
            )
        )
        query = request.query_params.get("q", "").strip()[:120]
        genre = request.query_params.get("genre", "").strip()[:64]
        language = request.query_params.get("language", "").strip()[:12]
        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(author__pen_name__icontains=query))
        if genre:
            queryset = queryset.filter(genre__iexact=genre)
        if language:
            queryset = queryset.filter(language_code__iexact=language)

        try:
            page_number = max(1, int(request.query_params.get("page", "1")))
        except (TypeError, ValueError):
            page_number = 1
        try:
            page_size = min(30, max(1, int(request.query_params.get("page_size", "12"))))
        except (TypeError, ValueError):
            page_size = 12
        paginator = Paginator(queryset, page_size)
        try:
            page = paginator.page(page_number)
        except (EmptyPage, PageNotAnInteger):
            page = paginator.page(paginator.num_pages or 1)

        return Response({
            "items": [work_payload(work) for work in page.object_list],
            "pagination": {
                "page": page.number,
                "pageSize": page_size,
                "totalItems": paginator.count,
                "totalPages": paginator.num_pages,
                "hasNext": page.has_next(),
                "hasPrevious": page.has_previous(),
            },
        })


class NexverseWorkDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, work_slug):
        work = get_object_or_404(
            NexverseWork.objects.select_related("author")
            .annotate(
                published_chapter_count=Count(
                    "chapters", filter=Q(chapters__status=NexverseChapter.Status.PUBLISHED)
                )
            )
            .prefetch_related(
                Prefetch(
                    "chapters",
                    queryset=NexverseChapter.objects.filter(status=NexverseChapter.Status.PUBLISHED),
                    to_attr="published_chapters",
                )
            ),
            slug=work_slug,
            status__in=(NexverseWork.Status.PUBLISHED, NexverseWork.Status.COMPLETED),
            review_status=NexverseWork.ReviewStatus.APPROVED,
            visibility=NexverseWork.Visibility.PUBLIC,
        )
        NexverseWork.objects.filter(pk=work.pk).update(view_count=F("view_count") + 1)
        work.view_count += 1
        return Response(work_payload(work, include_chapters=True))


class NexverseChapterContentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [FirebaseIdentityAuthentication]

    def get(self, request, work_slug, chapter_id):
        chapter = get_object_or_404(
            NexverseChapter.objects.select_related("work"),
            pk=chapter_id,
            work__slug=work_slug,
            work__status__in=(NexverseWork.Status.PUBLISHED, NexverseWork.Status.COMPLETED),
            work__review_status=NexverseWork.ReviewStatus.APPROVED,
            work__visibility=NexverseWork.Visibility.PUBLIC,
            status=NexverseChapter.Status.PUBLISHED,
        )
        if not chapter.is_free_preview and not user_has_chapter_entitlement(request.user, chapter):
            return Response(
                {
                    "code": "ENTITLEMENT_REQUIRED",
                    "detail": "This chapter requires an active Nexverse entitlement.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({
            "id": str(chapter.id),
            "workSlug": chapter.work.slug,
            "number": chapter.chapter_number,
            "title": chapter.title,
            "content": chapter.content,
            "freePreview": True,
        })
