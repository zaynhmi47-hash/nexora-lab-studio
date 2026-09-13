from apps.capabilities.models import Capability, ProductCapability


class CapabilityRepository:
    """Small persistence boundary for trusted capability services."""

    @staticmethod
    def get_active(capability_id):
        return Capability.objects.active().filter(id=capability_id).first()

    @staticmethod
    def get_product_relationship(*, product_id, capability_id):
        return ProductCapability.objects.filter(product_id=product_id, capability_id=capability_id).first()
