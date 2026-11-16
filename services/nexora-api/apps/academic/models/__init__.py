from apps.academic.models.classroom import AcademicClassroom
from apps.academic.models.course import AcademicCourse
from apps.academic.models.curriculum import AcademicCurriculumCourse
from apps.academic.models.enrollment import AcademicEnrollment
from apps.academic.models.offering import AcademicCourseOffering
from apps.academic.models.prerequisite import AcademicCourseCompletion, AcademicCoursePrerequisite
from apps.academic.models.program import AcademicProgram
from apps.academic.models.schedule import AcademicOfferingSchedule
from apps.academic.models.study_plan import AcademicStudyPlan, AcademicStudyPlanItem
from apps.academic.models.term import AcademicTerm

__all__ = [
    "AcademicClassroom", "AcademicCourse", "AcademicCourseCompletion",
    "AcademicCourseOffering", "AcademicCoursePrerequisite", "AcademicOfferingSchedule",
    "AcademicCurriculumCourse", "AcademicEnrollment", "AcademicProgram",
    "AcademicStudyPlan", "AcademicStudyPlanItem", "AcademicTerm",
]
