from apps.products.models import Product


def list_products(*, status: str | None = None, product_type: str | None = None, key: str | None = None):
    queryset = Product.objects.active()
    if status:
        queryset = queryset.filter(status=status)
    if product_type:
        queryset = queryset.filter(product_type=product_type)
    if key:
        queryset = queryset.filter(key=key)
    return queryset


def list_active_products():
    return list_products(status=Product.Status.ACTIVE)


def get_product_by_id(product_id):
    return Product.objects.active().filter(id=product_id).first()


def get_product_by_key(key: str):
    return Product.objects.active().filter(key=key).first()
