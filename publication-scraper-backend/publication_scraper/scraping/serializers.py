from rest_framework.serializers import *
from .domain.search_engine import SearchEngineType
from ..publication.models import Publication

class QuerySerializer(Serializer):
    primary = CharField(required=True)
    secondary = CharField(required=True)
    tertiary = CharField(required=True)

class SearchAndCleanSerializer(Serializer):
    search_terms = QuerySerializer(required=True)
    year_start = IntegerField(required=False, default=2017)
    year_end = IntegerField(required=False, default=2023)
    sources = ChoiceField(choices=SearchEngineType.get_choices(), required=True)

class PublicationSerializer(ModelSerializer):
    class Meta:
        model = Publication
        fields = '__all__'

class PublicationMetadataSerializer(Serializer):
    publications = ListField(child=PublicationSerializer(), required=True)
