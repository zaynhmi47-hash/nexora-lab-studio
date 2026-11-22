import pytest
from rest_framework.test import APIClient

from apps.career.models import CareerExperience, CareerProject
from apps.identity.models import NexoraUser


@pytest.mark.django_db
def test_career_experience_api_is_owner_scoped_and_supports_create():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-other@example.com")
    CareerExperience.objects.create(
        user=other,
        role_title="Private engineer",
        organization_name="Other Company",
        start_date="2024-01-01",
    )
    client = APIClient()
    client.force_authenticate(user=owner)

    response = client.get("/api/v1/career/experiences/")
    assert response.status_code == 200
    assert response.json() == []

    created = client.post("/api/v1/career/experiences/", {
        "role_title": "Software Developer",
        "organization_name": "Nexora",
        "employment_type": "full_time",
        "start_date": "2025-01-01",
        "is_current": True,
    }, format="json")
    assert created.status_code == 201
    assert created.json()["role_title"] == "Software Developer"
    assert CareerExperience.objects.filter(user=owner, role_title="Software Developer").exists()


@pytest.mark.django_db
def test_career_experience_rejects_invalid_date_range():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-date@example.com")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/v1/career/experiences/", {
        "role_title": "Designer",
        "organization_name": "Studio",
        "start_date": "2025-06-01",
        "end_date": "2025-05-01",
    }, format="json")

    assert response.status_code == 400


@pytest.mark.django_db
def test_career_project_defaults_to_private_and_is_owner_scoped():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-project-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-project-other@example.com")
    CareerProject.objects.create(
        user=other,
        title="Private project of another user",
        visibility=CareerProject.Visibility.PRIVATE,
    )
    client = APIClient()
    client.force_authenticate(user=owner)

    created = client.post("/api/v1/career/projects/", {
        "title": "Personal portfolio",
        "summary": "A project built to practice product design.",
        "skills": ["Research", "Prototyping"],
    }, format="json")
    assert created.status_code == 201
    assert created.json()["visibility"] == "private"
    listed = client.get("/api/v1/career/projects/")
    assert listed.status_code == 200
    assert [item["title"] for item in listed.json()] == ["Personal portfolio"]


@pytest.mark.django_db
def test_career_project_rejects_invalid_skills_and_completed_without_date():
    user = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-project-validation@example.com")
    client = APIClient()
    client.force_authenticate(user=user)

    invalid_skills = client.post("/api/v1/career/projects/", {
        "title": "Invalid skills",
        "skills": ["Python", ""],
    }, format="json")
    assert invalid_skills.status_code == 400

    missing_date = client.post("/api/v1/career/projects/", {
        "title": "Finished project",
        "status": "completed",
    }, format="json")
    assert missing_date.status_code == 400


@pytest.mark.django_db
def test_career_endpoints_require_authentication():
    client = APIClient()
    assert client.get("/api/v1/career/experiences/").status_code == 401
    assert client.get("/api/v1/career/projects/").status_code == 401


@pytest.mark.django_db
def test_career_experience_update_and_delete_are_owner_scoped():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-crud-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-crud-other@example.com")
    own = CareerExperience.objects.create(
        user=owner, role_title="Junior developer", organization_name="Studio",
        start_date="2024-01-01",
    )
    foreign = CareerExperience.objects.create(
        user=other, role_title="Private role", organization_name="Other",
        start_date="2024-01-01",
    )
    client = APIClient()
    client.force_authenticate(user=owner)

    updated = client.patch(
        f"/api/v1/career/experiences/{own.id}/",
        {"role_title": "Software developer"},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.json()["role_title"] == "Software developer"
    assert client.delete(f"/api/v1/career/experiences/{foreign.id}/").status_code == 404
    assert client.delete(f"/api/v1/career/experiences/{own.id}/").status_code == 204
    own.refresh_from_db()
    assert own.deleted_at is not None


@pytest.mark.django_db
def test_career_project_update_and_delete_are_owner_scoped():
    owner = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-project-crud-owner@example.com")
    other = NexoraUser.objects.create(status=NexoraUser.Status.ACTIVE, email="career-project-crud-other@example.com")
    own = CareerProject.objects.create(user=owner, title="My portfolio")
    foreign = CareerProject.objects.create(user=other, title="Other portfolio")
    client = APIClient()
    client.force_authenticate(user=owner)

    updated = client.patch(
        f"/api/v1/career/projects/{own.id}/",
        {"summary": "Updated project summary"},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.json()["summary"] == "Updated project summary"
    assert client.delete(f"/api/v1/career/projects/{foreign.id}/").status_code == 404
    assert client.delete(f"/api/v1/career/projects/{own.id}/").status_code == 204
    own.refresh_from_db()
    assert own.deleted_at is not None
