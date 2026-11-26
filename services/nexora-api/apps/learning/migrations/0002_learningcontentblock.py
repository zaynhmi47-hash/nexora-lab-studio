# Generated for modular Dignity lesson content blocks.
import apps.learning.models
import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("learning", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="LearningContentBlock",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(blank=True, max_length=255)),
                ("kind", models.CharField(choices=[("text", "Text"), ("image", "Image"), ("video", "Video"), ("audio", "Audio"), ("document", "Document"), ("link", "External link")], default="text", max_length=16)),
                ("body", models.TextField(blank=True, help_text="Plain text content; use separate blocks for each section.")),
                ("file", models.FileField(blank=True, null=True, upload_to=apps.learning.models.learning_content_upload_to, validators=[apps.learning.models.validate_learning_content_file])),
                ("external_url", models.URLField(blank=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(db_index=True, default=True)),
                ("lesson", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="content_blocks", to="learning.learninglesson")),
            ],
            options={"db_table": "learning_content_blocks", "ordering": ("sort_order", "created_at")},
        ),
        migrations.AddConstraint(
            model_name="learningcontentblock",
            constraint=models.UniqueConstraint(fields=("lesson", "sort_order"), name="learning_content_lesson_order_unique"),
        ),
    ]
