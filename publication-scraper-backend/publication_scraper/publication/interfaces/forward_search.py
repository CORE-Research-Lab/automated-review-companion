from typing import List

from ..models import Publication
from .snowballing_search import SnowballingSearch


class ForwardSearch(SnowballingSearch):
  def __init__(self, publications: List[Publication]):
    super().__init__()
    self.publications: List[Publication] = publications
    self.load_publications()
    
  def load_publications(self):
    """ Serialize publications. """

    for publication in self.publications:
      self.results.append({
        "title": publication.paper_title,
        "doi": publication.metadata.doi,
        "references": []
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
        continue

      for referenced_paper in references:
        print(f"    {referenced_paper.title:}", end=":")
        if referenced_paper.externalIds is None: 
          print("     No external IDs")
          continue
        if referenced_paper_doi := referenced_paper.externalIds.get("DOI") == "":
          print("     No DOI")
        else:
          print(f"    {referenced_paper_doi}")

        self.results[i]["references"].append({
          "referenced_paper_title": referenced_paper.title,
          "referenced_doi": referenced_paper.externalIds["DOI"],
          "referenced_url": referenced_paper.url,
          "from_doi": paper_doi
        })
        self.post_process_results()
    return self.results
