from itertools import product
from typing import List
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.status import HTTP_400_BAD_REQUEST

from scraping.serializers.core_serializers import SearchAndCleanSerializer, PublicationMetadataSerializer
from scraping.models import SearchEngineType
from scraping.interfaces.extract_metadata import PublicationMetadataExtractor
from scraping.domain.search_engine.dblp_engine import DBLPEngine
from scraping.domain.search_engine.semantic_scholar_engine import SemanticScholarEngine
from scraping.domain.search_engine.web_of_science_engine import WebOfScienceEngine
from publication.models import Publication

class SearchAndCleanView(APIView):
  def post(self, request):
    serializer = SearchAndCleanSerializer(data=request.data)
    if serializer.is_valid():
      search_terms  = serializer.validated_data['search_terms']
      year_start    = serializer.validated_data['year_start']
      year_end      = serializer.validated_data['year_end']
      sources       = serializer.validated_data['sources']
      
      all_search_terms            = [search_terms['primary'], search_terms['secondary'], search_terms['tertiary']]
      all_search_terms            = list(product(*all_search_terms))
      results: List[Publication]  = []
      
      # TODO: pipeline this to a separate interface
      if SearchEngineType.DBLP.value in sources:
        dblp_search_engine = DBLPEngine(all_search_terms, year_start, year_end)
        dblp_results = dblp_search_engine.search()
        results.extend(dblp_results)
        
      if SearchEngineType.SEMANTIC_SCHOLAR.value in sources:
        sch_search_engine = SemanticScholarEngine(all_search_terms, year_start)
        sch_results = sch_search_engine.search()
        results.extend(sch_results)

      if SearchEngineType.WEB_OF_SCIENCE.value in sources:
        wos_search_engine = WebOfScienceEngine(all_search_terms, year_start, year_end)
        wos_results = wos_search_engine.search()
        results.extend(wos_results)
      
      results = Publication.remove_duplicates(results)
      Publication.bulk_upsert(results)
      
      response = [result.to_dict() for result in results]
      return JsonResponse({ "results": response })
    return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST, safe=False)

class PublicationMetadataView(APIView):
    def post(self, request):
        serializer = PublicationMetadataSerializer(data=request.data)
        if serializer.is_valid():
            paper_ids = serializer.validated_data['paper_ids']
            
            # publications = Publication.objects.all()
            extractor = PublicationMetadataExtractor(paper_ids)
            extractor.extract_data()
            metadata = [pub_metadata.to_dict(show_publication=True) for pub_metadata in extractor.extracted_metadata]
            
            return JsonResponse({ "metadata": metadata })
        return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST)