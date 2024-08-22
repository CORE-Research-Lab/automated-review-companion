from itertools import product

from django.http import JsonResponse
from rest_framework.status import HTTP_400_BAD_REQUEST
from rest_framework.views import APIView

from .interfaces.backward_search import BackwardSearch
from .interfaces.forward_search import ForwardSearch
from .interfaces.validation import PublicationValidator
from .models import Publication
from .serializers import (
    PublicationSnowballingSerializer,
    PublicationValidationSerializer,
)


class PublicationSnowballingView(APIView):
    
    def post(self, request):
        # TODO: Change to use query params
        serializer = PublicationSnowballingSerializer(data=request.data)
        if serializer.is_valid():
            
            publication_ids = serializer.validated_data.get('publication_ids')  
            search_type = serializer.validated_data.get('search_type')
            publications = Publication.objects.filter(paper_id__in=publication_ids)
            
            if search_type == 'forward':
                fs = ForwardSearch(publications)
                results = fs.search()
            elif search_type == 'backward':
                bs = BackwardSearch(publications)
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