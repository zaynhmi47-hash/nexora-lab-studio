from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.core.exceptions import ConflictException, NotFoundException, ValidationException
from apps.products.models import Product


class ProductService:
    @staticmethod
    @transaction.atomic
    def create_product(*, key: str, name: str, description: str = "", product_type: str = Product.ProductType.PLATFORM, version: str = "", metadata: dict | None = None) -> Product:
        if Product.objects.filter(key=key).exists():
            raise ConflictException("A product with this key already exists.")
        product = Product(key=key, name=name, description=description, product_type=product_type, version=version, metadata={} if metadata is None else metadata)
        try:
            product.save()
        except IntegrityError as exc:
            raise ConflictException("A product with this key already exists.") from exc
        except ValidationError as exc:
            raise ValidationException("Product data is invalid.", details=exc.message_dict) from exc
        return product

    @staticmethod
    @transaction.atomic
    def update_product(*, product_id, name: str | None = None, description: str | None = None, product_type: str | None = None, version: str | None = None, metadata: dict | None = None, key: str | None = None) -> Product:
        product = Product.objects.active().filter(id=product_id).first()
        if product is None:
            raise NotFoundException("Product not found.")
        if key is not None and key != product.key:
            raise ValidationException("Product key is immutable.")
        for field, value in (("name", name), ("description", description), ("product_type", product_type), ("version", version), ("metadata", metadata)):
            if value is not None:
                setattr(product, field, value)
        try:
            product.save()
        except ValidationError as exc:
            raise ValidationException("Product data is invalid.", details=exc.message_dict) from exc
        return product

    @staticmethod
    @transaction.atomic
    def activate_product(*, product_id) -> Product:
        return ProductService._transition(product_id=product_id, expected={Product.Status.INACTIVE}, target=Product.Status.ACTIVE)

    @staticmethod
    @transaction.atomic
    def deactivate_product(*, product_id) -> Product:
        return ProductService._transition(product_id=product_id, expected={Product.Status.ACTIVE}, target=Product.Status.INACTIVE)

    @staticmethod
    @transaction.atomic
    def deprecate_product(*, product_id) -> Product:
        return ProductService._transition(product_id=product_id, expected={Product.Status.ACTIVE, Product.Status.INACTIVE}, target=Product.Status.DEPRECATED)

    @staticmethod
    @transaction.atomic
    def restore_product(*, product_id) -> Product:
        product = Product.objects.deleted().filter(id=product_id).first()
        if product is None:
            raise NotFoundException("Product not found.")
        product.restore()
        return product

    @staticmethod
    def _transition(*, product_id, expected: set[str], target: str) -> Product:
        product = Product.objects.active().filter(id=product_id).first()
        if product is None:
            raise NotFoundException("Product not found.")
        if product.status not in expected:
            raise ConflictException(f"Cannot transition a {product.status} product to {target}.")
        product.status = target
        product.save(update_fields=["status", "updated_at"])
        return product
