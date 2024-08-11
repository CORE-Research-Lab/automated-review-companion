import pandas as pd
from typing import List
from ..models import Publication
from semanticscholar import SemanticScholar

class ForwardSearch():
  def __init__(self, publications: List[Publication]):
    self.columns = [
      'referenced_paper_title',
      'referenced_doi',
      'referenced_url',
      'from_doi',
    ]
    self.publications = publications
    self.results = []
    self.sch = SemanticScholar()
    
    # Load publications into the dataframe
    self.load_publications()
    
  def load_publications(self):
    """
    Load publications into the dataframe.
    """
    for publication in self.publications:
      self.results = self.results.append({
        "title": publication.title,
        "doi": publication.doi,
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
      references = sch_paper.get("references")
      if references is None:
        continue
      
      for referenced_paper in references:
        if referenced_paper['externalIds'] is None: continue
        if referenced_paper_doi := referenced_paper['externalIds'].get("DOI") == "":
          print("     No DOI")
        else:
          print(f"    {referenced_paper_doi}")
        self.results[i]["references"].append({
          "referenced_paper_title": referenced_paper.get("title"),
          "referenced_doi": referenced_paper.get("externalIds").get("DOI"),
          "referenced_url": referenced_paper.get("url"),
          "from_doi": paper_doi
        })
    return self.results
