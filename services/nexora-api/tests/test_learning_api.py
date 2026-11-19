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

@pytest.mark.django_db
def test_quiz_endpoint_requires_authentication():
    client = APIClient()

    response = client.get("/api/v1/learning/lessons/any-lesson/quiz/")

    assert response.status_code == 401



@pytest.mark.django_db
def test_locked_quiz_is_not_retrievable():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="locked-quiz@example.com",
    )
    course = LearningCourse.objects.create(key="locked-course", title="Locked")
    LearningLesson.objects.create(
        key="locked-prerequisite", course=course, title="Prerequisite", sort_order=1
    )
    lesson = LearningLesson.objects.create(
        key="locked-quiz", course=course, title="Locked quiz",
        kind=LearningLesson.Kind.QUIZ, sort_order=2,
    )
    LearningQuizQuestion.objects.create(
        lesson=lesson, key="locked-question", prompt="Choose",
        options=["A", "B"], correct_option_index=0,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/v1/learning/lessons/{lesson.key}/quiz/")
    assert response.status_code == 403


@pytest.mark.django_db
def test_quiz_submission_rejects_out_of_range_option():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="range-quiz@example.com",
    )
    course = LearningCourse.objects.create(key="api-range-course", title="Range")
    lesson = LearningLesson.objects.create(
        key="api-range-quiz", course=course, title="Range quiz",
        kind=LearningLesson.Kind.QUIZ,
    )
    LearningQuizQuestion.objects.create(
        lesson=lesson, key="api-range-question", prompt="Choose",
        options=["A", "B"], correct_option_index=1,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        f"/api/v1/learning/lessons/{lesson.key}/quiz/complete/",
        {"answers": [2]},
        format="json",
    )
    assert response.status_code == 400
    assert "outside the available choices" in response.json()["detail"]


@pytest.mark.django_db
def test_quiz_submission_rejects_boolean_answer_indices():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="bool-quiz@example.com",
    )
    course = LearningCourse.objects.create(key="api-bool-course", title="Boolean")
    lesson = LearningLesson.objects.create(
        key="api-bool-quiz", course=course, title="Boolean quiz",
        kind=LearningLesson.Kind.QUIZ,
    )
    LearningQuizQuestion.objects.create(
        lesson=lesson, key="api-bool-question", prompt="Choose",
        options=["A", "B"], correct_option_index=0,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        f"/api/v1/learning/lessons/{lesson.key}/quiz/complete/",
        {"answers": [True]},
        format="json",
    )
    assert response.status_code == 400



@pytest.mark.django_db
def test_quiz_endpoint_only_serves_quiz_type_lessons():
    user = NexoraUser.objects.create(
        status=NexoraUser.Status.ACTIVE,
        email="lesson-not-quiz@example.com",
    )
    course = LearningCourse.objects.create(key="not-quiz-course", title="Not a quiz")
    lesson = LearningLesson.objects.create(
        key="not-a-quiz", course=course, title="Regular lesson",
        kind=LearningLesson.Kind.LESSON,
    )
    LearningQuizQuestion.objects.create(
        lesson=lesson, key="not-quiz-question", prompt="Choose",
        options=["A", "B"], correct_option_index=0,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/v1/learning/lessons/{lesson.key}/quiz/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_published_lesson_content_is_available_to_unlocked_learner():
    from apps.learning.models import LearningLessonContent

    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="content-reader@example.com")
    course = LearningCourse.objects.create(key="content-course", title="Content course")
    lesson = LearningLesson.objects.create(key="content-lesson", course=course, title="Content lesson")
    LearningLessonContent.objects.create(
        lesson=lesson,
        version=2,
        estimated_minutes=8,
        is_published=True,
        blocks=[
            {"type": "heading", "text": "Start here"},
            {"type": "text", "text": "A short learning passage."},
            {"type": "image", "url": "https://cdn.example.org/diagram.png", "alt": "A learning diagram"},
        ],
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/v1/learning/lessons/{lesson.key}/content/")

    assert response.status_code == 200
    assert response.json()["version"] == 2
    assert response.json()["estimatedMinutes"] == 8
    assert [block["type"] for block in response.json()["blocks"]] == ["heading", "text", "image"]


@pytest.mark.django_db
def test_locked_lesson_content_is_not_available():
    from apps.learning.models import LearningLessonContent

    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="locked-reader@example.com")
    course = LearningCourse.objects.create(key="locked-content-course", title="Locked content")
    LearningLesson.objects.create(key="content-prerequisite", course=course, title="First", sort_order=1)
    lesson = LearningLesson.objects.create(key="content-locked", course=course, title="Second", sort_order=2)
    LearningLessonContent.objects.create(
        lesson=lesson, is_published=True, blocks=[{"type": "text", "text": "Secret until unlocked."}]
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/v1/learning/lessons/{lesson.key}/content/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_unpublished_lesson_content_is_not_exposed():
    from apps.learning.models import LearningLessonContent

    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="draft-reader@example.com")
    course = LearningCourse.objects.create(key="draft-content-course", title="Draft content")
    lesson = LearningLesson.objects.create(key="draft-content-lesson", course=course, title="Draft")
    LearningLessonContent.objects.create(
        lesson=lesson, is_published=False, blocks=[{"type": "text", "text": "Draft material."}]
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/v1/learning/lessons/{lesson.key}/content/")

    assert response.status_code == 404


@pytest.mark.django_db
def test_lesson_content_rejects_unsafe_media_url():
    from apps.learning.models import LearningLessonContent

    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="unsafe-content@example.com")
    course = LearningCourse.objects.create(key="unsafe-content-course", title="Unsafe content")
    lesson = LearningLesson.objects.create(key="unsafe-content-lesson", course=course, title="Unsafe")
    LearningLessonContent.objects.create(
        lesson=lesson,
        is_published=True,
        blocks=[{"type": "image", "url": "javascript:alert(1)", "alt": "Unsafe"}],
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/v1/learning/lessons/{lesson.key}/content/")

    assert response.status_code == 500
