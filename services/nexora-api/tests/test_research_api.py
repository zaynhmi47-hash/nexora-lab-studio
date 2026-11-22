import pytest
from rest_framework.test import APIClient

from apps.identity.models import NexoraUser
from apps.research.models import ResearchOutput, ResearchProject


@pytest.mark.django_db
def test_research_projects_are_private_and_owner_scoped():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-other@example.com")
    ResearchProject.objects.create(owner=other, title="Other user's confidential study")
    client = APIClient()
    client.force_authenticate(user=owner)

    listed = client.get("/api/v1/research/projects/")
    assert listed.status_code == 200
    assert listed.json() == []

    created = client.post("/api/v1/research/projects/", {
        "title": "Urban learning access",
        "research_question": "How do learners access resources?",
        "field_of_study": "Education",
        "methodology": "Mixed methods",
    }, format="json")
    assert created.status_code == 201
    assert created.json()["visibility"] == "private"
    assert ResearchProject.objects.filter(owner=owner, title="Urban learning access").exists()


@pytest.mark.django_db
def test_research_outputs_and_contributions_are_owner_scoped_and_self_reported():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-output-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-output-other@example.com")
    project = ResearchProject.objects.create(owner=owner, title="Owner study")
    other_project = ResearchProject.objects.create(owner=other, title="Other study")
    ResearchOutput.objects.create(project=other_project, title="Confidential paper")

    client = APIClient()
    client.force_authenticate(user=owner)
    output = client.post(f"/api/v1/research/projects/{project.id}/outputs/", {
        "title": "Research report",
        "output_type": "report",
        "status": "draft",
    }, format="json")
    assert output.status_code == 201
    assert output.json()["provenance_status"] == "self_reported"

    contribution = client.post(f"/api/v1/research/projects/{project.id}/contributions/", {
        "contributor_name": "Research collaborator",
        "role": "Data analysis",
        "contribution_type": "analysis",
    }, format="json")
    assert contribution.status_code == 201
    assert contribution.json()["attribution_status"] == "self_reported"

    foreign = client.get(f"/api/v1/research/projects/{other_project.id}/outputs/")
    assert foreign.status_code == 404


