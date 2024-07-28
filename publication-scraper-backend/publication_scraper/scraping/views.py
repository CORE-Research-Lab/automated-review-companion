from itertools import product
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.status import HTTP_400_BAD_REQUEST

from .serializers import SearchAndCleanSerializer, PublicationMetadataSerializer
from .domain.search_engine import SearchEngineType, SearchEngine
from .interfaces.extract_metadata import PublicationMetadataExtractor

class SearchAndCleanView(APIView):
  def post(self, request):
    serializer = SearchAndCleanSerializer(data=request.data)
    if serializer.is_valid():
      search_terms = serializer.validated_data['search_terms']
      year_start = serializer.validated_data['year_start']
      year_end = serializer.validated_data['year_end']
      sources = serializer.validated_data['sources']
      
      all_search_terms = [search_terms['primary'], search_terms['secondary'], search_terms['tertiary']]
      all_search_terms = list(product(*all_search_terms))
      
      if SearchEngineType.DBLP in sources:
        dblp_search_engine = SearchEngine(SearchEngineType.DBLP)
        dblp_results = dblp_search_engine.search(all_search_terms, year_start, year_end)
        dblp_results = dblp_results.drop_duplicates(subset=['ID'])
        dblp_results = dblp_results.drop_duplicates(subset=['PaperTitle'])
      if SearchEngineType.SEMANTIC_SCHOLAR in sources:
        sch_search_engine = SearchEngine(SearchEngineType.SEMANTIC_SCHOLAR)
        sch_results = sch_search_engine.search(all_search_terms, year_start, year_end)
        sch_results = sch_results.drop_duplicates(subset=['ID'])
        sch_results = sch_results.drop_duplicates(subset=['PaperTitle'])
      if SearchEngineType.WEB_OF_SCIENCE in sources:
        wos_search_engine = SearchEngine(SearchEngineType.WEB_OF_SCIENCE)
        wos_results = wos_search_engine.search(all_search_terms, year_start, year_end)
        wos_results = wos_results.drop_duplicates(subset=['ID'])
        wos_results = wos_results.drop_duplicates(subset=['PaperTitle'])
        
      results = [
        dblp_results.to_dict(orient='records'),
        sch_results.to_dict(orient='records'),
        wos_results.to_dict(orient='records')
      ]
      
      return JsonResponse(results)
    return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST)

class PublicationMetadataView(APIView):
    def post(self, request):
        serializer = PublicationMetadataSerializer(data=request.data)
        if serializer.is_valid():
            publications = serializer.validated_data['publications']
            extractor = PublicationMetadataExtractor()
            extractor.extract_data(publications)
            metadata = [pub_metadata.to_dict() for pub_metadata in extractor.extracted_metadata]
            return JsonResponse(metadata)
        return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST)