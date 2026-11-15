import pytest
from rest_framework.test import APIClient

from apps.identity.models import NexoraUser
from apps.learning.models import LearningCourse, LearningLesson, LearningQuizQuestion


@pytest.mark.django_db
def test_quiz_endpoint_does_not_expose_answer_key_or_explanation():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="quiz-learner@example.com",
    )
    course = LearningCourse.objects.create(
        key="quiz-security-course",
        title="Quiz Security",
        is_published=True,
    )
    lesson = LearningLesson.objects.create(
        key="quiz-security-lesson",
        course=course,
        title="Security Quiz",
        kind=LearningLesson.Kind.QUIZ,
        is_published=True,
    )
    LearningQuizQuestion.objects.create(
        lesson=lesson,
        key="quiz-security-question",
        prompt="Which option is correct?",
        options=["Option A", "Option B", "Option C"],
        correct_option_index=1,
        explanation="Option B is correct because it follows the rule.",
    )

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(
        f"/api/v1/learning/lessons/{lesson.key}/quiz/"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload == [
        {
            "id": "quiz-security-question",
            "lessonId": "quiz-security-lesson",
            "prompt": "Which option is correct?",
            "options": ["Option A", "Option B", "Option C"],
        }
    ]
    assert "correctOptionIndex" not in payload[0]
    assert "explanation" not in payload[0]
