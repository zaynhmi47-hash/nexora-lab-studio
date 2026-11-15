import pytest
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.academic.models import AcademicClassroom, AcademicEnrollment, AcademicProgram, AcademicTerm
from apps.identity.models import NexoraUser
from apps.organizations.services import MembershipService, OrganizationService


@pytest.mark.django_db
def test_academic_overview_is_scoped_to_requested_organization():
    owner_a = NexoraUser.objects.create(email="owner-a@school.test", status=NexoraUser.Status.ACTIVE)
    owner_b = NexoraUser.objects.create(email="owner-b@school.test", status=NexoraUser.Status.ACTIVE)
    org_a = OrganizationService.create_organization(name="School A", created_by=owner_a)
    org_b = OrganizationService.create_organization(name="School B", created_by=owner_b)

    term_a = AcademicTerm.objects.create(
        organization=org_a,
        code="2026-1",
        name="Semester 1",
        starts_on="2026-01-01",
        ends_on="2026-06-30",
        status=AcademicTerm.Status.ACTIVE,
    )
    program_a = AcademicProgram.objects.create(organization=org_a, code="CS", name="Computer Science")
    AcademicClassroom.objects.create(
        organization=org_a,
        program=program_a,
        term=term_a,
        code="CS-A",
        name="Computer Science A",
        status=AcademicClassroom.Status.OPEN,
    )
    term_b = AcademicTerm.objects.create(
        organization=org_b,
        code="2026-1",
        name="Semester 1",
        starts_on="2026-01-01",
        ends_on="2026-06-30",
        status=AcademicTerm.Status.ACTIVE,
    )
    AcademicProgram.objects.create(organization=org_b, code="LAW", name="Law")
    assert term_b.organization_id != term_a.organization_id

    client = APIClient()
    client.force_authenticate(user=owner_a)
    response = client.get(f"/api/v1/organizations/{org_a.id}/academic/overview/")

    assert response.status_code == 200
    payload = response.json()["data"]
    assert [term["code"] for term in payload["terms"]] == ["2026-1"]
    assert [program["code"] for program in payload["programs"]] == ["CS"]
    assert [classroom["code"] for classroom in payload["classrooms"]] == ["CS-A"]


@pytest.mark.django_db
def test_academic_overview_denies_user_from_another_organization():
    owner_a = NexoraUser.objects.create(email="owner-a@school.test", status=NexoraUser.Status.ACTIVE)
    owner_b = NexoraUser.objects.create(email="owner-b@school.test", status=NexoraUser.Status.ACTIVE)
    org_a = OrganizationService.create_organization(name="School A", created_by=owner_a)
    org_b = OrganizationService.create_organization(name="School B", created_by=owner_b)

    client = APIClient()
    client.force_authenticate(user=owner_a)
    response = client.get(f"/api/v1/organizations/{org_b.id}/academic/overview/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_classroom_rejects_program_or_term_from_another_organization():
    owner_a = NexoraUser.objects.create(email="owner-a@school.test", status=NexoraUser.Status.ACTIVE)
    owner_b = NexoraUser.objects.create(email="owner-b@school.test", status=NexoraUser.Status.ACTIVE)
    org_a = OrganizationService.create_organization(name="School A", created_by=owner_a)
    org_b = OrganizationService.create_organization(name="School B", created_by=owner_b)
    term_a = AcademicTerm.objects.create(
        organization=org_a,
        code="A-1",
        name="Term A",
        starts_on="2026-01-01",
        ends_on="2026-06-30",
    )
    program_b = AcademicProgram.objects.create(organization=org_b, code="B", name="Program B")

    classroom = AcademicClassroom(
        organization=org_a,
        program=program_b,
        term=term_a,
        code="A-CLASS",
        name="Invalid cross-tenant class",
    )
    with pytest.raises(ValidationError, match="program"):
        classroom.full_clean()


@pytest.mark.django_db
def test_enrollment_rejects_membership_from_another_organization():
    owner_a = NexoraUser.objects.create(email="owner-a@school.test", status=NexoraUser.Status.ACTIVE)
    owner_b = NexoraUser.objects.create(email="owner-b@school.test", status=NexoraUser.Status.ACTIVE)
    student = NexoraUser.objects.create(email="student@school.test", status=NexoraUser.Status.ACTIVE)
    org_a = OrganizationService.create_organization(name="School A", created_by=owner_a)
    org_b = OrganizationService.create_organization(name="School B", created_by=owner_b)
    term = AcademicTerm.objects.create(
        organization=org_a,
        code="A-1",
        name="Term A",
        starts_on="2026-01-01",
        ends_on="2026-06-30",
    )
    program = AcademicProgram.objects.create(organization=org_a, code="A", name="Program A")
    classroom = AcademicClassroom.objects.create(
        organization=org_a,
        program=program,
        term=term,
        code="A-CLASS",
        name="Class A",
    )
    membership_b = MembershipService.add_user(user=student, organization_id=org_b.id)
    enrollment = AcademicEnrollment(
        organization=org_a,
        classroom=classroom,
        term=term,
        membership=membership_b,
    )

    with pytest.raises(ValidationError, match="membership"):
        enrollment.full_clean()
