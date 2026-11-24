from django.urls import path

from .evidence_api import (
    LearningCompetencyCatalogView,
    LearningEvidencePortfolioView,
    LearningSkillProfileView,
    LearningDevelopmentJourneyView,
    LearningCrossDomainPortfolioView,
)
from .evidence_review_api import (
    LearningEvidenceShareView,
    OrganizationEvidenceReviewQueueView,
    OrganizationEvidenceReviewView,
)
from .mastery_api import OrganizationMasteryAssessmentView, LearningOutcomeRubricView
from .development_api import LearningDevelopmentPlanView, LearningAssessmentHistoryView, LearningDevelopmentRecommendationsView

from .api import (
    LearningCompleteLessonView,
    LearningCompleteQuizView,
    LearningCoursesView,
    LearningProgressView,
    LearningAchievementsView,
    LearningHubView,
    LearningQuizView,
    LearningLessonContentView,
)

urlpatterns = [
    path("competencies/", LearningCompetencyCatalogView.as_view(), name="learning-competencies"),
    path("rubrics/", LearningOutcomeRubricView.as_view(), name="learning-outcome-rubrics"),
    path("development-plans/", LearningDevelopmentPlanView.as_view(), name="learning-development-plans"),
    path("development-recommendations/", LearningDevelopmentRecommendationsView.as_view(), name="learning-development-recommendations"),
    path("assessment-history/", LearningAssessmentHistoryView.as_view(), name="learning-assessment-history"),
    path("evidence/", LearningEvidencePortfolioView.as_view(), name="learning-evidence"),
    path("skills/", LearningSkillProfileView.as_view(), name="learning-skills"),
    path("journey/", LearningDevelopmentJourneyView.as_view(), name="learning-development-journey"),
    path("portfolio/cross-domain/", LearningCrossDomainPortfolioView.as_view(), name="learning-cross-domain-portfolio"),
    path("evidence/shares/", LearningEvidenceShareView.as_view(), name="learning-evidence-shares"),
    path("organizations/<uuid:organization_id>/evidence/review/", OrganizationEvidenceReviewQueueView.as_view(), name="learning-evidence-review-queue"),
    path("organizations/<uuid:organization_id>/evidence/<uuid:evidence_id>/review/", OrganizationEvidenceReviewView.as_view(), name="learning-evidence-review"),
    path("organizations/<uuid:organization_id>/mastery/assess/", OrganizationMasteryAssessmentView.as_view(), name="learning-mastery-assess"),
    path("courses/", LearningCoursesView.as_view(), name="learning-courses"),
    path("progress/", LearningProgressView.as_view(), name="learning-progress"),
    path("hub/", LearningHubView.as_view(), name="learning-hub"),
    path("achievements/", LearningAchievementsView.as_view(), name="learning-achievements"),
    path("lessons/<slug:lesson_key>/content/", LearningLessonContentView.as_view(), name="learning-lesson-content"),
    path("lessons/<slug:lesson_key>/quiz/", LearningQuizView.as_view(), name="learning-quiz"),
    path("lessons/<slug:lesson_key>/quiz/complete/", LearningCompleteQuizView.as_view(), name="learning-quiz-complete"),
    path("lessons/<slug:lesson_key>/complete/", LearningCompleteLessonView.as_view(), name="learning-complete"),
]
