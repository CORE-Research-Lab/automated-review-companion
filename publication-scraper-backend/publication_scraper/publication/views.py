import datetime
import logging
from itertools import product
from typing import List

from django.http import JsonResponse
from rest_framework.status import HTTP_400_BAD_REQUEST
from rest_framework.views import APIView
from utils import Logger

from .interfaces.backward_search import BackwardSearch
from .interfaces.filter.llm_filter import FilterResponse, LLMFilter, FilterAnswerExamples, FilterAnswer
from .interfaces.forward_search import ForwardSearch
from .interfaces.validation import PublicationValidator
from .models import Publication, PublicationMetadata, PublicationLLMUsage
from .serializers import (
    PublicationLLMFilterSerializer,
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


class PublicationLLMFilterView(APIView):


    def check_for_validity(self, request, paper_ids):
        """ Checks if the user has submitted MAX_AMOUNT paper ids already for the day. """
        MAX_LLM_CALL_COUNT = 1000
        ip = request.META.get('REMOTE_ADDR')
        today = datetime.date.today()
        usage = PublicationLLMUsage.objects.filter(ip_address=ip, date=today).first()
        if not usage:
            usage = PublicationLLMUsage(ip_address=ip, date=today)
        usage.count += len(paper_ids)
        usage.save()

        if usage.count >= (MAX_LLM_CALL_COUNT - len(paper_ids)):
            return f"You have reached the maximum number of filter requests for the day ({MAX_LLM_CALL_COUNT})."

    def post(self, request):

        serializer = PublicationLLMFilterSerializer(data=request.data)
        if serializer.is_valid():

            includeExamples: bool
            includeRationale: bool
            examples: List[FilterAnswerExamples] = []
            
            questions = serializer.validated_data['questions']
            paper_ids = serializer.validated_data.get('paper_ids')
            answers = serializer.validated_data.get('answers')
            options = serializer.validated_data.get('options')

            validity = self.check_for_validity(request, paper_ids)
            if validity:
                log.error(f"LLM filter error: {validity}")
                return JsonResponse({ "Max attempts reached" : validity }, status=HTTP_400_BAD_REQUEST)

            if options:
                includeExamples = options.get('includeExamples', False)
                includeRationale = options.get('includeRationale', False)

            # Remove paper_ids that are in answers
            for paper in answers:
                examples = [
                    FilterAnswerExamples(
                        paper_id = paper['paper_id'],
                        responses = [
                            FilterAnswer(
                                id       = response['id'],
                                answer   = response['answer'],
                                rationale = response['rationale']
                            ) for response in paper['responses']
                        ] 
                    ) for paper in answers
                ]
                log.info(f"LLM filter example: {paper}.")

            # Data transformation
            publications = list(PublicationMetadata.objects.filter(publication_id__in=paper_ids))
            log.info(f"Filtering {len(publications)} publications.")
            if len(publications) != len(paper_ids):
                missing_papers = set(paper_ids) - set([p.publication_id for p in publications])
                missing_publications = Publication.objects.filter(paper_id__in=missing_papers)
                publications.extend(missing_publications)
            
            questions = [
                FilterResponse(
                    id       = question['id'],
                    question = question['question'],
                    answer   = question['answer']
                ) for question in questions
            ]

            # Filter publications by questions
            llm_filter = LLMFilter()
            llm_filter.parse(publications, questions, examples, includeRationale, includeExamples)
            results = llm_filter.completion()
            
            if includeExamples:
                results = [*answers, *results]    

            return JsonResponse({ "results" : results })
        return JsonResponse(serializer.errors, status=HTTP_400_BAD_REQUEST)