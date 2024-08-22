from semanticscholar import SemanticScholar


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
    
    