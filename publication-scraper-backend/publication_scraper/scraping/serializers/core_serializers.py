from rest_framework.serializers import *
from scraping.models import SearchEngineType
from publication.models import Publication

class QuerySerializer(Serializer):
    primary = ListField(child=CharField(), default=[])
    secondary = ListField(child=CharField(), default=[])
    tertiary = ListField(child=CharField(), default=[])

class SearchAndCleanSerializer(Serializer):
    search_terms = QuerySerializer(required=True)
    year_start = IntegerField(default=2017)
    year_end = IntegerField(default=2023)
    sources = MultipleChoiceField(choices=SearchEngineType.get_choices(), default=[[type for type in SearchEngineType]])

class PublicationSerializer(ModelSerializer):
    class Meta:
        model = Publication
        fields = '__all__'

class PublicationMetadataSerializer(Serializer):
    # publications = ListField(child=PublicationSerializer(), required=True)
    paper_ids = ListField(child=CharField(), required=True)
