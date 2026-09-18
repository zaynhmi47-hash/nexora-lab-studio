import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="KnowledgeTopic",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.SlugField(max_length=80, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
            ],
            options={"db_table": "knowledge_topics"},
        ),
        migrations.CreateModel(
            name="KnowledgeSource",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=255)),
                ("source_type", models.CharField(choices=[("quran", "Quran"), ("hadith", "Hadith"), ("scholar", "Scholar"), ("official", "Official"), ("curated", "Curated")], max_length=20)),
                ("collection", models.CharField(blank=True, max_length=255)),
                ("reference", models.CharField(blank=True, max_length=255)),
                ("url", models.URLField(blank=True)),
                ("topic", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="sources", to="knowledge.knowledgetopic")),
            ],
            options={"db_table": "knowledge_sources"},
        ),
        migrations.CreateModel(
            name="HadithEntry",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.SlugField(max_length=120, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("collection", models.CharField(max_length=255)),
                ("reference", models.CharField(max_length=255)),
                ("grade", models.CharField(default="unknown", max_length=20)),
                ("summary", models.TextField()),
                ("source", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="hadith_entries", to="knowledge.knowledgesource")),
            ],
            options={"db_table": "knowledge_hadith_entries"},
        ),
    ]
