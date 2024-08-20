from enum import Enum

from django.db import models


class SearchEngineType(Enum):
    DBLP = "DBLP"
    SEMANTIC_SCHOLAR = "SEMANTIC_SCHOLAR"
    WEB_OF_SCIENCE = "WEB_OF_SCIENCE"
    
    def get_choices():
      return [
        (search_engine_type.name, search_engine_type.value) 
        for search_engine_type in SearchEngineType
      ]

class SearchResult(models.Model):
    query         = models.CharField(max_length=200)
    search_engine = models.CharField(max_length=200, choices=SearchEngineType.get_choices())
    paper_id      = models.CharField(max_length=200)
    timestamp     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.search_engine} - {self.query}"