import io 
import csv
from .exporter import DataExporter
from .exportable import Exportable

class RisExporter(DataExporter):
    """
    Data Exporter into CSV files.
    Github Issue: (#10) Different Export Format
    """
    def __init__(self) -> None:
        super().__init__()
        self.headers        = []
        self.data           = []
        self.content_type   = 'text/plain'
        self.file_extension = 'ris'
        self.exported_data  = ""
        self.field_mapping = {
            "paper_id":                 "ID",
            'paper_title':              'TI',
            'search_string':            'AB',
            'searched_from':            'JO',  # Journal name
            'formatted_search_string':  'N2',  # Note
            'status':                   'N1',  # Status 
        }
        
    def export(self, exportable: Exportable) -> None:
        """
        Export the given data to a RIS format.
        
        :param exportable (Exportable): iterable data to be exported.
        """
        super().export(exportable)
        output = io.StringIO()
        
        for item in self.data:
            # TODO - types other than JOUR (Journal) based on metadata
            output.write("TY  - JOUR\n")
            data = zip(self.headers, item)
            
            for (field_name, field_value) in data:
                if ris_tag := self.map_to_ris_tag(field_name):
                    output.write(f"{ris_tag}  - {field_value}\n")
                    
            output.write("ER  - \n\n")
        
        self.exported_data = output.getvalue()
        

    def map_to_ris_tag(self, field_name: str) -> str:
        """
        Map the given field name to a RIS tag.
        
        :param field_name (str): The field name to be mapped.
        :rettype str: The RIS tag.
        """
        return self.field_mapping.get(field_name)
        