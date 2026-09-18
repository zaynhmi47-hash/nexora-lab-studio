from django.db import models
from apps.core.models import AuditableBaseModel

class KnowledgeTopic(AuditableBaseModel):
    key = models.SlugField(max_length=80, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    class Meta:
        db_table = "knowledge_topics"

class KnowledgeSource(AuditableBaseModel):
    class SourceType(models.TextChoices):
        QURAN = "quran", "Quran"
        HADITH = "hadith", "Hadith"
        SCHOLAR = "scholar", "Scholar"
        OFFICIAL = "official", "Official"
        CURATED = "curated", "Curated"
    topic = models.ForeignKey(KnowledgeTopic, on_delete=models.CASCADE, related_name="sources", null=True, blank=True)
    title = models.CharField(max_length=255)
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    collection = models.CharField(max_length=255, blank=True)
    reference = models.CharField(max_length=255, blank=True)
    url = models.URLField(blank=True)
    class Meta:
        db_table = "knowledge_sources"

class HadithEntry(AuditableBaseModel):
    key = models.SlugField(max_length=120, unique=True)
    title = models.CharField(max_length=255)
    collection = models.CharField(max_length=255)
    reference = models.CharField(max_length=255)
    grade = models.CharField(max_length=20, default="unknown")
    summary = models.TextField()
    source = models.ForeignKey(KnowledgeSource, on_delete=models.PROTECT, related_name="hadith_entries")
    class Meta:
        db_table = "knowledge_hadith_entries"
