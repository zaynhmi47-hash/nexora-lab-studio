import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("learning", "0001_initial"), ("identity", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="LearningAchievement",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.SlugField(max_length=100, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("xp_threshold", models.PositiveIntegerField(default=0)),
                ("streak_threshold", models.PositiveIntegerField(default=0)),
                ("lesson_threshold", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(db_index=True, default=True)),
            ],
            options={"db_table": "learning_achievements", "ordering": ("xp_threshold", "streak_threshold", "lesson_threshold", "title")},
        ),
        migrations.CreateModel(
            name="LearningUserAchievement",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("earned_at", models.DateTimeField()),
                ("achievement", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="user_awards", to="learning.learningachievement")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="learning_achievements", to="identity.nexorauser")),
            ],
            options={"db_table": "learning_user_achievements"},
        ),
        migrations.AddConstraint(
            model_name="learninguserachievement",
            constraint=models.UniqueConstraint(fields=("user", "achievement"), name="learning_user_achievement_unique"),
        ),
    ]
