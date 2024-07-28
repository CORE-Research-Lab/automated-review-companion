class QueryBuilder:  
  """
  Abstract class for building queries.
  """

  @abstractmethod
  def build_query(self, query: str) -> str:
    pass
