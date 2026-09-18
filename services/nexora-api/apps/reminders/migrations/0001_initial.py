import uuid
from django.db import migrations, models
import django.db.models.deletion
class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0001_initial")]
    operations = [migrations.CreateModel(name="PrayerReminderPreference", fields=[
        ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
        ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
        ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
        ("enabled", models.BooleanField(default=False)), ("before_minutes", models.PositiveSmallIntegerField(default=10)),
        ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="prayer_reminder_preference", to="identity.nexorauser"))
    ], options={"db_table":"prayer_reminder_preferences"})]
