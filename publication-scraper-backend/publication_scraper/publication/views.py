from itertools import product
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.status import HTTP_400_BAD_REQUEST

from .interfaces.forward_search import ForwardSearch
from .interfaces.backward_search import BackwardSearch
from .interfaces.validation import PublicationValidator
from .serializer import PublicationSnowballingSerializer, PublicationValidationSerializer

# Create your views here.
class PublicationSnowballingView(APIView):
    def get(self, request):
        # TODO: Change to use query params
        serializer = PublicationSnowballingSerializer(data=request.data)
        if serializer.is_valid():

            search_type = serializer.validated_data['search_type']
            if search_type == 'forward':
                fs = ForwardSearch()
                results = fs.search()
            elif search_type == 'backward':
                bs = BackwardSearch()
                results = bs.search()
                
            return JsonResponse(results)
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
        