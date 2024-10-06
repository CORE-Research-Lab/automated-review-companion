import requests
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Union
from bs4 import BeautifulSoup
# import nltk

# nltk.download('wordnet')

from breame.spelling import (
    american_spelling_exists,
    british_spelling_exists,
    get_american_spelling,
    get_british_spelling,
)
# from nltk.corpus import wordnet as wn
from utils import Logger

log = Logger(__name__)

@dataclass
class SearchTerm:
    """ Data class for storing search term variants. """
    word: str
    variants: List[str] = field(default_factory=list)
    synonyms: List[str] = field(default_factory=list)

    def num_variants(self) -> int:
        """ Returns the number of variants. """
        return len(self.variants)
    
    def num_synonyms(self) -> int:
        """ Returns the number of synonyms. """
        return len(self.synonyms)

    def to_dict(self) -> dict:
        """ Returns the search term as a dictionary. """
        return {
            "word": self.word,
            "variants": self.variants,
            "synonyms": self.synonyms
        }


class SearchTermProcessor:

    def __init__(self, search_terms: List[str]):
        self.search_terms = search_terms
        self.all_search_words: List[SearchTerm] = self._get_all_search_words(search_terms)


    def generate_variants(self) -> List[str]:
        """ Generates American and British variants of the search term. """

        for word in self.all_search_words:
            self._get_all_variants(word)
            self._get_synonyms(word)

    def _get_all_search_words(self, search_terms: List[Tuple[str, str, str]]) -> List[SearchTerm]:
        """ Returns all search words from the search terms. """

        _raw_words = []
        all_search_words = []
        for search_term in search_terms:
            for word in search_term:
                if word not in _raw_words:
                    _raw_words.append(word)
                    all_search_words.append(SearchTerm(word))
        return all_search_words


    def _get_all_variants(self, search_term: SearchTerm):
        """ Generates all variants of the search term with breame. """
        
        word = search_term.word 
        log.info(f"Generating variants for {word}...")
        
        if american_spelling_exists(word):
            americanized_word = get_american_spelling(search_term.word)
            search_term.variants.append(americanized_word)

        if british_spelling_exists(word):
            british_word = get_british_spelling(search_term.word)
            search_term.variants.append(british_word)


    def _get_synonyms(self, search_term: SearchTerm):
        """ Generates synonyms of the search term with nltk and thesaurus.com. """
        
        sym_thesaurus = self._get_thesaurus_synonym(search_term)
        
        if sym_thesaurus:
            search_term.synonyms = sym_thesaurus

    def _get_thesaurus_synonym(self, search_term: SearchTerm) -> List[Dict[str, Union[str, List[str]]]]:
        """ 
        Acquires synonyms of the search term from thesaurus.com. 

        Example output:
        [
            {
            "meaning": "a word",
            "synonyms": ["word1", "word2", "word3"]
            },
            {
            "meaning": "another word",
            "synonyms": ["word4", "word5", "word6"]
            }
        ]
        """
        
        log.info(f"Getting synonyms for {search_term.word} from thesaurus.com...")
        data = requests.get(f"https://www.thesaurus.com/browse/{search_term.word}")
        soup = BeautifulSoup(data.text, "html.parser")
        try:
            focus = soup.find_all("div", {"data-type": "synonym-and-antonym-card"})
            meanings = [foci.find("strong").text for foci in focus]
            log.info(f"Meanings: {meanings}")
            grouped_links = [foci.find_all("a") for foci in focus]
            
            data = []
            for idx, group in enumerate(grouped_links):
                synonyms = []
                for link in group:
                    synonyms.append(link.text)
                
                data.append({
                    "meaning": meanings[idx] if idx < len(meanings) else "-",
                    "words": synonyms
                })
            log.info(f"Got synonyms for {search_term.word} - {data}.")
            return data
        except Exception as e:
            log.error(f"Failed to get synonyms for {search_term.word} - {e}.")
            return []