@pytest.mark.django_db
def test_published_research_output_requires_publication_reference():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-validation@example.com")
    project = ResearchProject.objects.create(owner=user, title="Validation study")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(f"/api/v1/research/projects/{project.id}/outputs/", {
        "title": "Published paper",
        "status": "published",
    }, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_research_project_completion_requires_date_and_owner_only_detail():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-detail-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-detail-other@example.com")
    project = ResearchProject.objects.create(owner=owner, title="Owner project")
    client = APIClient()
    client.force_authenticate(user=owner)

    invalid = client.patch(f"/api/v1/research/projects/{project.id}/", {
        "status": "completed",
    }, format="json")
    assert invalid.status_code == 400

    foreign = client.get(f"/api/v1/research/projects/{ResearchProject.objects.create(owner=other, title='Private').id}/")
    assert foreign.status_code == 404


@pytest.mark.django_db
def test_research_api_requires_authentication():
    client = APIClient()
    assert client.get("/api/v1/research/projects/").status_code == 401


@pytest.mark.django_db
def test_research_output_update_and_soft_delete_are_owner_scoped():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-output-crud@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-output-crud-other@example.com")
    project = ResearchProject.objects.create(owner=owner, title="Owner project")
    foreign_project = ResearchProject.objects.create(owner=other, title="Foreign project")
    output = ResearchOutput.objects.create(project=project, title="Draft output")
    foreign_output = ResearchOutput.objects.create(project=foreign_project, title="Foreign output")
    client = APIClient()
    client.force_authenticate(user=owner)

    updated = client.patch(
        f"/api/v1/research/projects/{project.id}/outputs/{output.id}/",
        {"title": "Revised draft"},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Revised draft"

    denied = client.delete(
        f"/api/v1/research/projects/{foreign_project.id}/outputs/{foreign_output.id}/",
    )
    assert denied.status_code == 404
    deleted = client.delete(f"/api/v1/research/projects/{project.id}/outputs/{output.id}/")
    assert deleted.status_code == 204
    output.refresh_from_db()
    assert output.deleted_at is not None


@pytest.mark.django_db
def test_research_contribution_update_and_soft_delete_are_owner_scoped():
    from apps.research.models import ResearchContribution

    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-contribution-crud@example.com")
    project = ResearchProject.objects.create(owner=user, title="Contribution project")
    item = ResearchContribution.objects.create(project=project, contributor_name="Initial name")
    client = APIClient()
    client.force_authenticate(user=user)

    updated = client.patch(
        f"/api/v1/research/projects/{project.id}/contributions/{item.id}/",
        {"role": "Methodology"},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.json()["role"] == "Methodology"
    deleted = client.delete(f"/api/v1/research/projects/{project.id}/contributions/{item.id}/")
    assert deleted.status_code == 204
    item.refresh_from_db()
    assert item.deleted_at is not None


@pytest.mark.django_db
def test_research_evidence_verification_requires_explicit_consent_and_active_membership():
    from apps.organizations.models import Membership, Organization
    from apps.access.models import Role

    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="verification-owner@example.com")
    project = ResearchProject.objects.create(owner=owner, title="Evidence study")
    output = ResearchOutput.objects.create(project=project, title="Evidence report")
    organization = Organization.objects.create(name="Review Institute", slug="review-institute")
    role = Role.objects.create(organization=organization, name="Member", slug="member")
    Membership.objects.create(user=owner, organization=organization, role=role)
    client = APIClient()
    client.force_authenticate(user=owner)
    url = f"/api/v1/research/projects/{project.id}/outputs/{output.id}/verification/"

    no_consent = client.post(url, {"organization_id": str(organization.id), "consent": False}, format="json")
    assert no_consent.status_code == 400
    submitted = client.post(url, {"organization_id": str(organization.id), "consent": True}, format="json")
    assert submitted.status_code == 201
    assert submitted.json()["status"] == "submitted"
    assert submitted.json()["events"][0]["to_status"] == "submitted"


@pytest.mark.django_db
def test_research_evidence_verification_uses_org_permission_and_audited_transitions():
    from django.core.exceptions import ValidationError as DjangoValidationError
    from apps.access.models import Permission, Role, RolePermission
    from apps.organizations.models import Membership, Organization
    from apps.research.models import ResearchEvidenceVerificationEvent

    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="verification-flow-owner@example.com")
    reviewer = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="verification-flow-reviewer@example.com")
    project = ResearchProject.objects.create(owner=owner, title="Verification workflow")
    output = ResearchOutput.objects.create(project=project, title="Workflow report")
    organization = Organization.objects.create(name="Evidence Review Board", slug="evidence-review-board")
    owner_role = Role.objects.create(organization=organization, name="Member", slug="member")
    reviewer_role = Role.objects.create(organization=organization, name="Evidence reviewer", slug="evidence-reviewer")
    Membership.objects.create(user=owner, organization=organization, role=owner_role)
    Membership.objects.create(user=reviewer, organization=organization, role=reviewer_role)
    permission = Permission.objects.create(code="research.evidence.verify", name="Verify research evidence")
    RolePermission.objects.create(role=reviewer_role, permission=permission)

    owner_client = APIClient()
    owner_client.force_authenticate(user=owner)
    base_url = f"/api/v1/research/projects/{project.id}/outputs/{output.id}/verification/"
    submitted = owner_client.post(
        base_url, {"organization_id": str(organization.id), "consent": True}, format="json",
    )
    assert submitted.status_code == 201
    case_id = submitted.json()["id"]
    transition_url = f"{base_url}{case_id}/transition/"

    owner_attempt = owner_client.post(transition_url, {"status": "under_review"}, format="json")
    assert owner_attempt.status_code == 403

    reviewer_client = APIClient()
    reviewer_client.force_authenticate(user=reviewer)
    started = reviewer_client.post(transition_url, {"status": "under_review"}, format="json")
    assert started.status_code == 200
    assert started.json()["reviewer_id"] == str(reviewer.id)

    verified = reviewer_client.post(transition_url, {"status": "verified"}, format="json")
    assert verified.status_code == 200
    assert verified.json()["status"] == "verified"
    output.refresh_from_db()
    assert output.provenance_status == "self_reported"

    output_url = f"/api/v1/research/projects/{project.id}/outputs/{output.id}/"
    blocked_edit = owner_client.patch(output_url, {"title": "Changed after verification"}, format="json")
    assert blocked_edit.status_code == 400
    blocked_delete = owner_client.delete(output_url)
    assert blocked_delete.status_code == 400

    missing_reason = reviewer_client.post(transition_url, {"status": "revoked"}, format="json")
    assert missing_reason.status_code == 400
    revoked = reviewer_client.post(
        transition_url, {"status": "revoked", "reason": "Publisher retracted the evidence."}, format="json",
    )
    assert revoked.status_code == 200
    assert revoked.json()["status"] == "revoked"

    events = ResearchEvidenceVerificationEvent.objects.filter(verification_id=case_id)
    assert list(events.values_list("to_status", flat=True)) == ["submitted", "under_review", "verified", "revoked"]
    event = events.first()
    event.reason = "tampered"
    with pytest.raises(DjangoValidationError):
        event.save()
    with pytest.raises(DjangoValidationError):
        event.delete()


@pytest.mark.django_db
def test_research_evidence_reviewer_without_permission_is_denied():
    from apps.access.models import Role
    from apps.organizations.models import Membership, Organization

    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="verification-no-permission-owner@example.com")
    reviewer = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="verification-no-permission-reviewer@example.com")
    project = ResearchProject.objects.create(owner=owner, title="Permission study")
    output = ResearchOutput.objects.create(project=project, title="Permission report")
    organization = Organization.objects.create(name="No Permission Institute", slug="no-permission-institute")
    owner_role = Role.objects.create(organization=organization, name="Member", slug="member")
    reviewer_role = Role.objects.create(organization=organization, name="Observer", slug="observer")
    Membership.objects.create(user=owner, organization=organization, role=owner_role)
    Membership.objects.create(user=reviewer, organization=organization, role=reviewer_role)

    owner_client = APIClient()
    owner_client.force_authenticate(user=owner)
    base_url = f"/api/v1/research/projects/{project.id}/outputs/{output.id}/verification/"
    submitted = owner_client.post(
        base_url, {"organization_id": str(organization.id), "consent": True}, format="json",
    )
    assert submitted.status_code == 201

    reviewer_client = APIClient()
    reviewer_client.force_authenticate(user=reviewer)
    transition_url = f"{base_url}{submitted.json()['id']}/transition/"
    denied = reviewer_client.post(transition_url, {"status": "under_review"}, format="json")
    assert denied.status_code == 403


