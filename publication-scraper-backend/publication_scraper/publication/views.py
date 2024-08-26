import logging
from itertools import product

from django.http import JsonResponse
from rest_framework.status import HTTP_400_BAD_REQUEST
from rest_framework.views import APIView
from utils import Logger

from .interfaces.backward_search import BackwardSearch
from .interfaces.forward_search import ForwardSearch
from .interfaces.validation import PublicationValidator
from .models import Publication
from .serializers import (
    PublicationSnowballingSerializer,
    PublicationValidationSerializer,
)

log = Logger(__name__)

class PublicationSnowballingView(APIView):
    
    def post(self, request):
        serializer = PublicationSnowballingSerializer(data=request.data)
        if serializer.is_valid():
            
            publication_ids = serializer.validated_data.get('publication_ids')  
            search_type = serializer.validated_data.get('search_type')
            show_metadata = serializer.validated_data.get('show_metadata')
            publications = Publication.objects.filter(paper_id__in=publication_ids)

            log.info(f"Snowballing {search_type} search for {len(publications)} publications.")
            
            if search_type == 'forward':
                fs = ForwardSearch(publications, show_metadata=show_metadata)
                results = fs.search()

            elif search_type == 'backward':
                bs = BackwardSearch(publications, show_metadata=show_metadata)
                results = bs.search()
                
            return JsonResponse({ "results": results})
        return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST)


class PublicationValidationView(APIView):

    def post(self, request):
        serializer = PublicationValidationSerializer(data=request.data)
        if serializer.is_valid():

            query = serializer.validated_data['query']
            all_queries = list(product(query['primary'], query['secondary'], query['tertiary']))
            
            validator = PublicationValidator()
            validated_results = validator.validate(all_queries)
            
            return JsonResponse(validated_results)
        return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST)