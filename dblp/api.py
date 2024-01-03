import json
import time
from typing import Dict, Any

import requests
import pandas as pd

from urllib.parse import urlencode
from importlib.resources import open_binary

from requests import Timeout, RequestException, HTTPError, TooManyRedirects
from urllib3.exceptions import MaxRetryError

BASE_URL = 'https://dblp.org/search/publ/api'


def add_ccf_class(results: list[dict]) -> list[dict]:
    def get_ccf_class(venue: str | None, catalog: pd.DataFrame) -> str | None:
        if venue is None:
            return
        if len(series := catalog.loc[catalog.get('abbr').str.lower() == venue.lower(), 'class']) > 0:
            return series.item()
        elif len(series := catalog.loc[catalog.get('url').str.contains(f'/{venue.lower()}/'), 'class']) > 0:
            return series.item()

    catalog = pd.read_csv(open_binary('dblp.data', 'ccf_catalog.csv'))
    for result in results:
        result['ccf_class'] = get_ccf_class(result.get('venue'), catalog=catalog)
    return results


def process_search_result(search_results, existing_results=None, start=0):
    """

    :param search_results: provide the resulting list of papers from query DBLP
    :param existing_results: if this is a paginated result, provide existing results to be appended to
    :param start: the start count for resulting dict
    :return: updated result dict
    """
    if existing_results is None:
        results = {}
    else:
        results = existing_results
    for i, hit in enumerate(search_results, start=start):
        info = search_results[i].get('info')
        results[i] = {
            'title': info.get('title'),
            'year': info.get('year'),
            'venue': info.get('venue'),
            'doi': info.get('doi'),
            'url': info.get('ee'),
            'bibtex': f'{info.get("url")}?view=bibtex'
        }
    return results


def search_by_doi(doi: str) -> dict[Any, dict[str, str | Any]] | None | Any:
    options = {
        'format': 'json',
        'h': 1000,
        'eid': f"DOI:{doi}"
    }

    response = requests.get(f'{BASE_URL}?{urlencode(options)}').json()
    response_count = int(response.get('result').get('hits').get('@total', 0))
    response_papers = response.get('result').get('hits').get('hit')
    if response_count:
        return process_search_result(response_papers)
    else:
        return None


def search(query: str):
    def process_search_result(response_papers, results=None, total_processed=0):
        # Implement your processing logic here
        # For example, to accumulate results:
        if results is None:
            results = {}
        for i, paper in enumerate(response_papers):
            # Process each paper
            results[total_processed + i] = paper
        return results

    def make_request(options):
        try:
            response = requests.get(f'{BASE_URL}?{urlencode(options)}')
            response.raise_for_status()
            return response
        except MaxRetryError:
            print("Max retries exceeded. Could not establish a connection.")
            return None
        except (ConnectionError, Timeout, TooManyRedirects, HTTPError, RequestException) as e:
            print(f"An error occurred: {e}")
            return None

    options = {
        'q': query,
        'format': 'json',
        'h': 1000,
        'f': 0
    }

    response = make_request(options)
    try:
        response = response.json()
    except json.decoder.JSONDecodeError:
        print(f'Error when searching for: {query}. Got response: {response.text}')
        return None

    response_count = int(response.get('result').get('hits').get('@total', 0))
    response_papers = response.get('result').get('hits').get('hit')

    if isinstance(response_count, int) and response_count > 0:
        results = process_search_result(response_papers)

        if response_count > 1000:
            # Handle pagination
            total_processed = 1000
            while total_processed < response_count:
                options['f'] = total_processed
                response = make_request(options)
                response = response.json()
                response_papers = response.get('result').get('hits').get('hit')
                results = process_search_result(response_papers, results, total_processed)
                total_processed += 1000

        return results
    else:
        return None


