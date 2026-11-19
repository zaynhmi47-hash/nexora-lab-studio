from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import LearningLesson, LearningLessonContent
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
            lessons = list(course.lessons.filter(is_published=True, deleted_at__isnull=True))
            course_lessons = []
            for lesson in lessons:
                payload = lesson_payload(lesson, completed)
                if payload["status"] != "completed" and not LearningService.lesson_is_unlocked(request.user, lesson):
                    payload["status"] = "locked"
                course_lessons.append(payload)
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
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_key: str):
        try:
            content = LearningService.lesson_content(request.user, lesson_key)
        except LearningLesson.DoesNotExist:
            return Response({"detail": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
        except LearningLessonContent.DoesNotExist:
            return Response({"detail": "Published lesson content not found."}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(content)


class LearningQuizView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_key: str):
        lesson = LearningLesson.objects.filter(
            key=lesson_key,
            kind=LearningLesson.Kind.QUIZ,
            is_published=True,
            deleted_at__isnull=True,
            course__is_published=True,
            course__deleted_at__isnull=True,
        ).first()
        if lesson is None:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        if not LearningService.lesson_is_unlocked(request.user, lesson):
            return Response({"detail": "Complete the previous lessons before opening this quiz."}, status=status.HTTP_403_FORBIDDEN)
        questions = LearningService.quiz(lesson_key)
        if not questions:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        # Never send answer keys or explanations before an attempt is submitted.
        # Keeping this response intentionally limited protects quiz integrity.
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
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(progress_payload(progress))


class LearningCompleteQuizView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_key: str):
        answers = request.data.get("answers")
        if not isinstance(answers, list) or not all(type(answer) is int for answer in answers):
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
