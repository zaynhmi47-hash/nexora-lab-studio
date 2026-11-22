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
