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
        visibility=CareerProject.Visibility.PUBLIC,
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
    assert client.get("/api/v1/career/projects/").json() == []


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
