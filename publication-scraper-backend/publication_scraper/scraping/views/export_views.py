from rest_framework.views import APIView
from django.http import HttpResponse
from publication.models import Publication
from django_filters.rest_framework import DjangoFilterBackend
from scraping.infrastructure.data_export.exporter import ExportType, DataExporter
from scraping.infrastructure.data_export.csv_exporter import CsvExporter
from utils import Controller

# from ..infrastructure. import export_to_csv, export_to_bibtex, export_to_ris

class ExportView(APIView):
    
    @Controller
    def get(self, request, *args, **kwargs):
        """ Export the publications based on the given filters. """
        
        export_format = request.query_params.get('format', ExportType.CSV.value)
        
        # Apply filters
        filter_backend = DjangoFilterBackend()
        filter_backend.request = request
        publications = filter_backend.filter_queryset(request, Publication.objects.all(), self)
        publications = list(publications)
        
        exporter = self.get_exporter(export_format)
        exporter.export(publications)
        
        response = HttpResponse(exporter.exported_data, content_type=exporter.content_type)
        response['Content-Disposition']           = f'attachment; filename="publications.{exporter.file_extension}"'
        response["Access-Control-Expose-Headers"] = "Content-Type, Content-Disposition"
        return response
      
    def get_exporter(self, format: str) -> DataExporter:
        """
        Get the exporter based on the given format.
        
        :param format (str): The format to be used.
        :rettype DataExporter: The exporter to be used.
        """
        
        if format == ExportType.CSV.value:
            return CsvExporter()
        # elif format == ExportType.BIBTEX.value:
        #     return BibtexExporter()
        # elif format == ExportType.RIS.value:
        #     return RisExporter()
          
        raise ValueError(f"Unsupported format: {format}")        
