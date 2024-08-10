from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SearchAndCleanView, PublicationMetadataView

urlpatterns = [
    path('search-and-clean', SearchAndCleanView.as_view(), name='search-and-clean'),
    path('publication-metadata', PublicationMetadataView.as_view(), name='publication-metadata'),
]