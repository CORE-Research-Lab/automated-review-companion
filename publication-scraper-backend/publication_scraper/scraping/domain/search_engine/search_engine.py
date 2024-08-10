from enum import Enum
from abc import abstractmethod
from typing import List
from django.db import IntegrityError, transaction

from utils import Profiler
from publication.models import Publication

class SearchEngine:
  
    def __init__(self):
      self.results: List[Publication] = []
      pass
    
    @abstractmethod
    def search(self):
      pass
    
    @abstractmethod
    def _parse_search_string(self, query: str) -> str:
      pass

    @Profiler("Save Results")
    def save_results(self) -> List[Publication]:
        """ Saves the results of publications if not duplicated by paper title or id. """
        
        paper_ids             = [result.paper_id for result in self.results]
        existing_publications = Publication.objects.filter(paper_id__in=paper_ids).values_list('paper_id', flat=True)
        new_results           = [result for result in self.results if result.paper_id not in existing_publications]
        
        with transaction.atomic():
            try:
                saved_publications = Publication.objects.bulk_create(new_results)
            except IntegrityError as e:
                print(f"IntegrityError occurred: {e}")
                saved_publications = []

        return saved_publications
