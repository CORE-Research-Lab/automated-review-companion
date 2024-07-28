from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SearchAndCleanView, PublicationMetadataView

router = DefaultRouter()
router.register(r'search-and-clean', SearchAndCleanView, basename='search-and-clean')
router.register(r'publication-metadata', PublicationMetadataView, basename='publication-metadata')

urlpatterns = [
    path('', include(router.urls)),
]