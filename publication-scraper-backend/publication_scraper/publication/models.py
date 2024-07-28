import json
from django.db import models
from enum import Enum
# Create your models here.
class PublicationStatus(Enum):
        NEW = 'NEW'
        VALIDATED = 'VALIDATED'

class Publication(models.Model):
    paper_title = models.CharField(max_length=200)
    paper_id = models.CharField(max_length=200)
    search_string = models.CharField(max_length=200)
    searched_from = models.CharField(max_length=200)
    formatted_search_string = models.CharField(max_length=200, default="")
    status = models.CharField(max_length=200, choices=[(status.value, status.name) for status in PublicationStatus])
    
    def to_dict(self):
        fields = [field.name for field in self._meta.fields]
        return {field: getattr(self, field) for field in fields}
    
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)

class PublicationMetadata(models.Model):
    paper_title = models.CharField(max_length=200)
    doi = models.CharField(max_length=200)
    authors = models.CharField(max_length=200)
    abstract = models.TextField()
    publisher = models.CharField(max_length=200)
    semantic_scholar_url = models.CharField(max_length=200)
    doi_url = models.CharField(max_length=200)
    publication_date = models.DateField()
    field_of_study = models.CharField(max_length=200)
    conference_journal = models.CharField(max_length=200)
    publication_type = models.CharField(max_length=200)
    search_string = models.CharField(max_length=200)
    citation_count = models.IntegerField()
    searched_from = models.CharField(max_length=200)
    
    def to_dict(self):
        fields = [field.name for field in self._meta.fields]
        return {field: getattr(self, field) for field in fields}
    
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)