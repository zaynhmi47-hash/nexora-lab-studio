import pytest
from django.core.exceptions import ValidationError

from apps.academic.models import (
    AcademicClassroom,
    AcademicCourse,
    AcademicCourseOffering,
    AcademicEnrollment,
    AcademicOfferingSchedule,
    AcademicProgram,
    AcademicStudyPlan,
    AcademicStudyPlanItem,
    AcademicTerm,
)
from apps.academic.rules.schedules import AcademicScheduleService
from apps.academic.study_plan_services import AcademicStudyPlanService
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership
from apps.organizations.services import OrganizationService


@pytest.fixture
def schedule_context():
    owner = NexoraUser.objects.create(
        email="schedule-owner@school.test",
        status=NexoraUser.Status.ACTIVE,
    )
    organization = OrganizationService.create_organization(
        name="Schedule School",
        created_by=owner,
    )
    membership = Membership.objects.get(organization=organization, user=owner)
    program = AcademicProgram.objects.create(
        organization=organization,
        code="SCH",
        name="Schedule Program",
    )
    term = AcademicTerm.objects.create(
        organization=organization,
        code="SCH-2026",
        name="Schedule Term",
        starts_on="2026-01-01",
        ends_on="2026-12-31",
        status=AcademicTerm.Status.ACTIVE,
    )
    classroom = AcademicClassroom.objects.create(
        organization=organization,
        program=program,
        term=term,
        code="SCH-A",
        name="Schedule Classroom",
        status=AcademicClassroom.Status.OPEN,
    )
    first_course = AcademicCourse.objects.create(
        organization=organization,
        code="SCH101",
        name="Schedule Fundamentals",
        credit_units=3,
    )
    second_course = AcademicCourse.objects.create(
        organization=organization,
        code="SCH102",
        name="Schedule Practice",
        credit_units=3,
    )
    first_offering = AcademicCourseOffering.objects.create(
        organization=organization,
        classroom=classroom,
        course=first_course,
        code="SCH101-A",
        status=AcademicCourseOffering.Status.OPEN,
    )
    second_offering = AcademicCourseOffering.objects.create(
        organization=organization,
        classroom=classroom,
        course=second_course,
        code="SCH102-A",
        status=AcademicCourseOffering.Status.OPEN,
    )
    plan = AcademicStudyPlan.objects.create(
        organization=organization,
        membership=membership,
        term=term,
    )
    AcademicStudyPlanItem.objects.create(
        study_plan=plan,
        organization=organization,
        offering=first_offering,
        credit_units_snapshot=3,
    )
    return {
        "owner": owner,
        "organization": organization,
        "membership": membership,
        "term": term,
        "classroom": classroom,
        "first_offering": first_offering,
        "second_offering": second_offering,
        "plan": plan,
    }


@pytest.mark.django_db
def test_schedule_engine_detects_overlapping_selected_offerings(schedule_context):
    ctx = schedule_context
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["first_offering"],
        weekday=AcademicOfferingSchedule.Weekday.MONDAY,
        starts_at="09:00",
        ends_at="10:30",
    )
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["second_offering"],
        weekday=AcademicOfferingSchedule.Weekday.MONDAY,
        starts_at="10:00",
        ends_at="11:00",
    )

    result = AcademicScheduleService.evaluate_candidate(
        plan=ctx["plan"],
        offering=ctx["second_offering"],
    )

    assert result["has_conflict"] is True
    assert result["status"] == "conflict"
    assert result["conflicts"][0]["offering_code"] == "SCH101-A"


@pytest.mark.django_db
def test_adjacent_schedule_slots_do_not_conflict(schedule_context):
    ctx = schedule_context
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["first_offering"],
        weekday=AcademicOfferingSchedule.Weekday.TUESDAY,
        starts_at="09:00",
        ends_at="10:00",
    )
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["second_offering"],
        weekday=AcademicOfferingSchedule.Weekday.TUESDAY,
        starts_at="10:00",
        ends_at="11:00",
    )

    result = AcademicScheduleService.evaluate_candidate(
        plan=ctx["plan"],
        offering=ctx["second_offering"],
    )

    assert result["has_conflict"] is False
    assert result["status"] == "scheduled"