@pytest.mark.django_db
def test_research_verification_queue_is_limited_to_authorized_organization_reviewers():
    from apps.access.models import Permission, Role, RolePermission
    from apps.organizations.models import Membership, Organization

    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-queue-owner@example.com")
    reviewer = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-queue-reviewer@example.com")
    observer = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-queue-observer@example.com")
    project = ResearchProject.objects.create(owner=owner, title="Queue privacy")
    output = ResearchOutput.objects.create(project=project, title="Private report", abstract="Consented review content")
    organization = Organization.objects.create(name="Queue Review Board", slug="queue-review-board")
    owner_role = Role.objects.create(organization=organization, name="Member", slug="member")
    reviewer_role = Role.objects.create(organization=organization, name="Reviewer", slug="reviewer")
    observer_role = Role.objects.create(organization=organization, name="Observer", slug="observer")
    Membership.objects.create(user=owner, organization=organization, role=owner_role)
    Membership.objects.create(user=reviewer, organization=organization, role=reviewer_role)
    Membership.objects.create(user=observer, organization=organization, role=observer_role)
    permission = Permission.objects.create(code="research.evidence.verify", name="Verify research evidence")
    RolePermission.objects.create(role=reviewer_role, permission=permission)

    owner_client = APIClient()
    owner_client.force_authenticate(user=owner)
    submitted = owner_client.post(
        f"/api/v1/research/projects/{project.id}/outputs/{output.id}/verification/",
        {"organization_id": str(organization.id), "consent": True},
        format="json",
    )
    assert submitted.status_code == 201

    queue_url = f"/api/v1/research/organizations/{organization.id}/verifications/"
    reviewer_client = APIClient()
    reviewer_client.force_authenticate(user=reviewer)
    queue = reviewer_client.get(queue_url)
    assert queue.status_code == 200
    assert len(queue.json()) == 1
    assert queue.json()[0]["output_title"] == "Private report"
    assert queue.json()[0]["output_abstract"] == "Consented review content"

    observer_client = APIClient()
    observer_client.force_authenticate(user=observer)
    denied = observer_client.get(queue_url)
    assert denied.status_code == 403


@pytest.mark.django_db
def test_research_output_owner_can_withdraw_consent_and_remove_case_from_review_queue():
    from apps.access.models import Permission, Role, RolePermission
    from apps.organizations.models import Membership, Organization
    from apps.research.models import ResearchEvidenceVerificationEvent

    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-withdraw-owner@example.com")
    reviewer = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="research-withdraw-reviewer@example.com")
    project = ResearchProject.objects.create(owner=owner, title="Consent withdrawal")
    output = ResearchOutput.objects.create(project=project, title="Shared output")
    organization = Organization.objects.create(name="Consent Review Organization", slug="consent-review-organization")
    owner_role = Role.objects.create(organization=organization, name="Member", slug="member")
    reviewer_role = Role.objects.create(organization=organization, name="Reviewer", slug="reviewer")
    Membership.objects.create(user=owner, organization=organization, role=owner_role)
    Membership.objects.create(user=reviewer, organization=organization, role=reviewer_role)
    permission = Permission.objects.create(code="research.evidence.verify", name="Verify research evidence")
    RolePermission.objects.create(role=reviewer_role, permission=permission)

    owner_client = APIClient()
    owner_client.force_authenticate(user=owner)
    verification_url = f"/api/v1/research/projects/{project.id}/outputs/{output.id}/verification/"
    submitted = owner_client.post(
        verification_url, {"organization_id": str(organization.id), "consent": True}, format="json",
    )
    assert submitted.status_code == 201
    case_id = submitted.json()["id"]

    withdrawn = owner_client.post(
        f"{verification_url}{case_id}/transition/",
        {"status": "revoked", "reason": "I no longer consent to sharing this output."},
        format="json",
    )
    assert withdrawn.status_code == 200
    assert withdrawn.json()["status"] == "revoked"
    assert withdrawn.json()["reviewed_at"] is None

    event = ResearchEvidenceVerificationEvent.objects.filter(verification_id=case_id).latest("created_at")
    assert event.actor_id == owner.id
    assert event.to_status == "revoked"

    reviewer_client = APIClient()
    reviewer_client.force_authenticate(user=reviewer)
    queue = reviewer_client.get(f"/api/v1/research/organizations/{organization.id}/verifications/")
    assert queue.status_code == 200
    assert queue.json() == []
