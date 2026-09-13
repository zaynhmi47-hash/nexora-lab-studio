from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.core.exceptions import ConflictException, NotFoundException, ValidationException
from apps.capabilities.models import Capability, ProductCapability
from apps.products.models import Product


class CapabilityService:
    @staticmethod
    @transaction.atomic
    def create_capability(*, key: str, name: str, description: str = "", metadata: dict | None = None) -> Capability:
        if Capability.objects.filter(key=key).exists():
            raise ConflictException("A capability with this key already exists.")
        capability = Capability(key=key, name=name, description=description, metadata={} if metadata is None else metadata)
        try:
            capability.save()
        except IntegrityError as exc:
            raise ConflictException("A capability with this key already exists.") from exc
        except ValidationError as exc:
            raise ValidationException("Capability data is invalid.", details=exc.message_dict) from exc
        return capability

    @staticmethod
    @transaction.atomic
    def update_capability(*, capability_id, name: str | None = None, description: str | None = None, metadata: dict | None = None, key: str | None = None) -> Capability:
        capability = Capability.objects.active().filter(id=capability_id).first()
        if capability is None:
            raise NotFoundException("Capability not found.")
        if key is not None and key != capability.key:
            raise ValidationException("Capability key is immutable.")
        for field, value in (("name", name), ("description", description), ("metadata", metadata)):
            if value is not None:
                setattr(capability, field, value)
        try:
            capability.save()
        except ValidationError as exc:
            raise ValidationException("Capability data is invalid.", details=exc.message_dict) from exc
        return capability

    @staticmethod
    @transaction.atomic
    def activate_capability(*, capability_id) -> Capability:
        return CapabilityService._transition(capability_id=capability_id, expected={Capability.Status.INACTIVE}, target=Capability.Status.ACTIVE)

    @staticmethod
    @transaction.atomic
    def deactivate_capability(*, capability_id) -> Capability:
        return CapabilityService._transition(capability_id=capability_id, expected={Capability.Status.ACTIVE}, target=Capability.Status.INACTIVE)

    @staticmethod
    @transaction.atomic
    def deprecate_capability(*, capability_id) -> Capability:
        return CapabilityService._transition(capability_id=capability_id, expected={Capability.Status.ACTIVE, Capability.Status.INACTIVE}, target=Capability.Status.DEPRECATED)

    @staticmethod
    @transaction.atomic
    def restore_capability(*, capability_id) -> Capability:
        capability = Capability.objects.deleted().filter(id=capability_id).first()
        if capability is None:
            raise NotFoundException("Capability not found.")
        capability.restore()
        return capability

    @staticmethod
    @transaction.atomic
    def attach_capability(*, product_id, capability_id, metadata: dict | None = None) -> ProductCapability:
        product = Product.objects.active().filter(id=product_id, status=Product.Status.ACTIVE).first()
        if product is None:
            raise NotFoundException("Active product not found.")
        capability = Capability.objects.active().filter(id=capability_id, status=Capability.Status.ACTIVE).first()
        if capability is None:
            raise NotFoundException("Active capability not found.")
        relationship = ProductCapability.objects.filter(product_id=product.id, capability_id=capability.id).first()
        if relationship is not None:
            if relationship.deleted_at is not None:
                relationship.deleted_at = None
                relationship.status = ProductCapability.Status.ACTIVE
            elif relationship.status == ProductCapability.Status.INACTIVE:
                relationship.status = ProductCapability.Status.ACTIVE
            if metadata is not None:
                relationship.metadata = metadata
            relationship.save()
            return relationship
        try:
            return ProductCapability.objects.create(product=product, capability=capability, metadata={} if metadata is None else metadata)
        except IntegrityError as exc:
            raise ConflictException("This capability is already attached to the product.") from exc
        except ValidationError as exc:
            raise ValidationException("Product capability data is invalid.", details=exc.message_dict) from exc

    @staticmethod
    @transaction.atomic
    def detach_capability(*, product_id, capability_id) -> ProductCapability:
        relationship = ProductCapability.objects.active().filter(product_id=product_id, capability_id=capability_id).first()
        if relationship is None:
            raise NotFoundException("Product capability not found.")
        relationship.soft_delete()
        return relationship

    @staticmethod
    def _transition(*, capability_id, expected: set[str], target: str) -> Capability:
        capability = Capability.objects.active().filter(id=capability_id).first()
        if capability is None:
            raise NotFoundException("Capability not found.")
        if capability.status not in expected:
            raise ConflictException(f"Cannot transition a {capability.status} capability to {target}.")
        capability.status = target
        capability.save(update_fields=["status", "updated_at"])
        return capability
