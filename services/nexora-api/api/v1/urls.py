from django.urls import include
from django.urls import path

from api.v1.health import HealthView, LivenessView, ReadinessView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("health/live/", LivenessView.as_view(), name="health-live"),
    path("health/ready/", ReadinessView.as_view(), name="health-ready"),
    path("identity/", include("apps.identity.api.urls")),
    path("organizations/", include("api.v1.urls_organizations")),
    path("products/", include("apps.products.api.urls")),
    path("products/", include("apps.capabilities.api.urls_products")),
    path("capabilities/", include("apps.capabilities.api.urls")),
]
