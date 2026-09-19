import uuid
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("knowledge", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="HadithFavorite",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="hadith_favorites", to="identity.nexorauser")),
                ("hadith", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="favorites", to="knowledge.hadithentry")),
            ],
            options={"db_table": "knowledge_hadith_favorites"},
        ),
        migrations.AddConstraint(model_name="hadithfavorite", constraint=models.UniqueConstraint(fields=("user", "hadith"), name="hadith_user_entry_unique")),
        migrations.AddIndex(model_name="hadithfavorite", index=models.Index(fields=("user", "-created_at"), name="hadith_favorite_user_date_idx")),
    ]
