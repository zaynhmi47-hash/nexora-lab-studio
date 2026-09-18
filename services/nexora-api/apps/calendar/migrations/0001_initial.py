import uuid
from django.db import migrations,models
class Migration(migrations.Migration):
 initial=True; dependencies=[]
 operations=[migrations.CreateModel(name="HijriEvent",fields=[("id",models.UUIDField(default=uuid.uuid4,editable=False,primary_key=True,serialize=False)),("created_at",models.DateTimeField(auto_now_add=True)),("updated_at",models.DateTimeField(auto_now=True)),("deleted_at",models.DateTimeField(blank=True,db_index=True,null=True)),("date",models.DateField(unique=True)),("hijri_month",models.PositiveSmallIntegerField()),("hijri_day",models.PositiveSmallIntegerField()),("title",models.CharField(max_length=255)),("description",models.TextField(blank=True)),("is_published",models.BooleanField(db_index=True,default=True))],options={"db_table":"hijri_events","ordering":("date",)})]
