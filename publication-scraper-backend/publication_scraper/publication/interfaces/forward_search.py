from typing import List

from ..models import Publication, PublicationReference, PublicationReferenceType
from .snowballing_search import SnowballingSearch


class ForwardSearch(SnowballingSearch):
  
  def __init__(
      self, 
      publications: List[Publication], 
      show_metadata: bool = False
  ):
    """ Initialize the forward search. """
    super().__init__()
    self.publications: List[Publication] = publications
    self.show_metadata: bool = show_metadata
    self.load_publications()
    
  def load_publications(self):
    """ Serialize publications. """

    for publication in self.publications:
      self.results.append({
        "title": publication.paper_title,
        "doi": publication.metadata.doi,
        "references": [],
        **self._get_publication_data(publication)
      })

  def search(self):
    """
    Performs a forward search, acquiring all references of the paper(s).
    """
    for i in range(len(self.results)):
      publication = self.results[i]
      paper_doi = publication["doi"]
      
      if paper_doi == "" or paper_doi is None:
        print(f"WARNING: Paper with title {publication['title']} does not have a DOI. Skipping.")
        continue
      
      sch_paper = self.sch.get_paper(paper_doi)

      references = sch_paper.references
      if references is None:
        print(f"Skipped Paper | No references: {publication['title']}")
        continue

      for referenced_paper in references:
        if referenced_paper.externalIds is None: 
          continue
        
        reference = PublicationReference(
            src = self.publications[i],
            src_doi = paper_doi,
            ref_paper_title = referenced_paper.title,
            ref_doi = referenced_paper.externalIds.get("DOI"),
            ref_url = referenced_paper.url,
            type = PublicationReferenceType.REFERENCE
        )
      
        reference_publication = self.post_process_results(reference)
        reference_publication = self._get_publication_data(reference_publication)
        self.results[i]["references"].append(reference_publication)
    return self.results
