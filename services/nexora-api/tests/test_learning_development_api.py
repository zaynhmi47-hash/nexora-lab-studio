from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.identity.models import NexoraUser
from apps.learning.evidence_review import validate_rubric_scores
from apps.learning.models import (
    LearningCompetency,
    LearningDevelopmentPlan,
    LearningEvidence,
    LearningDevelopmentTask,
    LearningDevelopmentTaskEvidence,
    LearningMasteryAssessmentEvent,
    LearningOutcome,
    LearningOutcomeRubric,
    LearningCourse,
    LearningLesson,
    LearningLessonContent,
    LearningOutcomeLessonMapping,
    LearningLessonCompletion,
)


def create_outcome(key):
    competency = LearningCompetency.objects.create(
        key=f"{key}-competency", title="Critical thinking", domain="intellectual", is_published=True,
    )
    return LearningOutcome.objects.create(
        key=key, competency=competency, title="Evaluate a claim", is_published=True,
    )


@pytest.mark.django_db
def test_learner_can_create_and_update_private_development_plan():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="plan-owner@example.com")
    outcome = create_outcome("plan-evaluate-claim")
    client = APIClient()
    client.force_authenticate(user=user)

    created = client.post(
        "/api/v1/learning/development-plans/",
        {
            "outcomeKey": outcome.key,
            "targetLevel": 4,
            "actions": ["Compare two sources", "Write a reasoned conclusion"],
        },
        format="json",
    )

    assert created.status_code == 201
    payload = created.json()
    assert payload["currentAssessedLevel"] is None
    assert payload["gap"] is None
    assert payload["gapStatus"] == "needs_assessment"
    assert payload["targetLevel"] == 4
    plan = LearningDevelopmentPlan.objects.get(id=payload["id"], user=user)

    updated = client.patch(
        "/api/v1/learning/development-plans/",
        {"planId": str(plan.id), "status": "completed", "reflection": "I can now explain my reasoning."},
        format="json",
    )

    assert updated.status_code == 200
    assert updated.json()["status"] == "completed"
    assert updated.json()["reflection"] == "I can now explain my reasoning."


@pytest.mark.django_db
def test_development_plans_are_owner_scoped_and_validate_actions():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="plan-private-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="plan-private-other@example.com")
    outcome = create_outcome("plan-private-outcome")
    plan = LearningDevelopmentPlan.objects.create(
        user=owner, outcome=outcome, target_level=3, actions=["Practice"],
    )
    client = APIClient()
    client.force_authenticate(user=other)

    listing = client.get("/api/v1/learning/development-plans/")
    update = client.patch(
        "/api/v1/learning/development-plans/",
        {"planId": str(plan.id), "status": "completed"},
        format="json",
    )
    invalid = client.post(
        "/api/v1/learning/development-plans/",
        {"outcomeKey": outcome.key, "targetLevel": 6, "actions": ["Practice"]},
        format="json",
    )

    assert listing.status_code == 200
    assert listing.json() == []
    assert update.status_code == 404
    assert invalid.status_code == 400


@pytest.mark.django_db
def test_assessment_history_is_private_to_learner():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="history-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="history-other@example.com")
    assessor = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="history-assessor@example.com")
    outcome = create_outcome("history-outcome")
    LearningMasteryAssessmentEvent.objects.create(
        user=owner, outcome=outcome, level=3, status="verified",
        assessment_method="portfolio_review", rationale="Clear evidence of application.",
        assessed_by=assessor, assessed_at=timezone.now(), rubric_version=2, criterion_scores={"reasoning": 4},
    )
    client = APIClient()
    client.force_authenticate(user=other)

    response = client.get("/api/v1/learning/assessment-history/")

    assert response.status_code == 200
    assert response.json() == []

    client.force_authenticate(user=owner)
    owner_history = client.get("/api/v1/learning/assessment-history/")
    assert owner_history.status_code == 200
    assert owner_history.json()[0]["rubricVersion"] == 2
    assert owner_history.json()[0]["criterionScores"] == {"reasoning": 4}


