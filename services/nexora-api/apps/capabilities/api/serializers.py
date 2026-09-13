from rest_framework import serializers

from apps.capabilities.models import Capability


class CapabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Capability
        fields = ("id", "key", "name", "description", "status", "metadata", "created_at", "updated_at")
        read_only_fields = fields


class ProductCapabilitySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    key = serializers.CharField(source="key")
    name = serializers.CharField()
    description = serializers.CharField()
    status = serializers.CharField()
    metadata = serializers.JSONField()
