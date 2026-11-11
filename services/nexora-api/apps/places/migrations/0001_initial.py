import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="IslamicPlace",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=255)),
                ("place_type", models.CharField(choices=[("mosque", "Mosque"), ("musalla", "Musalla"), ("islamic_center", "Islamic Center")], default="mosque", max_length=30)),
                ("address", models.CharField(max_length=500)),
                ("city", models.CharField(blank=True, max_length=120)),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("description", models.TextField(blank=True)),
                ("is_published", models.BooleanField(db_index=True, default=True)),
            ],
            options={"db_table": "islamic_places", "ordering": ("name",)},
        )
    ]
