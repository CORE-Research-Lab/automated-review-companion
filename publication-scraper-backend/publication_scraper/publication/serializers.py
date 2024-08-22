from rest_framework import serializers
from scraping.serializers.core_serializers import QuerySerializer


class PublicationSnowballingSerializer(serializers.Serializer):
  SEARCH_CHOICES = (
    ('forward', 'Forward'),
    ('backward', 'Backward'),
  )
  publication_ids = serializers.ListField(child=serializers.CharField())
  search_type = serializers.ChoiceField(choices=SEARCH_CHOICES, default='forward')
  
class PublicationValidationSerializer(serializers.Serializer):

  query = QuerySerializer(default={
    "primary": [],
    "secondary": [],
    "tertiary": []
  })