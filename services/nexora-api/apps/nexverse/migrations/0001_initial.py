import django.core.validators
import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="NexverseAuthor",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("slug", models.SlugField(max_length=100, unique=True)),
                ("pen_name", models.CharField(max_length=160)),
                ("bio", models.TextField(blank=True)),
                ("avatar_url", models.URLField(blank=True, max_length=2048)),
                ("is_verified", models.BooleanField(db_index=True, default=False)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="nexverse_author", to="identity.nexorauser")),
            ],
            options={"db_table": "nexverse_authors", "ordering": ("pen_name",)},
        ),
        migrations.CreateModel(
            name="NexverseWork",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("slug", models.SlugField(max_length=160, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("synopsis", models.TextField(blank=True)),
                ("cover_image_url", models.URLField(blank=True, max_length=2048)),
                ("language_code", models.CharField(db_index=True, default="id", max_length=12)),
                ("genre", models.CharField(blank=True, db_index=True, max_length=64)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("published", "Published"), ("completed", "Completed"), ("hiatus", "Hiatus")], db_index=True, default="draft", max_length=16)),
                ("visibility", models.CharField(choices=[("public", "Public"), ("unlisted", "Unlisted")], default="public", max_length=16)),
                ("content_rating", models.CharField(default="general", max_length=16)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("view_count", models.PositiveBigIntegerField(default=0)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="works", to="nexverse.nexverseauthor")),
            ],
            options={"db_table": "nexverse_works", "ordering": ("-published_at", "-created_at")},
        ),
        migrations.CreateModel(
            name="NexverseChapter",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("chapter_number", models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ("slug", models.SlugField(max_length=160)),
                ("title", models.CharField(max_length=255)),
                ("summary", models.CharField(blank=True, max_length=500)),
                ("content", models.TextField()),
                ("is_free_preview", models.BooleanField(db_index=True, default=False)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("published", "Published")], db_index=True, default="draft", max_length=16)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("work", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="chapters", to="nexverse.nexversework")),
            ],
            options={"db_table": "nexverse_chapters", "ordering": ("chapter_number",)},
        ),
        migrations.AddConstraint(
            model_name="nexversechapter",
            constraint=models.UniqueConstraint(fields=("work", "chapter_number"), name="nex_chapter_number_unique"),
        ),
        migrations.AddConstraint(
            model_name="nexversechapter",
            constraint=models.UniqueConstraint(fields=("work", "slug"), name="nex_chapter_slug_unique"),
        ),
        migrations.AddIndex(
            model_name="nexversework",
            index=models.Index(fields=["status", "visibility", "published_at"], name="nex_work_catalog_idx"),
        ),
        migrations.AddIndex(
            model_name="nexversework",
            index=models.Index(fields=["genre", "language_code"], name="nex_work_genre_lang_idx"),
        ),
    ]
