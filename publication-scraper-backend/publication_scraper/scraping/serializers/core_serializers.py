from publication.models import Publication
from rest_framework.serializers import (
    BooleanField,
    CharField,
    IntegerField,
    ListField,
    ModelSerializer,
    MultipleChoiceField,
    Serializer,
)
from scraping.models import SearchEngineType


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

class SearchStringDifferenceSerializer(Serializer):
    search_terms = QuerySerializer(required=True)
    show_publication = BooleanField(default=False)
    show_metadata = BooleanField(default=False)