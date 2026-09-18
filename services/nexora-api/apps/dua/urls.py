from django.urls import path
from .api import DuaListView
urlpatterns=[path("",DuaListView.as_view())]
