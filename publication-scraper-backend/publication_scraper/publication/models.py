import json
from enum import Enum
from typing import List

from django.db import models, transaction
from scraping.infrastructure.data_export.exportable import Exportable


# Create your models here.
class PublicationStatus(Enum):
    NEW = 'NEW'
    VALIDATED = 'VALIDATED'

class Publication(models.Model, Exportable):
    paper_id                = models.CharField(max_length=200, primary_key=True)
    paper_title             = models.CharField(max_length=200)
    search_string           = models.CharField(max_length=200)
    searched_from           = models.CharField(max_length=200)
    formatted_search_string = models.CharField(max_length=200, default="")
    status                  = models.CharField(max_length=200, default=PublicationStatus.NEW, choices=[(status.value, status.name) for status in PublicationStatus])

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['paper_id', 'paper_title'], name='unique_paper_id_and_title')
        ]
        
    def exportable_fields(self) -> List[str]:
        """ Return the field names that can be exported. """
        fields = [field.name for field in self._meta.fields]
        fields.append('metadata')
        return fields
        
    def to_dict(self):
        fields      = [field.name for field in self._meta.fields]
        dictionary  = {field: getattr(self, field) for field in fields}
        
        if "id" in dictionary: 
            del dictionary["id"]
        
        return dictionary
    
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
    
    def __str__(self) -> str:
        return f"{self.paper_title} - {self.paper_id} - {self.search_string} - {self.searched_from} - {self.status}"
    
    @staticmethod
    def remove_duplicates(publications: List['Publication']) -> List['Publication']:
        unique_papers = []
        paper_ids = []
        paper_titles = []
        
        for publication in publications:
            if publication.paper_id not in paper_ids and publication.paper_title not in paper_titles:
                unique_papers.append(publication)
                paper_ids.append(publication.paper_id)
                paper_titles.append(publication.paper_title)
                
        return unique_papers
    
    @staticmethod
    def bulk_upsert(publications: List['Publication']) -> None:
        """ Bulk upsert the publications. """

        paper_ids = [result.paper_id for result in publications]
        existing_publications = Publication.objects.filter(paper_id__in=paper_ids)
        
        existing_dict = {pub.paper_id: pub for pub in existing_publications}
    
        to_update = []
        to_create = []

        for result in publications:
            if result.paper_id in existing_dict:
                pub             = existing_dict[result.paper_id]
                pub_data        = result.__dict__
                
                # Update non-empty, non-None fields
                for field, value in pub_data.items():
                    if value and field in pub_data:
                        setattr(pub, field, value)

                to_update.append(pub)
            else:
                to_create.append(result)

        with transaction.atomic():
            if to_update:
                Publication.objects.bulk_update(
                    to_update, 
                    [field.name for field in Publication._meta.fields if field.name != 'paper_id']
                )
            if to_create:
                Publication.objects.bulk_create(to_create)
        
        print(f"──────── Bulk upserted {len(to_update)}, created {len(to_create)} publications ────────")

class PublicationMetadata(models.Model):
    publication             = models.OneToOneField(Publication, on_delete=models.CASCADE, related_name='metadata')
    paper_title             = models.CharField(max_length=200, default="")
    doi                     = models.CharField(max_length=200, default="")
    authors                 = models.CharField(max_length=200, default="")
    abstract                = models.TextField()
    publisher               = models.CharField(max_length=200, default="")
    semantic_scholar_url    = models.CharField(max_length=200, default="")
    doi_url                 = models.CharField(max_length=200, default="")
    publication_date        = models.DateField()
    field_of_study          = models.CharField(max_length=200, default="")
    conference_journal      = models.CharField(max_length=200, default="")
    publication_type        = models.CharField(max_length=200, default="")
    search_string           = models.CharField(max_length=200, default="")
    citation_count          = models.IntegerField()
    searched_from           = models.CharField(max_length=200, default="")
    
    def to_dict(self, show_publication: bool = False):
        fields  = [field.name for field in self._meta.fields]
        md_dict = {
            field: getattr(self, field) 
            for field in fields
            if field not in ['id', 'publication']
        }
        if not(show_publication):
            return md_dict
        return { **md_dict, **self.publication.to_dict() }   
    
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
    
    
    
    @staticmethod
    def bulk_upsert(metadata: List['PublicationMetadata']) -> None:
        """ Bulk upsert the publication metadata. """
        
        key_fields = ['id', 'publication']

        incoming_ids = [md.publication_id for md in metadata]
        existing_metadata = PublicationMetadata.objects.filter(publication_id__in=incoming_ids)
        existing_ids = set(existing_metadata.values_list('publication_id', flat=True))
    
        to_update = []
        to_create = []

        for md in metadata:
            if md.publication_id in existing_ids:
                existing_md         = PublicationMetadata.objects.get(publication_id=md.publication_id)
                existing_md_data    = md.__dict__
                
                # Update non-empty, non-None fields
                for field, value in existing_md_data.items():
                    if value and field in existing_md_data:
                        setattr(existing_md, field, value)
                        
                to_update.append(existing_md)
            else:
                to_create.append(PublicationMetadata(**md))

        with transaction.atomic():
            if to_update:
                fields = [field.name for field in PublicationMetadata._meta.fields if field.name not in key_fields]
                PublicationMetadata.objects.bulk_update(to_update, fields)
            if to_create:
                PublicationMetadata.objects.bulk_create(to_create)
        
        print(f"──────── Bulk upserted {len(to_update)}, created {len(to_create)} publications ────────")