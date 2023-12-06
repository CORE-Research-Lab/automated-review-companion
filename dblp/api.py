from typing import Dict, Any

import requests
import pandas as pd

from urllib.parse import urlencode
from importlib.resources import open_binary

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


def search(query: str) -> dict:
    """
    https://dblp.org/faq/How+to+use+the+dblp+search+API.html
    :param query:
    :return:
    """

    options = {
        'q': query,
        'format': 'json',
        'h': 1000,
        'f': 0
    }
    response = requests.get(f'{BASE_URL}?{urlencode(options)}').json()
    response_count = int(response.get('result').get('hits').get('@total', 0))
    response_papers = response.get('result').get('hits').get('hit')

    if response_count:
        if response_count <= 1000:
            return process_search_result(response_papers)
        else:
            # response > 1000, use pagination
            total_processed = 0
            results = {}
            while total_processed != response_count:
                options = {
                    'q': query,
                    'format': 'json',
                    'h': 1000,
                    'f': total_processed
                }
                response = requests.get(f'{BASE_URL}?{urlencode(options)}').json()
                response_papers = response.get('result').get('hits').get('hit')

                results = process_search_result(response_papers, results, total_processed)
                total_processed += 1000
            return results

