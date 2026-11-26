from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import LearningLesson, LearningContentBlock
from .services import LearningService, UnifiedLearningEngine, learning_hub


def progress_payload(progress):
    return {
        "userId": str(progress.user_id),
        "xp": progress.xp,
        "level": progress.level,
        "currentStreak": progress.current_streak,
        "completedLessonIds": LearningService.completed_lesson_ids(progress.user),
        "lastCompletedAt": progress.last_completed_at.isoformat() if progress.last_completed_at else None,
    }


def lesson_payload(lesson, completed_keys: set[str]):
    return {
        "id": lesson.key,
        "courseId": lesson.course.key,
        "title": lesson.title,
        "description": lesson.description,
        "kind": lesson.kind,
        "order": lesson.sort_order,
        "xpReward": lesson.xp_reward,
        "status": "completed" if lesson.key in completed_keys else "available",
    }


class LearningCoursesView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        completed = set(LearningService.completed_lesson_ids(request.user))
        courses = []
        for course in LearningService.courses():
            lessons = list(course.lessons.filter(is_published=True))
            course_lessons = [lesson_payload(lesson, completed) for lesson in lessons]
            for index, lesson in enumerate(course_lessons):
                if lesson["status"] != "completed" and index > 0 and course_lessons[index - 1]["status"] != "completed":
                    lesson["status"] = "locked"
            courses.append({
                "id": course.key,
                "title": course.title,
                "description": course.description,
                "level": course.level,
                "lessons": course_lessons,
            })
        return Response(courses)


class LearningProgressView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(progress_payload(LearningService.progress(request.user)))


class LearningLessonContentView(APIView):
    """Read published lesson blocks; editing and uploads remain staff-only in Django Admin."""

    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_key: str):
        lesson = LearningLesson.objects.filter(
            key=lesson_key,
            is_published=True,
            course__is_published=True,
            deleted_at__isnull=True,
            course__deleted_at__isnull=True,
        ).first()
        if lesson is None:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)

        blocks = LearningContentBlock.objects.filter(
            lesson=lesson,
            is_published=True,
            deleted_at__isnull=True,
        ).order_by("sort_order", "created_at")
        payload = []
        for block in blocks:
            file_url = None
            if block.file:
                try:
                    file_url = request.build_absolute_uri(block.file.url)
                except (ValueError, NotImplementedError):
                    file_url = None
            payload.append({
                "id": str(block.id),
                "title": block.title,
                "kind": block.kind,
                "body": block.body,
                "fileUrl": file_url,
                "externalUrl": block.external_url or None,
                "order": block.sort_order,
            })
        return Response(payload)


class LearningQuizView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_key: str):
        questions = LearningService.quiz(lesson_key)
        if not questions:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        # Never send answer keys or explanations before an attempt is submitted.
        return Response([
            {
                "id": question.key,
                "lessonId": lesson_key,
                "prompt": question.prompt,
                "options": question.options,
            }
            for question in questions
        ])


class LearningCompleteLessonView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_key: str):
        try:
            progress = LearningService.complete_lesson(request.user, lesson_key)
        except LearningLesson.DoesNotExist:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(progress_payload(progress))


class LearningCompleteQuizView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_key: str):
        answers = request.data.get("answers")
        if not isinstance(answers, list) or not all(isinstance(answer, int) for answer in answers):
            return Response({"detail": "answers must be an array of integers."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = LearningService.complete_quiz(request.user, lesson_key, answers)
        except LearningLesson.DoesNotExist:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class LearningHubView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(learning_hub(request.user))


class LearningAchievementsView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UnifiedLearningEngine.achievement_snapshot(request.user))
