from itertools import product
from typing import List, Dict, Tuple
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.status import HTTP_400_BAD_REQUEST

from scraping.serializers.core_serializers import SearchAndCleanSerializer, PublicationMetadataSerializer, SearchStringDifferenceSerializer
from scraping.models import SearchEngineType, SearchResult
from scraping.interfaces.extract_metadata import PublicationMetadataExtractor
from scraping.domain.search_engine.dblp_engine import DBLPEngine
from scraping.domain.search_engine.semantic_scholar_engine import SemanticScholarEngine
from scraping.domain.search_engine.web_of_science_engine import WebOfScienceEngine
from publication.models import Publication, PublicationMetadata

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

class SearchStringDifferenceView(APIView):

    def post(self, request):
        """
        Get the difference of search results between multiple search strings.
        """
        serializer = SearchStringDifferenceSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST)
        
        query_data = serializer.validated_data['search_terms']
        show_publication = serializer.validated_data['show_publication']
        show_metadata = serializer.validated_data['show_metadata']
        all_queries = self._generate_all_queries(query_data)

        search_results_dict = self._retrieve_search_results(all_queries)
        queries_to_paper_ids = self._aggregate_results(search_results_dict)
        
        result = self._format_response(queries_to_paper_ids, show_publication, show_metadata)
        return JsonResponse({"results": result})

    def _generate_all_queries(self, query_data: Dict[str, List[str]]) -> List[Tuple]:
        """ Generate all combinations of queries. """
        return list(product(query_data['primary'], query_data['secondary'], query_data['tertiary']))

    def _retrieve_search_results(self, all_queries: List[Tuple]) -> Dict[Tuple, List[str]]:
        """
        Retrieve search results for each query and map them to paper IDs.
        """
        search_results_dict = {}
        for query in all_queries:
            paper_ids = SearchResult.objects.filter(query=query).values_list('paper_id', flat=True)
            if paper_ids:
                search_results_dict[query] = list(paper_ids)
        return search_results_dict

    def _aggregate_results(self, search_results_dict: Dict[Tuple, List[str]]) -> Dict[List[Tuple], List[str]]:
        """
        Aggregate paper IDs and map them to the search strings that produced them.
        """
        paper_id_to_queries = {}
        for search_string, paper_ids in search_results_dict.items():
            for paper_id in paper_ids:
                if paper_id not in paper_id_to_queries:
                    paper_id_to_queries[paper_id] = []
                if search_string not in paper_id_to_queries[paper_id]:
                    paper_id_to_queries[paper_id].append(search_string)
        
        queries_to_paper_ids = {}
        for paper_id, queries in paper_id_to_queries.items():
            if tuple(queries) not in queries_to_paper_ids:
                queries_to_paper_ids[tuple(queries)] = []
            queries_to_paper_ids[tuple(queries)].append(paper_id)
            
        return queries_to_paper_ids

    def _format_response(self, queries_to_paper_ids: Dict[List[Tuple], List[str]], show_publication: bool, show_metadata: bool):
        """
        Format the response to include search strings and their corresponding paper IDs.
        """
        result = [
            {
                'search_strings': search_strings,
                'num_results': len(paper_ids),
                'search_results': self._get_search_results(paper_ids, show_publication, show_metadata)
            }
            for search_strings, paper_ids in queries_to_paper_ids.items()
        ]
        return result
      
    def _get_search_results(self, paper_ids: List[str], show_publication: bool, show_metadata: bool):
        """
        Get the search results for a list of paper IDs.
        """
        publications  = Publication.objects.filter(paper_id__in=paper_ids)
        metadata      = PublicationMetadata.objects.filter(publication__in=publications)
        
        if show_metadata and show_publication:
            metadata_by_id   = {pub_metadata.publication.paper_id: pub_metadata for pub_metadata in metadata}
            publication_data = []
            for pub in publications:
                data = pub.to_dict()
                if pub_metadata := metadata_by_id.get(pub.paper_id):
                    data = {
                      **data,
                      **pub_metadata.to_dict(show_publication=False)
                    }
                publication_data.append(data)
            return publication_data

        if show_publication:
            return [pub.to_dict() for pub in publications]
        return paper_ids