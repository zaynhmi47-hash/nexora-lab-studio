from django.urls import path
from .api import DuaFavoriteListView, DuaFavoriteToggleView, DuaListView
urlpatterns=[path("",DuaListView.as_view()), path("favorites/", DuaFavoriteListView.as_view()), path("favorites/<uuid:dua_id>/toggle/", DuaFavoriteToggleView.as_view())]
