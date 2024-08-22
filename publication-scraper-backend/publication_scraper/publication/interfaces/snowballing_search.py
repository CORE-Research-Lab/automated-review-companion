from typing import Any, Dict

from semanticscholar import SemanticScholar

from publication.models import (
    Publication,
    PublicationMetadata,
    PublicationReference,
    PublicationStatus,
)
from scraping.interfaces.extract_metadata import PublicationMetadataExtractor
from scraping.models import SearchEngineType


class SnowballingSearch:
    def __init__(self):
        self.columns = [
          'referenced_paper_title',
          'referenced_doi',
          'referenced_url',
          'from_doi',
        ]
        self.results = []
        self.sch = SemanticScholar()
    

    def load_publications(self):
        """
        Load publications into the dataframe.
        """
        raise NotImplementedError
    

    def search(self):
        """
        Perform a search.
        """
        raise NotImplementedError
    
    
    def post_process_results(self, reference: PublicationReference):
        """
        Post-process the results.

        Adds the results to the database if they do not already exist.
        Also populates the database with the metadata of the results.
        """

        paper_doi = f"DOI:{reference.ref_doi}"
        publication = Publication.objects.filter(paper_id=paper_doi)
        
        if publication.exists():
            print(f"Publication with DOI {paper_doi} already exists.")
            publication = publication.first()
            metadata = publication.metadata
            
            if metadata is None:
                metadata = self._get_metadata(paper_doi)
                publication.metadata = metadata
                publication.save()
        else:
            # Create publication
            publication = Publication.objects.create(
                paper_id = paper_doi,
                paper_title = reference.ref_paper_title,
                search_string = reference.type.value,
                searched_from = SearchEngineType.SEMANTIC_SCHOLAR,
                formatted_search_string = reference.type.value,
                status = PublicationStatus.NEW,
            )
            publication.save()
            
            metadata = self._get_metadata(paper_doi)
            metadata.save()
            publication.metadata = metadata
            publication.save()
            
        return publication
    

    def _get_metadata(self, paper_doi: str) -> PublicationMetadata:
        """ Get metadata for a given DOI. """

        print(f"Getting metadata for {paper_doi}")
        extractor = PublicationMetadataExtractor(paper_doi)
        return extractor.extracted_metadata[0]
        

    def _get_publication_data(self, publication: Publication) -> Dict[str, Any]:
        """ Get publication data if show_metadata is flagged. """

        if self.show_metadata:
            return publication.metadata.to_dict(show_publication = True)
        return publication.to_dict()