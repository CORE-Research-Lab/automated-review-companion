from enum import Enum

class SearchEngineType(Enum):
    DBLP = "DBLP"
    SEMANTIC_SCHOLAR = "SEMANTIC_SCHOLAR"
    WEB_OF_SCIENCE = "WEB_OF_SCIENCE"
    
    def get_choices():
      return [
        (search_engine_type.name, search_engine_type.value) 
        for search_engine_type in SearchEngineType
      ]
    