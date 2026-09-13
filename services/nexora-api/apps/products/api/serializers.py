from rest_framework import serializers

from apps.products.models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ("id", "key", "name", "description", "status", "product_type", "version", "metadata", "created_at", "updated_at")
        read_only_fields = fields
