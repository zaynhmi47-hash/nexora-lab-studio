from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("ops/", include("apps.control_plane.urls")),
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]
