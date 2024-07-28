import requests
import pandas as pd
from .search_engine import SearchEngine
from semanticscholar import SemanticScholar
from requests.adapters import HTTPAdapter, Retry
from typing import List
from ....publication.models import PublicationType

class SemanticScholarEngine(SearchEngine):
    
    SCH_FIELDS = [
        "title",
        "externalIds",
        "paperIds",
        "urls",
        "authors"
    ]
    
    def __init__(self):
        super().__init__()
        self.MAX_RETRY_COUNT = 5
        self.url = "https://api.semanticscholar.org/graph/v1/paper/search"
        self.bulkUrl = "https://api.semanticscholar.org/graph/v1/paper/search/bulk"
        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": "X48LIBLqr86ouHlnMYd3z052sgEm3Nd2wMORPzu5"
        }
        self.sch_fields = []
        
    def search(self, queries: List[str], year: str) -> pd.DataFrame:
        search_results_df = pd.DataFrame(columns=SemanticScholarEngine.SCH_FIELDS)
        try:
            for search_string in queries:
                print(f"--- Searching for {search_string} ({queries.index(search_string)}/{len(queries)}) ---")
                sch_search_string = self.parse_search_string(search_string)
                
                search_results = self._search(sch_search_string, bulk=True, year=year)
                search_results = search_results["data"]
                
                count = 0
                if count != 0:
                    for result in search_results:
                        count += 1
                        paper_id = self.get_paper_id(result)
                        new_paper = {
                            "PaperTitle": result["title"],
                            "ID": paper_id,
                            "SearchString": sch_search_string,
                            "SearchedFrom": PublicationType.SEMANTIC_SCHOLAR.value
                        }
                        print(f"{count}. sch process paper: ", new_paper)
                        search_results_df = pd.concat([search_results_df, pd.DataFrame(new_paper, index=[0])])
                search_results_df.to_csv('data/raw/search-results-sch.csv', index=False)
                print("XXXXXXXXXXXXXXXXXXXXXXXXXXXX search ends XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        except Exception as e:  
            search_results_df.to_csv('data/raw/search-results-sch.csv', index=False)
            print(f"An error occurred: {e.with_traceback()}")
            print("XXXXXXXXXXXXXXXXXXXXXXXXXXXX search ends XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")      
        return search_results_df
        
        
    def _search(self, query: str, fields: List[str], year: str = None, bulk: bool = False):
        api_url = self.url if not bulk else self.bulkUrl
        self.sch_fields = fields if fields else SemanticScholarEngine.SCH_FIELDS
        search_params = self.parse_search_params(query, self.sch_fields)
        response = self.fetch_search_results(api_url, headers=self.headers, params=search_params)
        return response
    
    def get_paper_id(sch_result):
        if sch_result['externalIds'].get('DOI') is None:
            if sch_result['externalIds'].get('ArXiv') is None:
                sch_paper_id = "paperid:" + sch_result.get("paperId")
            else:
                sch_paper_id = "DOI:10.48550/arXiv." + sch_result['externalIds'].get('ArXiv')
        else:
            sch_paper_id = f"DOI:{sch_result['externalIds'].get('DOI')}"
            
        return sch_paper_id
        
    def parse_search_params(self, query: str, fields: str, year: str):
        if fields == "all": return { "query": query, "year": year }
        return {
            "query": query,
            "year": year,
            "fields": ",".join(fields)
        }
        
    def fetch_search_results(self, url: str, headers: dict, params: dict):
        session = requests.Session()
        retires = Retry(total=self.MAX_RETRY_COUNT, backoff_factor=0.1)
        session.mount(url, HTTPAdapter(max_retries=retires))
        response = session.get(url, headers=headers, params=params)
        return response.json()
    
    def parse_search_string(self, search_string: List[str]):
        # TODO: implement other variations here
        return " + ".join(f"'{term}'" for term in search_string)
        
    