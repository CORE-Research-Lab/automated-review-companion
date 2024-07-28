from enum import Enum
from abc import abstractmethod

class SearchEngine:
  
  def __init__(self):
    pass
  
  @abstractmethod
  def search(self):
    pass
  
  @abstractmethod
  def parse_search_string(self, query: str) -> str:
    pass

class SearchEngineType(Enum):
  DBLP = "DBLP"
  SEMANTIC_SCHOLAR = "SEMANTIC_SCHOLAR"
  WEB_OF_SCIENCE = "WEB_OF_SCIENCE"
  
  def get_choices():
    return [(search_engine_type.name, search_engine_type.value) for search_engine_type in SearchEngineType]
  