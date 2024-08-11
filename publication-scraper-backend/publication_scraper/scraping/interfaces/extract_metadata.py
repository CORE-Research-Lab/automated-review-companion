import os
import requests
from serpapi import GoogleSearch
from crossref.restful import Works
from typing import List, Dict, Any, Union

from utils import Profiler
from publication.models import Publication, PublicationMetadata

class PublicationMetadataExtractor:
    
    def __init__(self, papers: List[Publication]):
        # For reference as PublicationMetadata fields -- Can be deleted afterwards
        self.metadata_fields = [
            "PaperTitle",
            "DOI",
            "Authors",
            "Abstract",
            "Publisher",
            "SemanticScholarUrl",
            "DoiUrl",
            "PublicationDate",
            "FieldOfStudy",
            "Conference-Journal",
            "PublicationTypes",
            "SearchString",
            "CitationCount",
            "SearchedFrom",
        ]
        self.sch_fields = [
            "title",
            "externalIds",
            "authors",
            "abstract",
            "url",
            "publicationDate",
            "fieldsOfStudy",
            "venue",
            "publicationTypes",
            "citationCount",
            "externalIds",
        ]
        self.crossref_works = Works()
        self.headers        = { "Content-Type": "application/json" }
        self.base_url       = "https://api.semanticscholar.org/graph/v1/paper"
        
        self.papers = [Publication(**paper) for paper in papers]
        self.extracted_metadata: List[PublicationMetadata] = []
        self.initialize_process()
    
    def initialize_process(self):
        self.extract_data()
        self.post_processing()
        self.save_data()

    @Profiler("Extracting Metadata")
    def extract_data(self): 
        """
        Extract metadata from the provided papers.
        Saves the results to self.extracted_metadata.
        """
        results = []
        for index, paper in enumerate(self.papers):
            print(f"Extracting metadata for paper {index + 1}/{len(self.papers)}")
            extracted_metadata = self._extract_data(paper)
            results.append(extracted_metadata)
            self.extracted_metadata = results
        
    @Profiler("Post-Processing Metadata")
    def post_processing(self):
        """
        Post-process extracted metadata.
        Apply cast_affliation to authors field.
        """
        # TODO: Fix this
        crossref_authors = {}
        FIRST_NAME_IDX = 0
        LAST_NAME_IDX  = -1
        
        for metadata in self.extracted_metadata:
            
            metadata.authors          = self._cast_affliation(metadata.authors)
            metadata.doi_url          = self._get_doi_url(metadata.doi)
            metadata.publication_type = self._get_publication_type(metadata.publication_type)
            crossref_paper            = self._get_crossref_paper(metadata.doi) 
            
            if not metadata.authors:
                continue
            
            # TODO: turn authors into a FK object with (author_name, family, and affiliation)
        
            if crossref_paper:
                crossref_paper_authors = crossref_paper.get("author", [])
                for author in crossref_paper_authors:
                    
                    if author["affiliation"] == []:
                        continue
                    
                    first_name  = author.get("given", "")
                    last_name   = author.get("family", "")
                    author_name = f"{first_name} {last_name}"
                    
                    if author.get("affiliation"):
                        crossref_authors[author_name] = [affil.get("name") for affil in author.get("affiliation")]

            for author in metadata.authors:
                if author["affiliation"] == ["No Affiliation"]:
                    author_name             = author["name"]
                    author_name_components  = author_name.split(" ")
                    author_name             = author_name_components[FIRST_NAME_IDX] + " " + author_name_components[LAST_NAME_IDX]
                    
                    if author_name in crossref_authors:
                        author["affiliation"] = crossref_authors[author_name]
                    # else:
                    #     author["affiliation"] = self._get_affiliations_google_scholar(author_name)
    
    @Profiler("Saving Metadata")
    def save_data(self):
        """
        Save extracted metadata to the database.
        """
        PublicationMetadata.objects.bulk_create(self.extracted_metadata)
        self.extracted_metadata = [metadata.to_dict() for metadata in self.extracted_metadata]
        
    # Helpers
    def _extract_data(self, paper: Publication) -> PublicationMetadata:
        """
        Extract metadata from a single paper.
        """
        pid       = self._get_paper_id(paper.paper_id)
        api_url   = f"{self.base_url}/{pid}"
        sch_paper = self._extract_sch(api_url, self.sch_fields)
        
        # If there is an error, try searching for the paper by its title
        if sch_paper.get("error"):
        
            api_url = f"{self.base_url}/search?query={paper.paper_title}"
            sch_paper = self._extract_sch(api_url, self.sch_fields)
            
            if len(sch_paper.get("data", [])) == 0:
                return PublicationMetadata(
                    publication   = paper,
                    paper_title   = paper.paper_title,
                    doi           = pid,
                    search_string = paper.search_string,
                    searched_from = paper.searched_from
                )
        # ! UNECESSARY ATTRIBUTION TO SEARCH RESULT FROM SCHOLAR
        # else:
        #     sch_paper = sch_paper["data"][0]
        
        # Extract other metadata fields
        doi             = self._get_doi(paper=sch_paper, paper_id=paper.paper_id)
        crossref_paper  = self._get_crossref_paper(doi)
        authors         = self._extract_authors(sch_paper, crossref_paper)
        publisher       = self._extract_publisher(crossref_paper, doi)
        paper_type      = self._extract_paper_type(crossref_paper, sch_paper)
        fields_of_study = self._get_fields_of_study(sch_paper)
        doi_url         = f"https://doi.org/{doi}" if doi else None

        # TODO: paper keywords missing
        # TODO: paper type is conference/journal for arxiv papers
        # TODO: conference-journal name mismatch with publisher, i.e., for paper with name"ChatGPT in education: A discourse analysis of worries and concerns on social media", the conference name is "International Conference on Artificial Intelligence in Education", but the publisher is "Arxiv" (becauseit queryed from arxiv), need "Springer" instead.
        
        metadata = PublicationMetadata(
            publication           = paper,
            paper_title           = paper.paper_title,
            doi                   = doi,
            authors               = authors,
            abstract              = sch_paper.get("abstract"),
            publisher             = publisher,
            semantic_scholar_url  = sch_paper.get("url"),
            doi_url               = doi_url,
            publication_date      = sch_paper.get("publicationDate"),
            field_of_study        = fields_of_study,
            conference_journal    = sch_paper.get("venue"),
            publication_type      = paper_type,
            search_string         = paper.search_string,
            citation_count        = sch_paper.get("citationCount"),
            searched_from         = paper.searched_from
        )
        return metadata
    
    def _extract_sch(self, api_url: str, sch_fields: List[str]) -> Dict[str, Any]:
        """ Extract metadata from Semantic Scholar. """
        
        params = { "fields": ",".join(sch_fields) }
        try:
            response = requests.get(api_url, headers=self.headers, params=params)
            result = response.json()
            return result
        except Exception as e:
            print(e)
            return {"error": e}

    def _get_paper_id(self, paper_id: str) -> str:
        """ Get the paper ID from the record identifiers. """
        
        if "URL" in paper_id and "abs-" in paper_id:
            return "arXiv:" + paper_id.split("abs-")[1].replace("-", ".")
        
        return paper_id
  
    def _get_doi(self, paper: Dict[str, Any], paper_id: str) -> str:
        """ Get the DOI from the paper. """
        
        external_ids = paper.get("externalIds", {})
        doi = external_ids.get("DOI", None)
        
        if doi is None and str(paper_id).startswith("DOI"):
            doi = paper_id.split(":")[1]
        
        return doi
    
    def _get_affiliations_google_scholar(self, author_name) -> list[str]:
        
        params = {
            "engine": "google_scholar_profiles",
            "mauthors": author_name.strip(),
            "api_key": os.environ.get("GOOGLE_SCHOLAR_API_KEY"),
        }

        try:
            search          = GoogleSearch(params)
            results         = search.get_dict()
            metadata        = results.get("metadata", {})
            metadata_status = metadata.get("status")
            profiles        = results.get("profiles", [])
            
            if metadata_status == "Error" or len(profiles) == 0:
                return ["No Affiliation"]
            return [results["profiles"][0]["affiliations"]]
        
        except Exception as e:
            print(e)
            return ["No Affiliation"]

    def _get_crossref_paper(self, doi: str):
        """ Get the paper from Crossref. """
        
        try:
            crossref_paper = self.crossref_works.doi(doi)
        except Exception as e:
            crossref_paper = None
        return crossref_paper
  
    def _extract_authors(self, sch_paper, crossref_paper):
        """Extract authors from the paper."""
        
        authors = None
        if crossref_paper is not None:
            authors = crossref_paper.get("author")
            
        if authors:
            for i in range(len(authors)):
                author        = authors[i]
                author_name   = f'{author.get("given", "")} {author.get("family", "")}'
                affiliations  = author.get("affiliation", [])
                school_names  = (
                    [affil.get("name") for affil in affiliations]
                    if affiliations != []
                    else ["No Affiliation"]
                )
                
                # Create a new dictionary with only 'name' and 'affiliation'
                authors[i] = {
                    "name": author_name.strip(),
                    "affiliation": school_names,
                }
            return authors
            
        authors = sch_paper.get("authors")
        for i in range(len(authors)):
            author        = authors[i]
            affiliations  = author.get("affiliations")
            
            if not(affiliations):
                author_name = author["name"]
                affiliations = ["No Affiliation"]

            authors[i] = {
                "name": author_name.strip(),
                "affiliation": affiliations,
            }

        return authors

    def _extract_publisher(self, crossref_paper: Union[None, Dict[str, Any]], doi: str):
        """ Extract the publisher from the paper. """
        
        if crossref_paper:
            publisher = crossref_paper.get("publisher")
            
        elif doi and "arxiv" in doi.lower():
            publisher = "arXiv"
            
        else:
            publisher = None
        
        return publisher
  
    def _extract_paper_type(self, crossref_paper: Union[None, Dict[str, Any]], sch_paper: Dict[str, Any]):
        """ Extract the paper type from the paper. """
        
        if crossref_paper and crossref_paper.get("type"):
            return [crossref_paper.get("type")]
        
        paper_type = sch_paper.get("publicationTypes", [])
        paper_type = ["".join(t.split("-")).lower() for t in paper_type]
        return paper_type
  
    def _cast_affliation(self, authors):
        """ Cast the 'affiliation' field to a list. """
        
        if not(authors): 
            return authors
        
        for i in range(len(authors)):
            author = dict(authors[i])
            if type(author["affiliation"]) is str:
                author["affiliation"] = [author["affiliation"]]
            authors[i] = author
        
        return authors
  
    def _get_doi_url(self, doi_url: str) -> str:
        """ Get the DOI URL. """
        
        if doi_url and type(doi_url) == str:
            return doi_url
        return None
  
    def _get_publication_type(self, publication_type: Union[str, List[str]]) -> List[str]:
        """ Get the publication type. """
        
        if publication_type and type(publication_type) == str:
            return [ "".join(t.split("-")).lower() for t in publication_type ]  
        return publication_type
    
    def _get_fields_of_study(self, sch_paper: Dict[str, Any]) -> List[str]:
        """ Get the fields of study. """
        
        fields_of_study = sch_paper.get("fieldsOfStudy", [])
        if not(fields_of_study):
            return ""
        return fields_of_study  