@pytest.mark.django_db
def test_authenticated_learner_can_read_active_outcome_rubric():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="rubric-reader@example.com")
    outcome = create_outcome("rubric-outcome")
    criteria = [
        {
            "key": "reasoning",
            "title": "Reasoning quality",
            "description": "Explains conclusions with relevant evidence.",
            "weight": 1,
            "levels": {
                "1": "States an unsupported conclusion.",
                "2": "Provides a partial explanation.",
                "3": "Connects a claim to some evidence.",
                "4": "Evaluates evidence and alternatives.",
                "5": "Synthesizes evidence and limitations independently.",
            },
        },
        {
            "key": "communication",
            "title": "Communication",
            "description": "Communicates the reasoning clearly.",
            "weight": 1,
            "levels": {
                "1": "Explanation is unclear.",
                "2": "Explanation is partly understandable.",
                "3": "Explains the main reasoning.",
                "4": "Explains reasoning clearly for the audience.",
                "5": "Adapts a precise explanation to complex audiences.",
            },
        },
    ]
    LearningOutcomeRubric.objects.create(outcome=outcome, version=2, criteria=criteria, is_active=True)
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/v1/learning/rubrics/?outcomeKey={outcome.key}")

    assert response.status_code == 200
    assert response.json()["version"] == 2
    assert [item["key"] for item in response.json()["criteria"]] == ["reasoning", "communication"]
    assert len(response.json()["levelScale"]) == 5


@pytest.mark.django_db
def test_rubric_endpoint_does_not_expose_inactive_or_unpublished_outcomes():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="rubric-hidden@example.com")
    outcome = create_outcome("rubric-hidden-outcome")
    LearningOutcomeRubric.objects.create(
        outcome=outcome, version=1, criteria=[{"key": "reasoning"}], is_active=False,
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get(f"/api/v1/learning/rubrics/?outcomeKey={outcome.key}")

    assert response.status_code == 404



def test_rubric_score_validation_requires_complete_valid_criterion_scores():
    criteria = [
        {
            "key": "reasoning",
            "title": "Reasoning",
            "description": "Explains conclusions with evidence.",
            "weight": 2,
            "levels": {str(level): f"Descriptor for level {level}" for level in range(1, 6)},
        },
        {
            "key": "communication",
            "title": "Communication",
            "description": "Communicates clearly.",
            "weight": 1,
            "levels": {str(level): f"Descriptor for level {level}" for level in range(1, 6)},
        },
    ]

    assert validate_rubric_scores(criteria, {"reasoning": 4, "communication": 3}) == {
        "reasoning": 4, "communication": 3,
    }
    with pytest.raises(ValueError, match="every rubric criterion"):
        validate_rubric_scores(criteria, {"reasoning": 4})
    with pytest.raises(ValueError, match="integer from 1 to 5"):
        validate_rubric_scores(criteria, {"reasoning": True, "communication": 3})
    with pytest.raises(ValueError, match="invalid key"):
        validate_rubric_scores([criteria[0], criteria[0]], {"reasoning": 4})



@pytest.mark.django_db
def test_development_recommendations_only_return_published_mapped_lessons_and_completion_state():
    learner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="recommendation-learner@example.com")
    outcome = create_outcome("recommendation-outcome")
    course = LearningCourse.objects.create(key="reasoning-course", title="Reasoning foundations", is_published=True)
    lesson = LearningLesson.objects.create(
        key="compare-sources", course=course, title="Compare sources",
        description="Practice comparing evidence.", kind=LearningLesson.Kind.LESSON, is_published=True,
    )
    LearningLessonContent.objects.create(
        lesson=lesson, version=1, estimated_minutes=12, blocks=[{"type": "text", "text": "Compare two sources."}], is_published=True,
    )
    LearningOutcomeLessonMapping.objects.create(
        lesson=lesson, outcome=outcome, contribution_type=LearningOutcomeLessonMapping.ContributionType.PRACTICED,
        is_active=True,
    )
    hidden = LearningLesson.objects.create(
        key="hidden-lesson", course=course, title="Hidden lesson", is_published=False,
    )
    LearningOutcomeLessonMapping.objects.create(lesson=hidden, outcome=outcome, is_active=True)
    LearningLessonCompletion.objects.create(user=learner, lesson=lesson, completed_at=timezone.now())
    client = APIClient()
    client.force_authenticate(user=learner)

    response = client.get(f"/api/v1/learning/development-recommendations/?outcomeKey={outcome.key}")

    assert response.status_code == 200
    assert len(response.json()["resources"]) == 1
    resource = response.json()["resources"][0]
    assert resource["lessonKey"] == lesson.key
    assert resource["contributionType"] == "practiced"
    assert resource["estimatedMinutes"] == 12
    assert resource["completed"] is True
    assert resource["route"] == f"/lesson/{lesson.key}"


