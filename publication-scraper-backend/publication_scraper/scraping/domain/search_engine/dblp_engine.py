import json
import time
import requests
import pandas as pd
from .search_engine import SearchEngine
from requests.adapters import HTTPAdapter, Retry
from typing import List

from typing import Dict, Any, Union, Optional
from urllib.parse import urlencode
from importlib.resources import open_binary
from requests import Timeout, RequestException, HTTPError, TooManyRedirects
from urllib3.exceptions import MaxRetryError
from ....publication.models import PublicationType, Publication

class DBLPEngine(SearchEngine):

    def __init__(self, queries: List[str], year_start: str, year_end: str):
        super().__init__()
        self.url = "https://dblp.org/search/publ/api"
        self.queries = queries
        self.year_start = year_start
        self.year_end = year_end
        
        self.years = self._format_years(year_start, year_end)
        self.search_results_df = pd.DataFrame(columns=Publication.__annotations__.keys())
    
    def _format_years(self, year_start: str, year_end: str):
        years = [str(year) for year in range(int(year_start), int(year_end) + 1)]
        return " " + "|".join(f"{year}" for year in years)
  
    def search(self) -> pd.DataFrame:
        """
        Search for papers on DBLP.
        """
        try:
            for search_string in self.queries:
                print(f"--- searching for {search_string} ({self.queries.index(search_string)}/{len(search_string)}) ---")
                dblp_search_string = self.parse_search_string(search_string)
                dblp_search_results = self._search(dblp_search_string + self.years)
                
                if dblp_search_results is None:
                    print(f">>> DBLP total: 0")
                else:
                    print(f">>> DBLP total: {len(dblp_search_results)}")
                    dblp_count = 0
                    for _, result in dblp_search_results.items():
                        dblp_count += 1
                        if result.get('info').get('doi') is None:
                            paper_id = "url:" + result.get("info").get("url")
                        else:
                            paper_id = "DOI:" + result.get('info').get('doi')

                        new_paper = Publication(
                            paper_title = result.get('info').get('title'),   
                            paper_id = paper_id,
                            search_string = dblp_search_string,
                            searched_from = PublicationType.DBLP.value
                        )
                        print(f"{dblp_count}. DBLP process paper: ", new_paper)
                        self.search_results_df = pd.concat([self.search_results_df, pd.DataFrame([new_paper.to_json])], ignore_index=True)
                time.sleep(10)
                print(f"--- searching end for {search_string} ({self.queries.index(search_string)}/{len(self.queries)}) ---\n\n")
            self.search_results_df.to_csv('data/raw/search-results-dblp.csv', index=False)
            print("XXXXXXXXXXXXXXXXXXXXXXXXXXXX search ends XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        except Exception as e:
            self.search_results_df.to_csv('data/raw/search-results-dblp.csv', index=False)
            print(f"An error occurred: {e.with_traceback()}")
            print("XXXXXXXXXXXXXXXXXXXXXXXXXXXX search ends XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        return self.search_results_df

    def _search(self, query: str):
        options = {
            'q': query,
            'format': 'json',
            'h': 1000,
            'f': 0
        }

        response = self.make_request(options)
        if response is not None:
            try:
                response = response.json()
            except json.decoder.JSONDecodeError:
                print(f'Error when searching for: {query}. Got response: {response.text}')
                return None
        else:
            print("No response received.")
            return None


        response_count = int(response.get('result').get('hits').get('@total', 0))
        response_papers = response.get('result').get('hits').get('hit')

        if isinstance(response_count, int) and response_count > 0:
            results = self._process_search_result(response_papers)

            if response_count > 1000:
                # Handle pagination
                total_processed = 1000
                while total_processed < response_count:
                    options['f'] = total_processed
                    response = self.make_request(options)
                    response = response.json()
                    response_papers = response.get('result').get('hits').get('hit')
                    results = self.process_search_result(response_papers, results, total_processed)
                    total_processed += 1000

            return results
        else:
            return None
    
    def process_search_result(self, response_papers, results=None, total_processed=0):
            # Implement your processing logic here
            # For example, to accumulate results:
            if results is None:
                results = {}
            for i, paper in enumerate(response_papers):
                # Process each paper
                results[total_processed + i] = paper
            return results

    def make_request(self, options, max_retries=3):
        attempts = 0
        while attempts < max_retries:
            try:
                response = requests.get(f'{self.url}?{urlencode(options)}')
                response.raise_for_status()
                return response
            except (MaxRetryError, ConnectionError, Timeout, TooManyRedirects, HTTPError, RequestException) as e:
                attempts += 1
                print(f"Error occurred: {e}, Attempt {attempts} failed. Retrying...")
                time.sleep(1)
        print("Max retries exceeded. Could not establish a connection.")
        return None

    def parse_search_string(self, query: List[str]):
        return ' '.join(f'"{keyword}"$ ' for keyword in query)