@pytest.mark.django_db
def test_same_time_on_different_weekdays_does_not_conflict(schedule_context):
    ctx = schedule_context
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["first_offering"],
        weekday=AcademicOfferingSchedule.Weekday.MONDAY,
        starts_at="09:00",
        ends_at="10:00",
    )
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["second_offering"],
        weekday=AcademicOfferingSchedule.Weekday.WEDNESDAY,
        starts_at="09:00",
        ends_at="10:00",
    )

    result = AcademicScheduleService.evaluate_candidate(
        plan=ctx["plan"],
        offering=ctx["second_offering"],
    )

    assert result["has_conflict"] is False


@pytest.mark.django_db
def test_offering_cannot_have_overlapping_sessions_on_same_day(schedule_context):
    ctx = schedule_context
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["first_offering"],
        weekday=AcademicOfferingSchedule.Weekday.THURSDAY,
        starts_at="09:00",
        ends_at="10:30",
    )

    with pytest.raises(ValidationError, match="overlapping"):
        AcademicScheduleService.create_slot(
            organization=ctx["organization"],
            offering=ctx["first_offering"],
            weekday=AcademicOfferingSchedule.Weekday.THURSDAY,
            starts_at="10:00",
            ends_at="11:00",
        )


@pytest.mark.django_db
def test_schedule_engine_reports_missing_schedule_as_pending(schedule_context):
    ctx = schedule_context
    result = AcademicScheduleService.evaluate_plan(plan=ctx["plan"])

    assert result["has_conflict"] is False
    assert result["status"] == "schedule_pending"
    assert result["unscheduled_offerings"] == ["SCH101-A"]


@pytest.mark.django_db
def test_krs_add_offering_rejects_schedule_conflict(schedule_context):
    ctx = schedule_context
    AcademicEnrollment.objects.create(
        organization=ctx["organization"],
        classroom=ctx["classroom"],
        term=ctx["term"],
        membership=ctx["membership"],
        role=AcademicEnrollment.Role.STUDENT,
        status=AcademicEnrollment.Status.ACTIVE,
    )
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["first_offering"],
        weekday=AcademicOfferingSchedule.Weekday.FRIDAY,
        starts_at="13:00",
        ends_at="14:00",
    )
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["second_offering"],
        weekday=AcademicOfferingSchedule.Weekday.FRIDAY,
        starts_at="13:30",
        ends_at="14:30",
    )

    with pytest.raises(ValidationError, match="overlaps"):
        AcademicStudyPlanService.add_offering(
            plan_id=ctx["plan"].id,
            organization=ctx["organization"],
            offering_id=ctx["second_offering"].id,
        )

@pytest.mark.django_db
def test_study_plan_validation_rejects_existing_schedule_conflict(schedule_context):
    ctx = schedule_context
    AcademicStudyPlanItem.objects.create(
        study_plan=ctx["plan"],
        organization=ctx["organization"],
        offering=ctx["second_offering"],
        credit_units_snapshot=3,
    )
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["first_offering"],
        weekday=AcademicOfferingSchedule.Weekday.SATURDAY,
        starts_at="08:00",
        ends_at="09:30",
    )
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["second_offering"],
        weekday=AcademicOfferingSchedule.Weekday.SATURDAY,
        starts_at="09:00",
        ends_at="10:00",
    )

    with pytest.raises(ValidationError, match="overlapping"):
        AcademicScheduleService.ensure_plan_has_no_conflicts(plan=ctx["plan"])


@pytest.mark.django_db
def test_schedule_update_rejects_overlap_with_another_slot(schedule_context):
    ctx = schedule_context
    first = AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["first_offering"],
        weekday=AcademicOfferingSchedule.Weekday.SUNDAY,
        starts_at="08:00",
        ends_at="09:00",
    )
    AcademicScheduleService.create_slot(
        organization=ctx["organization"],
        offering=ctx["first_offering"],
        weekday=AcademicOfferingSchedule.Weekday.SUNDAY,
        starts_at="10:00",
        ends_at="11:00",
    )

    with pytest.raises(ValidationError, match="overlapping"):
        AcademicScheduleService.update_slot(
            organization=ctx["organization"],
            slot_id=first.id,
            changes={"starts_at": "10:30", "ends_at": "11:30"},
        )
