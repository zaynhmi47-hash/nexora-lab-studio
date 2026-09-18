from django.urls import path

from .api import ZakatView

urlpatterns = [path("", ZakatView.as_view())]
