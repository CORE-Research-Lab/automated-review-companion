import os
import requests
import numpy as np
from serpapi import GoogleSearch
from crossref.restful import Works
from typing import List, Dict, Any
from ...publication.models import Publication, PublicationMetadata

class PublicationMetadataExtractor:
  
  def __init__(self):
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
    
    self.extracted_metadata: List[PublicationMetadata] = []
    self.initialize_process()
    
  def initialize_process(self):
    self.extract_data()
    self.post_processing()
    self.save_data()

  def extract_data(self, papers: List[Publication]): 
    """
    Extract metadata from the provided papers.
    """
    results = []
    for index, paper in enumerate(papers):
      print(f"Extracting metadata for paper {index + 1} of {len(papers)}")
      extracted_metadata = self._extract_data(paper)
      extracted_metadata_dict = extracted_metadata.to_dict()
      results.append(extracted_metadata_dict)
      # TODO: persist extracted_metadata to database
    self.extracted_metadata = results
      
  def post_processing(self):
    """
    Post-process extracted metadata.
    Apply cast_affliation to authors field.
    """
    for result in self.extracted_metadata:
      result.authors = self._cast_affliation(result.authors)
      result.doi_url = result.doi_url if type(result.doi_url) == str and "None" not in result.doi_url else None
      result.publication_type = ["".join(t.split("-")).lower() for t in eval(result.publication_type)] if result.publication_type != np.nan and type(result.publication_type) == str else result.publication_type      

      # TODO: turn authors into a FK object with (author_name, family, and affiliation)
      # crossref_paper = self.get_crossref_paper(result.doi)
      # if crossref_paper:
      #   for author in crossref_paper.get("author", []):
      #       if author["affiliation"] == []:
      #           continue
      #       author_name = author.get("given", "") + " " + author.get("family", "")
      #       if author.get("affiliation"):
      #           crossref_authors[author_name] = [affil.get("name") for affil in author.get("affiliation")]

      # for author in result.authors:
      #   if author["affiliation"] == ["No Affiliation"]:
      #       author_name = author["name"]
      #       # only get first and last name
      #       author_name = author_name.split(" ")[0] + " " + author_name.split(" ")[-1]
      #       if author_name in crossref_authors:
      #           author["affiliation"] = crossref_authors[author_name]
      #       else:
      #           author["affiliation"] = self.get_affiliations_google_scholar(author_name)
  
  def save_data(self):
    """
    Save extracted metadata to the database.
    """
    for result in self.extracted_metadata:
      result.save()
      
  # Helpers
  def _extract_data(self, paper: Publication) -> PublicationMetadata:
    """
    Extract metadata from a single paper.
    """
    pid = "arXiv:" + pid.split("abs-")[1].replace("-", ".") if "URL" in pid and "abs-" in pid else paper.paper_id

    api_url = f"https://api.semanticscholar.org/graph/v1/paper/{pid}"
    sch_paper = self._extract_sch(api_url, self.sch_fields)
    if sch_paper.get("error") is not None:
        # if can't search with ID, search by paper title
        paper_title = paper.paper_title
        api_url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={paper_title}"
        sch_paper = self._extract_sch(api_url, self.sch_fields)

        if len(sch_paper.get("data", [])) == 0:
            return PublicationMetadata(
                paper_title=paper.paper_title,
                doi=pid,
                authors=None,
                abstract=None,
                publisher=None,
                semantic_scholar_url=None,
                doi_url=None,
                publication_date=None,
                field_of_study=None,
                conference_journal=None,
                publication_types=None,
                search_string=paper.search_string,
                citation_count=None,
                searched_from=paper.searched_from
            )
        else:
            sch_paper = sch_paper["data"][0]

    doi = pid.split(":")[1] if doi is None and str(pid).startswith("DOI") else sch_paper.get("externalIds", {}).get("DOI", None)
    crossref_paper = self._get_crossref_paper(doi)

    # TODO: paper keywords missing
    # TODO: paper type is conference/journal for arxiv papers
    # TODO: conference-journal name mismatch with publisher, i.e., for paper with name"ChatGPT in education: A discourse analysis of worries and concerns on social media", the conference name is "International Conference on Artificial Intelligence in Education", but the publisher is "Arxiv" (becauseit queryed from arxiv), need "Springer" instead.
    
    metadata = PublicationMetadata(
        paper_title=paper.paper_title,
        doi=doi,
        authors=self._extract_authors(sch_paper, crossref_paper),
        abstract=sch_paper.get("abstract", None),
        publisher=self._extract_publisher(crossref_paper, doi),
        semantic_scholar_url=sch_paper.get("url", None),
        doi_url=f"https://doi.org/{doi}" if doi is not None else None,
        publication_date=sch_paper.get("publicationDate", None),
        field_of_study=sch_paper.get("fieldsOfStudy", []),
        conference_journal=sch_paper.get("venue", None),
        publication_types=self._extract_paper_type(crossref_paper, sch_paper),
        search_string=paper.search_string,
        citation_count=sch_paper.get("citationCount", None),
        searched_from=paper.searched_from
    )
    return metadata.to_json()
    
  def _extract_sch(self, api_url, sch_fields):
      headers = { "Content-Type": "application/json" }
      params = { "fields": ",".join(sch_fields) }
      try:
          response = requests.get(api_url, headers=headers, params=params)
          result = response.json()
          return result
      except Exception as e:
          print(e)
          return {"error": e}

  def _get_affiliations_google_scholar(self, author_name) -> list[str]:
    params = {
        "engine": "google_scholar_profiles",
        "mauthors": author_name.strip(),
        "api_key": os.environ.get("GOOGLE_SCHOLAR_API_KEY"),
    }

    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        if (
            results.get("search_metadata", {}).get("status") == "Error"
            or len(results.get("profiles", [])) == 0
        ):
            return ["No Affiliation"]
        else:
            return [results["profiles"][0]["affiliations"]]
    except Exception as e:
        print(e)
        return ["No Affiliation"]

  def _get_crossref_paper(self, doi: str):
    try:
        crossref_paper = self.crossref_works.doi(doi)
    except Exception as e:
        crossref_paper = None
    return crossref_paper
  
  def _extract_authors(self, sch_paper, crossref_paper):
      authors = None
      if crossref_paper is not None:
          authors = crossref_paper.get("author")
      if authors is not None:
          for i in range(len(authors)):
              author = authors[i]
              author_name = author.get("given", "") + " " + author.get("family", "")
              affiliations = author.get("affiliation", [])
              school_names = (
                  [affil.get("name") for affil in affiliations]
                  if affiliations != []
                  else ["No Affiliation"]
              )
              # Create a new dictionary with only 'name' and 'affiliation'
              authors[i] = {
                  "name": author_name.strip(),
                  "affiliation": school_names,
              }
      else:
          authors = sch_paper.get("authors")
          for i in range(len(authors)):
              author = authors[i]
              affiliations = author.get("affiliations")
              if affiliations is None:
                  author_name = author["name"]
                  affiliations = ["No Affiliation"]

              authors[i] = {
                  "name": author_name.strip(),
                  "affiliation": affiliations,
              }

      return authors

  def _extract_publisher(self, crossref_paper: None | Dict[str, Any], doi: str):
    if crossref_paper is not None:
      publisher = crossref_paper.get("publisher")
    elif doi and "arxiv" in doi.lower():
      publisher = "arXiv"
    else:
      publisher = None
    return publisher
  
  def _extract_paper_type(self, crossref_paper: None | Dict[str, Any], sch_paper: Dict[str, Any]):
    if crossref_paper is not None and crossref_paper.get("type") is not None:
        paper_type = [crossref_paper.get("type")]
    else:
        paper_type = sch_paper.get("publicationTypes", [])
        if paper_type is not None:
            paper_type = ["".join(t.split("-")).lower() for t in paper_type]
    return paper_type
  
  def _cast_affliation(self, authors):
    if authors == np.nan or type(authors) != str or authors == "[]" or authors == "" or authors == None:
      return authors
    print(authors)
    authors = eval(authors)
    for i in range(len(authors)):
      author = dict(authors[i])
      if type(author["affiliation"]) is str:
        print(author["affiliation"])
        author["affiliation"] = [author["affiliation"]]
      authors[i] = author
    return authors