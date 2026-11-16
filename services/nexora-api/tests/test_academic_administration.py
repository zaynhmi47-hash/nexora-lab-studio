import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.academic.models import AcademicClassroom, AcademicProgram, AcademicTerm
from apps.control_plane.audit import ControlPlaneAuditEvent
from apps.identity.models import NexoraUser
from apps.organizations.services import OrganizationService


@pytest.fixture
def academic_context(db):
    owner = NexoraUser.objects.create(email="academic-owner@school.test", status=NexoraUser.Status.ACTIVE)
    organization = OrganizationService.create_organization(name="Academic School", created_by=owner)
    client = APIClient()
    client.force_authenticate(user=owner)
    return owner, organization, client


@pytest.mark.django_db
def test_owner_can_create_program_and_audit_event_is_written(academic_context):
    owner, organization, client = academic_context
    response = client.post(
        f"/api/v1/organizations/{organization.id}/academic/programs/",
        {"code": "CS", "name": "Computer Science", "description": "Computing program"},
        format="json",
    )
    assert response.status_code == 201
    assert response.data["data"]["code"] == "CS"
    event = ControlPlaneAuditEvent.objects.get(event_type="ACADEMIC_RESOURCE_CHANGED")
    assert event.actor_id == owner.id
    assert event.metadata["organization_id"] == str(organization.id)
    assert event.metadata["action"] == "created"
    assert event.metadata["resource"] == "programs"


@pytest.mark.django_db
def test_academic_admin_api_rejects_cross_tenant_classroom_relations(academic_context):
    owner, organization, client = academic_context
    other_owner = NexoraUser.objects.create(email="other-academic-owner@school.test", status=NexoraUser.Status.ACTIVE)
    other_organization = OrganizationService.create_organization(name="Other School", created_by=other_owner)
    foreign_program = AcademicProgram.objects.create(
        organization=other_organization, code="LAW", name="Law Program",
    )
    term = AcademicTerm.objects.create(
        organization=organization, code="2026-2", name="Semester 2",
        starts_on="2026-07-01", ends_on="2026-12-31",
    )
    response = client.post(
        f"/api/v1/organizations/{organization.id}/academic/classrooms/",
        {
            "program": str(foreign_program.id), "term": str(term.id),
            "code": "LAW-A", "name": "Foreign program classroom",
        },
        format="json",
    )
    assert response.status_code == 400
    assert "program" in str(response.data).lower()
    assert not AcademicClassroom.objects.filter(organization=organization).exists()


@pytest.mark.django_db
def test_term_state_transition_rejects_reopening_closed_term(academic_context):
    owner, organization, client = academic_context
    term = AcademicTerm.objects.create(
        organization=organization, code="2026-1", name="Semester 1",
        starts_on="2026-01-01", ends_on="2026-06-30", status=AcademicTerm.Status.CLOSED,
    )
    response = client.patch(
        f"/api/v1/organizations/{organization.id}/academic/terms/{term.id}/",
        {"status": AcademicTerm.Status.ACTIVE},
        format="json",
    )
    assert response.status_code == 400
    term.refresh_from_db()
    assert term.status == AcademicTerm.Status.CLOSED


@pytest.mark.django_db
def test_classroom_can_only_open_when_term_is_active(academic_context):
    owner, organization, client = academic_context
    term = AcademicTerm.objects.create(
        organization=organization, code="2026-2", name="Semester 2",
        starts_on="2026-07-01", ends_on="2026-12-31", status=AcademicTerm.Status.DRAFT,
    )
    program = AcademicProgram.objects.create(organization=organization, code="CS", name="Computer Science")
    classroom = AcademicClassroom.objects.create(
        organization=organization, program=program, term=term,
        code="CS-A", name="Computer Science A",
    )
    response = client.patch(
        f"/api/v1/organizations/{organization.id}/academic/classrooms/{classroom.id}/",
        {"status": AcademicClassroom.Status.OPEN},
        format="json",
    )
    assert response.status_code == 400
    classroom.refresh_from_db()
    assert classroom.status == AcademicClassroom.Status.DRAFT


@pytest.mark.django_db
def test_resource_id_from_another_organization_is_not_disclosed(academic_context):
    owner, organization, client = academic_context
    other_owner = NexoraUser.objects.create(email="other-owner@school.test", status=NexoraUser.Status.ACTIVE)
    other_organization = OrganizationService.create_organization(name="Other School", created_by=other_owner)
    foreign_program = AcademicProgram.objects.create(
        organization=other_organization, code="BIO", name="Biology",
    )
    response = client.get(
        f"/api/v1/organizations/{organization.id}/academic/programs/{foreign_program.id}/",
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_program_archive_is_soft_and_audited(academic_context):
    owner, organization, client = academic_context
    program = AcademicProgram.objects.create(organization=organization, code="ART", name="Arts")
    response = client.delete(
        f"/api/v1/organizations/{organization.id}/academic/programs/{program.id}/",
    )
    assert response.status_code == 200
    assert not AcademicProgram.objects.active().filter(id=program.id).exists()
    assert ControlPlaneAuditEvent.objects.filter(
        event_type="ACADEMIC_RESOURCE_CHANGED",
        metadata__resource_id=str(program.id),
        metadata__action="archived",
    ).exists()
