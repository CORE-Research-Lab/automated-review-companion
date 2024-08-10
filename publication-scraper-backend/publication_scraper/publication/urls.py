from django.urls import path
from .views import PublicationSnowballingView, PublicationValidationView

urlpatterns = [
  path('snowballing', PublicationSnowballingView.as_view(), name='snowballing'),
  path('validation', PublicationValidationView.as_view(), name='validation'),
]