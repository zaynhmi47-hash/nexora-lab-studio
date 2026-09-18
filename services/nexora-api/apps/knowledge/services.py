from .models import HadithEntry, KnowledgeTopic

class KnowledgeService:
    @staticmethod
    def _source(source):
        return {"id": str(source.id), "title": source.title, "type": source.source_type, "collection": source.collection or None, "reference": source.reference or None, "url": source.url or None}

    @classmethod
    def snapshot(cls):
        topics = KnowledgeTopic.objects.filter(deleted_at__isnull=True).prefetch_related("sources").order_by("title")
        hadith = HadithEntry.objects.select_related("source").filter(deleted_at__isnull=True, source__deleted_at__isnull=True)
        return {"topics": [{"id": x.key, "title": x.title, "description": x.description, "sourceCount": sum(1 for s in x.sources.all() if s.deleted_at is None)} for x in topics], "hadith": [cls._hadith(x) for x in hadith]}

    @classmethod
    def _hadith(cls, item):
        return {"id": item.key, "title": item.title, "collection": item.collection, "reference": item.reference, "grade": item.grade, "summary": item.summary, "source": cls._source(item.source)}

    @classmethod
    def topic_detail(cls, key):
        topic = KnowledgeTopic.objects.filter(key=key, deleted_at__isnull=True).prefetch_related("sources").first()
        if topic is None: return None
        sources = [s for s in topic.sources.all() if s.deleted_at is None]
        return {"id": topic.key, "title": topic.title, "description": topic.description, "sourceCount": len(sources), "sources": [cls._source(s) for s in sources]}

    @classmethod
    def hadith_detail(cls, key):
        item = HadithEntry.objects.select_related("source").filter(key=key, deleted_at__isnull=True, source__deleted_at__isnull=True).first()
        return cls._hadith(item) if item else None
