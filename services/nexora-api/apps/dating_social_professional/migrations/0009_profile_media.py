from django.db import migrations, models
import uuid

class Migration(migrations.Migration):
    dependencies = [("dating_social_professional", "0008_profile_enrichment")]
    operations = [
        migrations.CreateModel(
            name="DatingProfileMedia",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("active", models.BooleanField(db_index=True, default=True)),
                ("url", models.URLField(max_length=2048)),
                ("media_type", models.CharField(choices=[("image", "Image")], default="image", max_length=16)),
                ("sort_order", models.PositiveSmallIntegerField(default=0)),
                ("is_primary", models.BooleanField(default=False)),
                ("profile", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="media", to="dating_social_professional.datingprofile")),
            ],
            options={"db_table": "dating_profile_media", "ordering": ("sort_order", "created_at"), "indexes": [models.Index(fields=("profile", "active", "sort_order"), name="dating_profi_profile_1f4f9c_idx")]},
        ),
    ]
