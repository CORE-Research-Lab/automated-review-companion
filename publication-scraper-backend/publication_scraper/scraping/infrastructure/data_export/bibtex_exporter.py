import io

from .exportable import Exportable
from .exporter import DataExporter


class BibtexExporter(DataExporter):
    """
    Data Exporter into CSV files.
    Github Issue: (#10) Different Export Format
    """
    
    def __init__(self) -> None:
        super().__init__()
        self.headers            = []
        self.data               = []
        self.content_type       = 'text/plain'
        self.file_extension     = 'bibtex'
        self.exported_data      = ""
        self.CITATION_KEY_IDX   = 0
        self.field_mapping = {
            'paper_title':              'title',
            'doi':                      'doi',  # DOI
            'authors':                  'author',  # Authors
            'publisher':                'PB',  # Publisher
            'semantic_scholar_url':     'UR',  # URL
            'doi_url':                  'UR',  # DOI URL
            'publication_date':         'year',  # Date
            'field_of_study':           'C1',  # Field of Study
            'conference_journal':       'JO',  # Conference/Journal
            'publication_type':         'TY',  # Type of Publication

        }
        
        
        
    def export(self, exportable: Exportable) -> None:
        """
        Export the given data to a Bibtex format.
        
        :param exportable (Exportable): iterable data to be exported.
        :rettype str: Exported data as a string in CSV format.
        """
        super().export(exportable)
        output = io.StringIO()
        
        for item in self.data:
            citation_key    = item[self.CITATION_KEY_IDX]
            entry_type      = "article"
            output.write(f"@{entry_type}{{{citation_key},\n")
            
            data = zip(
                self.headers[self.CITATION_KEY_IDX + 1:], 
                item[self.CITATION_KEY_IDX + 1:]
            )
            for field_name, field_value in data:
                self._get_field_outputs(field_name, field_value, output)
                output.write(f"\t{field_name} = {{{field_value}}},\n")
                
            output.write("}\n\n")
            
        self.exported_data = output.getvalue()
        
    def _get_field_outputs(self, field_name: str, field_value: str):
        pass