from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("dating_social_professional", "0007_notification_preferences_presence")]
    operations = [
        migrations.AddField(model_name="datingprofile", name="interests", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="datingprofile", name="education", field=models.CharField(blank=True, max_length=160)),
        migrations.AddField(model_name="datingprofile", name="occupation", field=models.CharField(blank=True, max_length=160)),
        migrations.AddField(model_name="datingprofile", name="location_city", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="datingprofile", name="location_country", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="datingprofile", name="location_latitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="datingprofile", name="location_longitude", field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
        migrations.AddField(model_name="datingprofile", name="max_distance_km", field=models.PositiveIntegerField(blank=True, default=100)),
    ]
