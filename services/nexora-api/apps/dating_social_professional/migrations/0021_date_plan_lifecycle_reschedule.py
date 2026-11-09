from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0020_date_planner_relationship_journey"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.AddField(model_name="datingdateplan", name="cancelled_by", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="dating_plans_cancelled", to="identity.nexorauser")),
        migrations.AddField(model_name="datingdateplan", name="cancelled_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="datingdateplan", name="completed_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="datingdateplan", name="reschedule_proposed_by", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="dating_plan_reschedules_proposed", to="identity.nexorauser")),
        migrations.AddField(model_name="datingdateplan", name="proposed_starts_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="datingdateplan", name="proposed_timezone_name", field=models.CharField(blank=True, max_length=64)),
        migrations.AddField(model_name="datingdateplan", name="proposed_location_name", field=models.CharField(blank=True, max_length=180)),
        migrations.AddField(model_name="datingdateplan", name="proposed_notes", field=models.CharField(blank=True, max_length=1000)),
        migrations.AddField(model_name="datingdateplan", name="reschedule_proposed_at", field=models.DateTimeField(blank=True, null=True)),
    ]
