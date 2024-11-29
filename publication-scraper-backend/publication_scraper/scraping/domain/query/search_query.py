from enum import Enum
from typing import List


class SearchQueryType(str, Enum):
    SIMPLE = "SIMPLE"
    ADVANCED = "ADVANCED"


class SearchQuery:
    
    def __init__(
        self, 
        search_strings: List[str], 
        advanced_search: str        = None,
        start_date: str             = None,
        end_date: str               = None,
    ):
        self.search_strings = search_strings
        self.advanced_search = advanced_search
        self.start_date = start_date #"YYYY-MM-DD"
        self.end_date = end_date #"YYYY-MM-DD"

        if advanced_search:
            self.search_type = SearchQueryType.ADVANCED
        else:
            self.search_type = SearchQueryType.SIMPLE