import json
from django.db import models
from enum import Enum
# Create your models here.
class PublicationStatus(Enum):
    NEW = 'NEW'
    VALIDATED = 'VALIDATED'

class Publication(models.Model):
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
    
    def to_dict(self):
        fields = [field.name for field in self._meta.fields]
        return {field: getattr(self, field) for field in fields}
    
    def to_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)