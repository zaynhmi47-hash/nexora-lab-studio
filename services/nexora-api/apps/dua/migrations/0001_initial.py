import uuid
from django.db import migrations,models
class Migration(migrations.Migration):
 initial=True
 dependencies=[]
 operations=[migrations.CreateModel(name="DuaEntry",fields=[("id",models.UUIDField(default=uuid.uuid4,editable=False,primary_key=True,serialize=False)),("created_at",models.DateTimeField(auto_now_add=True)),("updated_at",models.DateTimeField(auto_now=True)),("deleted_at",models.DateTimeField(blank=True,db_index=True,null=True)),("key",models.SlugField(max_length=120,unique=True)),("title",models.CharField(max_length=255)),("category",models.CharField(max_length=80)),("arabic",models.TextField()),("transliteration",models.TextField(blank=True)),("translation",models.TextField()),("reference",models.CharField(blank=True,max_length=255)),("is_published",models.BooleanField(db_index=True,default=True))],options={"db_table":"dua_entries","ordering":("category","id")})]
