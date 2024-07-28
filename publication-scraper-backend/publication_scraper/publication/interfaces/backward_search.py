import pandas as pd
from typing import List
from ..models import Publication
from .semantic_scholar import SemanticScholar

class BackwardSearch():
  def __init__(self, publications: List[Publication]):
    self.columns = [
      'paper_cited_title',
      'paper_cited_doi',
      'paper_cited_url',
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
    Performs a backward search, acquiring all papers citing the given paper(s).
    """
    for i in range(len(self.results)):
      paper = self.results[i]
      paper_doi = paper["doi"]
      
      if paper_doi == '' or paper_doi is None:
        print(f"WARNING: Paper with title {paper['title']} does not have a DOI. Skipping.")
        continue
      
      sch_paper = self.sch.get_paper(paper_doi)
      if citations := sch_paper.get("citations") is None or sch_paper['citationCount'] == 0:
        print(f"Paper with title {paper['title']} has no citations. Skipping.")
        continue
      
      references = sch_paper.get("citations")
      for referenced_paper in references:
        if referenced_paper['externalIds'] is None: continue
        if referenced_paper_doi := referenced_paper['externalIds'].get("DOI") == "":
          print("     No DOI")
        else:
          print(f"    {referenced_paper_doi}")
        self.results[i]["references"].append({
          "paper_cited_title": referenced_paper.get("title"),
          "paper_cited_doi": referenced_paper.get("externalIds").get("DOI"),
          "paper_cited_url": referenced_paper.get("url"),
          "from_doi": paper_doi
        })
        
    return self.results
      