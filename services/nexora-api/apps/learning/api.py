from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from apps.identity.authentication import FirebaseIdentityAuthentication

from .models import LearningLesson
from .services import LearningService, learning_hub


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


class LearningQuizView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, lesson_key: str):
        questions = LearningService.quiz(lesson_key)
        if not questions:
            return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response([
            {
                "id": question.key,
                "lessonId": lesson_key,
                "prompt": question.prompt,
                "options": question.options,
                "correctOptionIndex": question.correct_option_index,
                "explanation": question.explanation,
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


class LearningHubView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(learning_hub(request.user))


class LearningAchievementsView(APIView):
    authentication_classes = [FirebaseIdentityAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        awards = LearningService.achievements(request.user)
        return Response([
            {
                "id": str(item.achievement_id),
                "key": item.achievement.key,
                "title": item.achievement.title,
                "description": item.achievement.description,
                "earnedAt": item.earned_at.isoformat(),
            }
            for item in awards
        ])
