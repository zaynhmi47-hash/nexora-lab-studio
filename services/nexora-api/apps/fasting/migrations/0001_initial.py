import django.db.models.deletion
from django.db import migrations,models
import uuid
class Migration(migrations.Migration):
    initial=True
    dependencies=[("identity","0001_initial")]
    operations=[migrations.CreateModel(name="FastingRecord",fields=[("id",models.UUIDField(default=uuid.uuid4,editable=False,primary_key=True,serialize=False)),("created_at",models.DateTimeField(auto_now_add=True)),("updated_at",models.DateTimeField(auto_now=True)),("deleted_at",models.DateTimeField(blank=True,db_index=True,null=True)),("date",models.DateField()),("status",models.CharField(choices=[("fasted","Fasted"),("broken","Broken"),("excused","Excused")],default="fasted",max_length=20)),("note",models.CharField(blank=True,max_length=255)),("user",models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name="fasting_records",to="identity.nexorauser"))],options={"db_table":"fasting_records","ordering":("-date",)}),migrations.AddConstraint(model_name="fastingrecord",constraint=models.UniqueConstraint(fields=("user","date"),name="fasting_user_date_unique"))]