@pytest.mark.django_db
def test_development_recommendations_require_a_published_outcome():
    learner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="recommendation-private@example.com")
    outcome = create_outcome("recommendation-unpublished", published=False)
    client = APIClient()
    client.force_authenticate(user=learner)

    response = client.get(f"/api/v1/learning/development-recommendations/?outcomeKey={outcome.key}")

    assert response.status_code == 404



@pytest.mark.django_db
def test_development_gap_uses_latest_explicit_assessment_event():
    learner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="gap-learner@example.com")
    assessor = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="gap-assessor@example.com")
    outcome = create_outcome("gap-outcome")
    plan = LearningDevelopmentPlan.objects.create(
        user=learner, outcome=outcome, target_level=5, actions=["Practice and request feedback"],
    )
    first_assessed_at = timezone.now()
    LearningMasteryAssessmentEvent.objects.create(
        user=learner, outcome=outcome, level=2, status="verified",
        assessment_method="portfolio_review", rationale="Earlier review.",
        assessed_by=assessor, assessed_at=first_assessed_at,
    )
    latest_assessed_at = first_assessed_at + timedelta(days=7)
    LearningMasteryAssessmentEvent.objects.create(
        user=learner, outcome=outcome, level=4, status="provisional",
        assessment_method="observed_practice", rationale="More recent review.",
        assessed_by=assessor, assessed_at=latest_assessed_at,
    )
    client = APIClient()
    client.force_authenticate(user=learner)

    response = client.get("/api/v1/learning/development-plans/")

    assert response.status_code == 200
    item = next(row for row in response.json() if row["id"] == str(plan.id))
    assert item["currentAssessedLevel"] == 4
    assert item["gap"] == 1
    assert item["assessmentStatus"] == "provisional"
    assert item["gapStatus"] == "development_needed"
    assert item["lastAssessedAt"] == latest_assessed_at.isoformat()



@pytest.mark.django_db
def test_development_gap_distinguishes_unassessed_and_target_reached():
    learner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="gap-state-learner@example.com")
    assessor = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="gap-state-assessor@example.com")
    unassessed_outcome = create_outcome("gap-state-unassessed")
    reached_outcome = create_outcome("gap-state-reached")
    unassessed_plan = LearningDevelopmentPlan.objects.create(
        user=learner, outcome=unassessed_outcome, target_level=3, actions=["Request an assessment"],
    )
    reached_plan = LearningDevelopmentPlan.objects.create(
        user=learner, outcome=reached_outcome, target_level=3, actions=["Maintain practice"],
    )
    LearningMasteryAssessmentEvent.objects.create(
        user=learner, outcome=reached_outcome, level=4, status="verified",
        assessment_method="observed_practice", rationale="Consistent independent performance.",
        assessed_by=assessor, assessed_at=timezone.now(),
    )
    client = APIClient()
    client.force_authenticate(user=learner)

    response = client.get("/api/v1/learning/development-plans/")

    assert response.status_code == 200
    items = {row["id"]: row for row in response.json()}
    assert items[str(unassessed_plan.id)]["gapStatus"] == "needs_assessment"
    assert items[str(unassessed_plan.id)]["gap"] == 3
    assert items[str(reached_plan.id)]["gapStatus"] == "target_reached"
    assert items[str(reached_plan.id)]["gap"] == 0


@pytest.mark.django_db
def test_gap_analysis_covers_unassessed_assessed_and_planned_outcomes_privately():
    learner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="gap-analysis-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="gap-analysis-other@example.com")
    assessor = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="gap-analysis-assessor@example.com")
    unassessed = create_outcome("gap-analysis-unassessed")
    assessed = create_outcome("gap-analysis-assessed")
    planned = create_outcome("gap-analysis-planned")
    LearningMasteryAssessmentEvent.objects.create(
        user=learner, outcome=assessed, level=2, status="verified",
        assessment_method="portfolio_review", rationale="Evidence reviewed.",
        assessed_by=assessor, assessed_at=timezone.now(),
    )
    LearningMasteryAssessmentEvent.objects.create(
        user=learner, outcome=planned, level=3, status="provisional",
        assessment_method="observed_practice", rationale="Observed performance.",
        assessed_by=assessor, assessed_at=timezone.now(),
    )
    LearningDevelopmentPlan.objects.create(
        user=learner, outcome=planned, target_level=5, actions=["Practice with feedback"],
    )
    client = APIClient()
    client.force_authenticate(user=learner)

    response = client.get("/api/v1/learning/development-gap-analysis/")

    assert response.status_code == 200
    rows = {row["outcomeKey"]: row for row in response.json()["results"]}
    assert rows[unassessed.key]["gapStatus"] == "needs_assessment"
    assert rows[assessed.key]["gapStatus"] == "plan_needed"
    assert rows[planned.key]["gapStatus"] == "development_needed"
    assert rows[planned.key]["currentAssessedLevel"] == 3
    assert rows[planned.key]["gap"] == 2

    client.force_authenticate(user=other)
    other_response = client.get("/api/v1/learning/development-gap-analysis/")
    other_rows = {row["outcomeKey"]: row for row in other_response.json()["results"]}
    assert other_rows[planned.key]["assessmentStatus"] == "unassessed"
    assert other_rows[planned.key]["planId"] is None


