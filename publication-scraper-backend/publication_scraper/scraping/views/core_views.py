import string
from itertools import product
from typing import Dict, List, Tuple

from django.http import JsonResponse
from publication.models import Publication, PublicationMetadata
from rest_framework.status import HTTP_400_BAD_REQUEST
from rest_framework.views import APIView
from scraping.domain import (
    DBLPEngine,
    SearchEngine,
    SearchQuery,
    SearchTerm,
    SearchTermProcessor,
    SemanticScholarEngine,
    WebOfScienceEngine,
)
from scraping.interfaces.extract_metadata import PublicationMetadataExtractor
from scraping.models import SearchEngineType, SearchResult
from scraping.serializers.core_serializers import (
    PublicationMetadataSerializer,
    SearchAndCleanSerializer,
    SearchStringDifferenceSerializer,
)
from utils import Logger

log = Logger(__name__)

class SearchAndCleanView(APIView):
    def post(self, request):

        if request.data.get("sources") is None:
            request.data["sources"] = [SearchEngineType.DBLP]
        
        serializer = SearchAndCleanSerializer(data=request.data)
        if serializer.is_valid():
            self.root_papers   = serializer.validated_data['root_papers']
            self.search_terms  = serializer.validated_data['search_terms']
            self.year_start    = serializer.validated_data['year_start']
            self.year_end      = serializer.validated_data['year_end']
            self.sources       = serializer.validated_data['sources']
            
            # Simple three-level search & advanced search
            self.all_search_terms   = [*self.search_terms['primary'], *self.search_terms['secondary'], *self.search_terms['tertiary']]
            self.all_search_terms = list(product(self.all_search_terms))
            print(self.all_search_terms)
            self.all_search_terms = [terms for terms in self.all_search_terms if all(terms)]
            self.advanced_search    = self.search_terms.get('advanced')

            self.query = SearchQuery(
                search_strings  = self.all_search_terms,
                advanced_search = self.advanced_search,
                start_year      = self.year_start,
                end_year        = self.year_end,
            )

            self.results: List[Publication] = []
            self.results = self.search()
            self.all_search_words = self.generate_variants()

            matches = self.get_matches()
            response = [result.to_dict() for result in self.results]
            return JsonResponse({ "variations": self.all_search_words, "results": response, "matches": matches })
        return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST, safe=False)

    def search(self) -> List[Publication]:
        """ Search for publications using the search terms. """
        
        engines: List[SearchEngine] = []

        if SearchEngineType.DBLP in self.sources:
            engines.append(DBLPEngine(self.query))
            
        if SearchEngineType.SEMANTIC_SCHOLAR in self.sources:
            engines.append(SemanticScholarEngine(self.query))

        if SearchEngineType.WEB_OF_SCIENCE in self.sources:
            engines.append(WebOfScienceEngine(self.query))

        log.info("Searching for publications: %s", self.query.search_strings)
        results = []
        results.extend([result for engine in engines for result in engine.search()])
        results = Publication.remove_duplicates(results)
        Publication.bulk_upsert(results)
        return results

    def generate_variants(self) -> List[SearchTerm]:
        """ Generate American and British variants of the search terms. """
        log.info("Generating search term variants...")
        word_processor = SearchTermProcessor(self.all_search_terms)
        word_processor.generate_variants()
        return [search_term.to_dict() for search_term in word_processor.all_search_words]
    
    def get_matches(self) -> List[Publication]:
        """ Get publications that match the root papers. """
        matches = []

        for paper in self.root_papers:
            for result in self.results:
                same_doi = paper.get('doi') and result.paper_id and paper['doi'].lower() in result.paper_id.lower()
                same_title = paper.get('title') and result.paper_title and paper['title'].lower() in result.paper_title.lower()
                if same_doi or same_title:
                    matches.append(paper)

        percentage_match = (len(matches) / len(self.root_papers)) * 100 if self.root_papers else 0
        return { "papers": matches, "num_matches": len(matches), "percentage_match": percentage_match }

class PublicationMetadataView(APIView):
    def post(self, request):
        serializer = PublicationMetadataSerializer(data=request.data)
        if serializer.is_valid():
            
            # NOTE: This is a temporary solution to get all paper IDs.
            # paper_ids = Publication.objects.values_list('paper_id', flat=True)
            
            paper_ids = serializer.validated_data['paper_ids']
            paper_ids = [paper_id for paper_id in paper_ids if paper_id.startswith('DOI')]
            extractor = PublicationMetadataExtractor(paper_ids)
            metadata = [pub_metadata.to_dict(show_publication=True) for pub_metadata in extractor.extracted_metadata]
            failed = [publication.paper_id for _, publication in extractor.failed_papers]
            
            return JsonResponse({ "metadata": metadata, "failed": failed })
        return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST)

class SearchStringDifferenceView(APIView):

    def post(self, request):
        """
        Get the difference of search results between multiple search strings.
        """
        serializer = SearchStringDifferenceSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST)
        
        query_data        = serializer.validated_data['search_terms']
        show_publication  = serializer.validated_data['show_publication']
        show_metadata     = serializer.validated_data['show_metadata']
        all_queries       = self._generate_all_queries(query_data)

        search_results_dict   = self._retrieve_search_results(all_queries)
        queries_to_paper_ids  = self._aggregate_results(search_results_dict)
        
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

