import time
import requests
import pandas as pd
from typing import List
from requests import HTTPError
from .search_engine import SearchEngine
from ....publication.models import PublicationType


class WebOfScienceEngine(SearchEngine):
    def __init__(self, start_year: str, end_year: str) -> None:
        super().__init__()
        self.url = 'https://api.clarivate.com/api/wos'
        self.headers = {
            'X-ApiKey': '1c19a6c1114c4ee6f84142bba8040e6bbaa9825b',
            "Content-Type": "application/json"
        }
        self.wos_fields = []
        self.start_year = ""
        self.end_year = ""
        
    def search(self, queries: List[str], year_start: int, year_end: int):
        """
        Refer to https://webofscience.help.clarivate.com/en-us/Content/search-operators.html
        """
        try:
            for idx, query in enumerate(queries):
                search_string = self.parse_search_string(query)
                print(f"--- Searching Web of Science for: {search_string} ({idx + 1}/{len(query)}) ---")

                response_json = self._search(wos_search_string=search_string)
                wos_results = response_json['data']
                total_results = response_json['total']
                print(f">>> Web of Science total: {total_results}")

                # Add results to DataFrame
                if wos_results:
                    search_results_df = pd.DataFrame(wos_results)
                    all_search_results_df = pd.concat([all_search_results_df, search_results_df], ignore_index=True)

                time.sleep(0.5)
                print(f"--- Search end for: {search_string} ({idx + 1}/{len(query)}) ---\n\n")

            # Save the complete DataFrame to a CSV file
            all_search_results_df.to_csv('data/raw/search-results-web-of-science.csv', index=False)
            print("XXXXXXXXXXXXXXXXXXXXXXXXXXXX Search ends. Results saved to 'search-results-web-of-science.csv' XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        except Exception as e:
            print(f"Error occurred: {e.with_traceback()}")
            all_search_results_df.to_csv('data/raw/search-results-web-of-science.csv', index=False)
    
    def _search(self, search_string):
        start_record = 1
        total_records = None
        paper_count = 0
        search_results = []

        while True:
            data = self.fetch_data(start_record)
            if data.get("QueryResult").get("RecordsFound") == 0 or data is None:
                total_records = 0
                break

            if total_records is None:
                total_records = data['QueryResult']['RecordsFound']

            records = data['Data']['Records']['records']['REC']
            for record in records:
                uid = record['UID']
                for identifier in record['dynamic_data']['cluster_related']['identifiers']['identifier']:
                    if isinstance(identifier, dict) and identifier['type'] == 'doi':
                        uid = f"DOI:{identifier['value']}"
                        break
                titles = record['static_data']['summary']['titles']['title']
                title = next((t['content'] for t in titles if t['type'] == 'item'), 'No title found')
                search_results.append({
                    'PaperTitle': title,
                    'ID': uid,
                    'SearchString': search_string,
                    'SearchedFrom': PublicationType.WEB_OF_SCIENCE.value
                })
            paper_count += len(records)
            start_record += len(records)

            if paper_count >= total_records:
                break

        return {
            'total': total_records,
            'data': search_results
        }
        
    def fetch_data(self, start_record, wos_search_string: str):
        params = {
            'usrQuery': f'(TS=({wos_search_string})) AND PY=({self.start_year}-{self.end_year})',
            'count': 100,
            'firstRecord': start_record,
            'databaseId': 'WOS',
            'links': "false",
        }
        
        try:
            response = requests.get(self.url, headers=self.headers, params=params)
            response.raise_for_status()  # Raises an HTTPError for certain status codes
            return response.json()
        except HTTPError as http_err:
            if response.status_code == 429:
                print("Rate limit reached, waiting 30s to retry...")
                time.sleep(30)  # Adjust the sleep time as necessary
                return self.fetch_data(start_record)  # Retry the request
            else:
                print(f"HTTP error occurred: {http_err}")
                return None
        except Exception as err:
            print(f"Other error occurred: {err}")
            return None

    
    def parse_search_string(self, search_string: List[str]):
        # TODO: implement other variations here
        return "".join(f'"{term}"' for term in search_string)