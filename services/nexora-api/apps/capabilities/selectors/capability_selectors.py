from apps.capabilities.models import Capability, ProductCapability


def list_capabilities(*, status: str | None = None, key: str | None = None, product: str | None = None):
    queryset = Capability.objects.active()
    if status:
        queryset = queryset.filter(status=status)
    if key:
        queryset = queryset.filter(key=key)
    if product:
        queryset = queryset.filter(product_capabilities__product__key=product, product_capabilities__deleted_at__isnull=True, product_capabilities__status=ProductCapability.Status.ACTIVE, product_capabilities__product__deleted_at__isnull=True, product_capabilities__product__status="active")
    return queryset.distinct()


def list_active_capabilities():
    return list_capabilities(status=Capability.Status.ACTIVE)


def get_capability_by_id(capability_id):
    return Capability.objects.active().filter(id=capability_id).first()


def get_capability_by_key(key: str):
    return Capability.objects.active().filter(key=key).first()


def get_product_capabilities(product_id):
    return Capability.objects.active().filter(product_capabilities__product_id=product_id, product_capabilities__deleted_at__isnull=True, product_capabilities__status=ProductCapability.Status.ACTIVE, product_capabilities__product__deleted_at__isnull=True, product_capabilities__product__status="active").distinct()


def get_capability_products(capability_id):
    return ProductCapability.objects.active().select_related("product").filter(capability_id=capability_id, status=ProductCapability.Status.ACTIVE, capability__deleted_at__isnull=True, capability__status=Capability.Status.ACTIVE, product__deleted_at__isnull=True, product__status="active")
