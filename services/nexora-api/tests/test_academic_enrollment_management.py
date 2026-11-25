import pytest
from rest_framework.test import APIClient

from apps.academic.models import AcademicClassroom, AcademicEnrollment, AcademicProgram, AcademicTerm
from apps.control_plane.audit import ControlPlaneAuditEvent
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership
from apps.organizations.services import OrganizationService


@pytest.fixture
def enrollment_context(db):
    owner = NexoraUser.objects.create(email="enrollment-owner@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Enrollment School", created_by=owner)
    membership = Membership.objects.active().get(user=owner, organization=organization)
    term = AcademicTerm.objects.create(
        organization=organization, code="2027-1", name="Semester 1",
        starts_on="2027-01-01", ends_on="2027-06-30", status=AcademicTerm.Status.ACTIVE,
    )
    program = AcademicProgram.objects.create(organization=organization, code="CS", name="Computer Science")
    classroom = AcademicClassroom.objects.create(
        organization=organization, program=program, term=term,
        code="CS-A", name="Computer Science A", capacity=2, status=AcademicClassroom.Status.OPEN,
    )
    client = APIClient()
    client.force_authenticate(user=owner)
    return owner, organization, membership, classroom, client


@pytest.mark.django_db
def test_member_can_be_enrolled_and_audit_event_is_written(enrollment_context):
    owner, organization, membership, classroom, client = enrollment_context
    response = client.post(
        f"/api/v1/organizations/{organization.id}/academic/classrooms/{classroom.id}/enrollments/",
        {"membership_id": str(membership.id), "role": "student"},
        format="json",
    )
    assert response.status_code == 201
    assert response.data["data"]["membership_id"] == str(membership.id)
    assert response.data["data"]["classroom_id"] == str(classroom.id)
    event = ControlPlaneAuditEvent.objects.get(
        event_type="ACADEMIC_RESOURCE_CHANGED",
        metadata__resource="enrollments",
    )
    assert event.actor_id == owner.id
    assert event.metadata["action"] == "enrolled"


@pytest.mark.django_db
def test_enrollment_rejects_duplicate_active_member_role(enrollment_context):
    _, organization, membership, classroom, client = enrollment_context
    url = f"/api/v1/organizations/{organization.id}/academic/classrooms/{classroom.id}/enrollments/"
    first = client.post(url, {"membership_id": str(membership.id)}, format="json")
    second = client.post(url, {"membership_id": str(membership.id)}, format="json")
    assert first.status_code == 201
    assert second.status_code == 400
    assert AcademicEnrollment.objects.filter(classroom=classroom, membership=membership, status="active").count() == 1


@pytest.mark.django_db
def test_student_capacity_is_enforced_but_instructors_do_not_consume_seats(enrollment_context):
    _, organization, membership, classroom, client = enrollment_context
    second_user = NexoraUser.objects.create(email="second-student@school.test", status=NexoraUser.Status.ACTIVE)
    second_membership = Membership.objects.create(
        user=second_user, organization=organization, role=membership.role,
    )
    third_user = NexoraUser.objects.create(email="third-student@school.test", status=NexoraUser.Status.ACTIVE)
    third_membership = Membership.objects.create(
        user=third_user, organization=organization, role=membership.role,
    )
    url = f"/api/v1/organizations/{organization.id}/academic/classrooms/{classroom.id}/enrollments/"
    assert client.post(url, {"membership_id": str(membership.id)}, format="json").status_code == 201
    assert client.post(url, {"membership_id": str(second_membership.id)}, format="json").status_code == 201
    rejected = client.post(url, {"membership_id": str(third_membership.id)}, format="json")
    assert rejected.status_code == 400
    instructor = client.post(
        url, {"membership_id": str(third_membership.id), "role": "instructor"}, format="json",
    )
    assert instructor.status_code == 201


@pytest.mark.django_db
def test_enrollment_requires_active_membership_in_same_organization(enrollment_context):
    _, organization, membership, classroom, client = enrollment_context
    membership.status = Membership.Status.SUSPENDED
    membership.save(update_fields=("status", "updated_at"))
    response = client.post(
        f"/api/v1/organizations/{organization.id}/academic/classrooms/{classroom.id}/enrollments/",
        {"membership_id": str(membership.id)},
        format="json",
    )
    assert response.status_code == 400
    assert not AcademicEnrollment.objects.filter(classroom=classroom).exists()


@pytest.mark.django_db
def test_enrollment_rejects_closed_classroom(enrollment_context):
    _, organization, membership, classroom, client = enrollment_context
    classroom.status = AcademicClassroom.Status.COMPLETED
    classroom.save(update_fields=("status", "updated_at"))
    response = client.post(
        f"/api/v1/organizations/{organization.id}/academic/classrooms/{classroom.id}/enrollments/",
        {"membership_id": str(membership.id)},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_enrollment_status_is_terminal_after_withdrawal(enrollment_context):
    _, organization, membership, classroom, client = enrollment_context
    created = client.post(
        f"/api/v1/organizations/{organization.id}/academic/classrooms/{classroom.id}/enrollments/",
        {"membership_id": str(membership.id)},
        format="json",
    )
    enrollment_id = created.data["data"]["id"]
    detail_url = f"/api/v1/organizations/{organization.id}/academic/enrollments/{enrollment_id}/"
    withdrawn = client.patch(detail_url, {"status": "withdrawn"}, format="json")
    reopened = client.patch(detail_url, {"status": "active"}, format="json")
    assert withdrawn.status_code == 200
    assert reopened.status_code == 400


@pytest.mark.django_db
def test_enrollment_id_from_another_organization_is_not_disclosed(enrollment_context):
    _, organization, membership, classroom, client = enrollment_context
    enrollment = AcademicEnrollment.objects.create(
        organization=organization, classroom=classroom, term=classroom.term, membership=membership,
    )
    other_owner = NexoraUser.objects.create(email="other-enrollment-owner@school.test", status=NexoraUser.Status.ACTIVE)
    other_organization = OrganizationService.create_organization(name="Other Enrollment School", created_by=other_owner)
    response = client.get(
        f"/api/v1/organizations/{other_organization.id}/academic/enrollments/{enrollment.id}/",
    )
    assert response.status_code == 404
