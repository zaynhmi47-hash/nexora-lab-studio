import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0010_profile_media_storage"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatingMoment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("caption", models.TextField(max_length=2000)),
                ("media_url", models.URLField(blank=True, max_length=2048)),
                ("visibility", models.CharField(choices=[("public", "Public"), ("private", "Only me")], db_index=True, default="public", max_length=16)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_moments", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_moments", "ordering": ("-created_at",)},
        ),
        migrations.AddIndex(
            model_name="datingmoment",
            index=models.Index(fields=["visibility", "created_at"], name="dating_moment_feed_idx"),
        ),
        migrations.AddIndex(
            model_name="datingmoment",
            index=models.Index(fields=["author", "created_at"], name="dating_moment_author_idx"),
        ),
    ]
