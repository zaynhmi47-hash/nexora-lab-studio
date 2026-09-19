import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tajwid", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TajwidPracticeCompletion",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("completed_at", models.DateTimeField()),
                ("practice_item", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="user_completions", to="tajwid.tajwidpracticeitem")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tajwid_practice_completions", to="identity.nexorauser")),
            ],
            options={"db_table": "tajwid_practice_completions"},
        ),
        migrations.AddConstraint(
            model_name="tajwidpracticecompletion",
            constraint=models.UniqueConstraint(fields=("user", "practice_item"), name="tajwid_user_practice_unique"),
        ),
    ]
