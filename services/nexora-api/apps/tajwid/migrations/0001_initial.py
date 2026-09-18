import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="TajwidTopic",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.SlugField(max_length=80, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("short_description", models.TextField(blank=True)),
                ("sort_order", models.PositiveIntegerField(unique=True)),
                ("xp_reward", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(db_index=True, default=True)),
            ],
            options={"db_table": "tajwid_topics", "ordering": ("sort_order",)},
        ),
        migrations.CreateModel(
            name="TajwidPracticeItem",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.SlugField(max_length=120, unique=True)),
                ("prompt", models.TextField()),
                ("options", models.JSONField(default=list)),
                ("correct_option_index", models.PositiveIntegerField(default=0)),
                ("explanation", models.TextField(blank=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("topic", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="practice_items", to="tajwid.tajwidtopic")),
            ],
            options={"db_table": "tajwid_practice_items", "ordering": ("topic", "sort_order")},
        ),
        migrations.CreateModel(
            name="TajwidProgress",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("practice_completed", models.PositiveIntegerField(default=0)),
                ("assessment_completed", models.BooleanField(default=False)),
                ("xp_earned", models.PositiveIntegerField(default=0)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="tajwid_progress", to="identity.nexorauser")),
            ],
            options={"db_table": "tajwid_progress"},
        ),
        migrations.CreateModel(
            name="TajwidTopicCompletion",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("completed_at", models.DateTimeField()),
                ("topic", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="user_completions", to="tajwid.tajwidtopic")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tajwid_topic_completions", to="identity.nexorauser")),
            ],
            options={"db_table": "tajwid_topic_completions"},
        ),
        migrations.AddConstraint(
            model_name="tajwidtopiccompletion",
            constraint=models.UniqueConstraint(fields=("user", "topic"), name="tajwid_user_topic_unique"),
        ),
    ]
