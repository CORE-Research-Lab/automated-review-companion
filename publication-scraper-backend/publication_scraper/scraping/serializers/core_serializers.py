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


class RootPaperSerializer(Serializer):
    doi = CharField(required=False, default="", allow_blank=True)
    title = CharField(required=False, default="", allow_blank=True)

class QuerySerializer(Serializer):
    advanced = CharField(required=False, allow_blank=True)
    primary = ListField(child=CharField(), default=[])
    secondary = ListField(child=CharField(), default=[], required=False, allow_empty=True)
    tertiary = ListField(child=CharField(), default=[], required=False, allow_empty=True)

class SearchAndCleanSerializer(Serializer):
    root_papers = ListField(child=RootPaperSerializer(), default=[])
    search_terms = QuerySerializer(required=True)
    year_start = IntegerField(default=2017)
    year_end = IntegerField(default=2023)
    sources = MultipleChoiceField(choices=SearchEngineType.get_choices(), default=[[type for type in SearchEngineType]])

class PublicationSerializer(ModelSerializer):
    class Meta:
        model = Publication
        fields = '__all__'

class PublicationMetadataSerializer(Serializer):
    paper_ids = ListField(child=CharField(), required=True)

class SearchStringDifferenceSerializer(Serializer):
    search_terms = QuerySerializer(required=True)
    show_publication = BooleanField(default=False)
    show_metadata = BooleanField(default=False)