from __future__ import annotations

from django.db import IntegrityError, transaction
from django.utils.text import slugify

from apps.access.services import provision_organization_access
from apps.core.exceptions import ConflictException, NotFoundException, ValidationException
from apps.identity.models import NexoraUser
from apps.organizations.models import Membership, Organization


class OrganizationService:
    @staticmethod
    @transaction.atomic
    def create_organization(
        *,
        name: str,
        created_by: NexoraUser | None = None,
        slug: str | None = None,
        metadata: dict | None = None,
    ) -> Organization:
        normalized_name = " ".join(name.split()) if isinstance(name, str) else ""
        if len(normalized_name) < 2:
            raise ValidationException("Organization name must contain at least two characters.")
        normalized_slug = slugify(slug or normalized_name)
        if not normalized_slug:
            raise ValidationException("Organization slug cannot be empty.")
        try:
            organization = Organization.objects.create(
                name=normalized_name,
                slug=normalized_slug,
                metadata=metadata or {},
            )
            roles = provision_organization_access(organization)
            if created_by is not None:
                Membership.objects.create(user=created_by, organization=organization, role=roles["owner"])
            return organization
        except IntegrityError as exc:
            raise ConflictException("An organization with this slug already exists.") from exc

    @staticmethod
    def suspend_organization(organization_id) -> Organization:
        organization = Organization.objects.active().filter(id=organization_id).first()
        if organization is None:
            raise NotFoundException("Organization not found.")
        if organization.status == Organization.Status.DEACTIVATED:
            raise ConflictException("A deactivated organization cannot be suspended.")
        organization.status = Organization.Status.SUSPENDED
        organization.save(update_fields=["status", "updated_at"])
        return organization

    @staticmethod
    def deactivate_organization(organization_id) -> Organization:
        organization = Organization.objects.active().filter(id=organization_id).first()
        if organization is None:
            raise NotFoundException("Organization not found.")
        organization.status = Organization.Status.DEACTIVATED
        organization.save(update_fields=["status", "updated_at"])
        return organization
