import uuid
import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):
 initial=True
 dependencies=[("identity","0001_initial")]
 operations=[
  migrations.CreateModel(name="PrayerSchedule",fields=[("id",models.UUIDField(default=uuid.uuid4,editable=False,primary_key=True,serialize=False)),("created_at",models.DateTimeField(auto_now_add=True)),("updated_at",models.DateTimeField(auto_now=True)),("deleted_at",models.DateTimeField(blank=True,db_index=True,null=True)),("date",models.DateField(unique=True)),("date_label",models.CharField(max_length=64)),("location_label",models.CharField(default="Current location",max_length=255)),("hijri_label",models.CharField(blank=True,max_length=128)),("sunrise",models.CharField(max_length=8))],options={"db_table":"prayer_schedules","ordering":("-date",)}),
  migrations.CreateModel(name="PrayerTime",fields=[("id",models.UUIDField(default=uuid.uuid4,editable=False,primary_key=True,serialize=False)),("created_at",models.DateTimeField(auto_now_add=True)),("updated_at",models.DateTimeField(auto_now=True)),("deleted_at",models.DateTimeField(blank=True,db_index=True,null=True)),("name",models.CharField(choices=[("Fajr","Fajr"),("Dhuhr","Dhuhr"),("Asr","Asr"),("Maghrib","Maghrib"),("Isha","Isha")],max_length=8)),("time",models.CharField(max_length=8)),("sort_order",models.PositiveSmallIntegerField()),("schedule",models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name="prayers",to="prayer.prayerschedule"))],options={"db_table":"prayer_times","ordering":("sort_order",)}),
  migrations.CreateModel(name="PrayerCompletion",fields=[("id",models.UUIDField(default=uuid.uuid4,editable=False,primary_key=True,serialize=False)),("created_at",models.DateTimeField(auto_now_add=True)),("updated_at",models.DateTimeField(auto_now=True)),("deleted_at",models.DateTimeField(blank=True,db_index=True,null=True)),("completed",models.BooleanField(default=False)),("prayer",models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name="completions",to="prayer.prayertime")),("user",models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name="prayer_completions",to="identity.nexorauser"))],options={"db_table":"prayer_completions"}),
  migrations.AddConstraint(model_name="prayertime",constraint=models.UniqueConstraint(fields=("schedule","name"),name="prayer_schedule_name_unique")),
  migrations.AddConstraint(model_name="prayercompletion",constraint=models.UniqueConstraint(fields=("user","prayer"),name="prayer_user_time_unique"))]
