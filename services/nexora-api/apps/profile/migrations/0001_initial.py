from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("identity", "0001_initial"),
    ]
    operations = [
        migrations.CreateModel(
            name="ProfilePreference",
            fields=[
                ("id", models.UUIDField(editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("notifications_enabled", models.BooleanField(default=True)),
                ("show_arabic_transliteration", models.BooleanField(default=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile_preference", to="identity.nexorauser")),
            ],
            options={"db_table": "profile_preferences"},
        ),
    ]