@pytest.mark.django_db
def test_development_task_lifecycle_and_private_evidence_do_not_change_mastery():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="task-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="task-other@example.com")
    outcome = create_outcome("task-lifecycle-outcome")
    plan = LearningDevelopmentPlan.objects.create(
        user=owner, outcome=outcome, target_level=4, actions=["Build a working prototype"],
    )
    client = APIClient()
    client.force_authenticate(user=owner)

    created = client.post(
        f"/api/v1/learning/development-plans/{plan.id}/tasks/",
        {"title": "Build prototype", "description": "Apply the concept in a small project.", "sortOrder": 1},
        format="json",
    )
    assert created.status_code == 201
    task_id = created.json()["id"]
    assert created.json()["status"] == "not_started"

    progressed = client.patch(
        f"/api/v1/learning/development-tasks/{task_id}/",
        {"status": "in_progress"},
        format="json",
    )
    assert progressed.status_code == 200
    assert progressed.json()["status"] == "in_progress"

    evidence = client.post(
        f"/api/v1/learning/development-tasks/{task_id}/evidence/",
        {
            "evidenceType": "project",
            "title": "Prototype demonstration",
            "description": "A short walkthrough of the working prototype.",
            "artifactUrl": "https://example.com/prototype",
        },
        format="json",
    )
    assert evidence.status_code == 201
    assert evidence.json()["evidenceType"] == "project"
    assert evidence.json()["portfolioEvidenceId"]
    portfolio_item = LearningEvidence.objects.get(id=evidence.json()["portfolioEvidenceId"])
    assert portfolio_item.user_id == owner.id
    assert portfolio_item.outcome_id == outcome.id
    assert portfolio_item.status == LearningEvidence.Status.PENDING
    assert portfolio_item.organization_shares.count() == 0
    assert LearningDevelopmentTaskEvidence.objects.filter(task_id=task_id).count() == 1
    assert not LearningMasteryAssessmentEvent.objects.filter(user=owner, outcome=outcome).exists()

    client.force_authenticate(user=other)
    assert client.get(f"/api/v1/learning/development-plans/{plan.id}/tasks/").status_code == 404
    assert client.patch(
        f"/api/v1/learning/development-tasks/{task_id}/",
        {"status": "completed"},
        format="json",
    ).status_code == 404
    assert client.get(f"/api/v1/learning/development-tasks/{task_id}/evidence/").status_code == 404


@pytest.mark.django_db
def test_development_task_evidence_rejects_non_https_artifact_urls():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="task-url-owner@example.com")
    outcome = create_outcome("task-url-outcome")
    plan = LearningDevelopmentPlan.objects.create(
        user=owner, outcome=outcome, target_level=3, actions=["Practice"],
    )
    task = LearningDevelopmentTask.objects.create(plan=plan, title="Practice")
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.post(
        f"/api/v1/learning/development-tasks/{task.id}/evidence/",
        {"title": "Unsafe link", "artifactUrl": "http://example.com/file"},
        format="json",
    )

    assert response.status_code == 400
    assert LearningDevelopmentTaskEvidence.objects.filter(task=task).count() == 0


@pytest.mark.django_db
def test_development_tasks_cannot_be_created_for_paused_or_completed_plans():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="task-paused-owner@example.com")
    outcome = create_outcome("task-paused-outcome")
    plan = LearningDevelopmentPlan.objects.create(
        user=owner, outcome=outcome, target_level=3, actions=["Practice"],
        status=LearningDevelopmentPlan.Status.PAUSED,
    )
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.post(
        f"/api/v1/learning/development-plans/{plan.id}/tasks/",
        {"title": "New task"},
        format="json",
    )

    assert response.status_code == 404
