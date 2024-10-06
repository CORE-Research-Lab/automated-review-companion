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
        self.file_extension     = 'bib'
        self.exported_data      = ""
        self.CITATION_KEY_IDX   = 0
        self.field_mapping = {
            'paper_title':              'title',
            'doi':                      'doi',  # DOI
            'authors':                  'author',  # Authors
            'publisher':                'publisher',  # Publisher
            'publication_date':         'year',  # Date
            'conference_journal':       'journal',  # Conference/Journal

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
                name, value = self._get_field_outputs(field_name, field_value)
                if name is not None:
                    output.write(f"\t{name} = {{{value}}},\n")
                
            output.write("}\n\n")
            
        self.exported_data = output.getvalue()
        
    def _get_field_outputs(self, field_name: str, field_value: str):
        """
        Get the field outputs based on the given field name.
        
        :param field_name (str): The name of the field.
        :param field_value (str): The value of the field.
        """
        if field_name in self.field_mapping:
            field_name = self.field_mapping[field_name]

            if field_name == 'author':
                authors = [self._parse_author_name(author.get("name")) for author in field_value]

                field_value = ' and '.join(authors)

            if field_name == 'year':
                try: 
                    field_value = field_value.split('-')[0]
                except Exception as e:
                    pass

            return field_name, field_value
        return None, None
    
    def _parse_author_name(self, author_name: str) -> str:
        """
        Parse the author name into the Bibtex format.
        
        :param author_name (str): The name of the author.
        :rettype str: The parsed author name.
        """
        name_parts = author_name.split(" ")
        if len(name_parts) == 1:
            return name_parts[0]
        return f"{name_parts[-1]}, {' '.join(name_parts[:-1])}"