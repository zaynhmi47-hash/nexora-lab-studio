from django.urls import path
from .api import IslamicPlacesView

urlpatterns = [path("", IslamicPlacesView.as_view(), name="islamic-places")]
