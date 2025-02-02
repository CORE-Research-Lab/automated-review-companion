from django.urls import path

from .views import (
  PublicationLLMFilterView,
  PublicationSnowballingView,
  PublicationValidationView,
  PublicationUploadView
)

urlpatterns = [
  path('snowballing', PublicationSnowballingView.as_view(), name='snowballing'),
  path('validation', PublicationValidationView.as_view(), name='validation'),
  path('llm-filter', PublicationLLMFilterView.as_view(), name='llm-filter'),
  path('extract-csv', PublicationUploadView.as_view(), name='extract-csv'),
]