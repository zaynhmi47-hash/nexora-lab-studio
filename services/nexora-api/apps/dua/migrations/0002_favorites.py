import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("dua", "0001_initial"), ("identity", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="DuaFavorite",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("dua", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="favorites", to="dua.duaentry")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="dua_favorites", to="identity.nexorauser")),
            ],
            options={"db_table": "dua_favorites"},
        ),
        migrations.AddConstraint(
            model_name="duafavorite",
            constraint=models.UniqueConstraint(fields=("user", "dua"), name="dua_user_entry_unique"),
        ),
        migrations.AddIndex(
            model_name="duafavorite",
            index=models.Index(fields=("user", "-created_at"), name="dua_favorite_user_date_idx"),
        ),
    ],
]
