import ast
import io
import json

from utils.logger import Logger

from .exportable import Exportable
from .exporter import DataExporter

log = Logger(__name__)


class RisExporter(DataExporter):
    """
    Data Exporter into RIS files.
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
            'searched_from':            'JO',  # Journal name
            'doi':                      'DO',  # DOI
            'authors':                  'AU',  # Authors
            'abstract':                 'AB',  # Abstract
            'publisher':                'PB',  # Publisher
            'semantic_scholar_url':     'UR',  # URL
            'doi_url':                  'UR',  # DOI URL
            'publication_date':         'DA',  # Date
            'field_of_study':           'C1',  # Field of Study
            'conference_journal':       'JO',  # Conference/Journal
            'publication_type':         'TY',  # Type of Publication
        }
        
    def export(self, exportable: Exportable) -> None:
        """
        Export the given data to a RIS format.
        Reference: https://refdb.sourceforge.net/manual-0.9.6/sect1-ris-format.html#:~:text=If%20a%20reference%20has%20multiple,appear%20in%20the%20RIS%20dataset.
        
        :param exportable (Exportable): iterable data to be exported.
        """
        super().export(exportable)
        output = io.StringIO()
        
        for item in self.data:
            # Assuming 'TY' is a default type
            output.write("TY  - JOUR\n")
            data = zip(self.headers, item)
            
            for (field_name, field_value) in data:

                if field_name == "authors":
                    authors = self._parse_authors(field_value)
                    if authors is None:
                        output.write(f"AU  - {field_value}\n")
                    else:
                        for author in authors:
                            name = author.get("name") if isinstance(author, dict) else str(author)
                            if name:
                                output.write(f"AU  - {name}\n")

                elif ris_tag := self.map_to_ris_tag(field_name):
                    output.write(f"{ris_tag}  - {field_value}\n")
                    
            output.write("ER  - \n\n")
        
        self.exported_data = output.getvalue()
        

    @staticmethod
    def _parse_authors(field_value):
        """ Safely parse a serialized authors list (Python literal or JSON). """
        if isinstance(field_value, list):
            return field_value
        if not isinstance(field_value, str) or field_value == '':
            return None
        try:
            parsed = ast.literal_eval(field_value)
        except (ValueError, SyntaxError):
            try:
                parsed = json.loads(field_value)
            except (ValueError, TypeError) as e:
                log.error(f"Could not parse authors field: {e}")
                return None
        return parsed if isinstance(parsed, list) else None

    def map_to_ris_tag(self, field_name: str) -> str:
        """
        Map the given field name to a RIS tag.
        
        :param field_name (str): The field name to be mapped.
        :rettype str: The RIS tag.
        """
        return self.field_mapping.get(field_name, '')
