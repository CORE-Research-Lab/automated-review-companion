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
                output.write(f"\t{field_name} = {{{field_value}}},\n")
                
            output.write("}\n\n")
            
        self.exported_data = output.getvalue()
        