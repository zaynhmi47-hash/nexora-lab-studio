import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0002_learningcontentblock"),
    ]

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
            options={
                "db_table": "learning_achievements",
                "ordering": ("xp_threshold", "streak_threshold", "lesson_threshold", "title"),
            },
        ),
        migrations.CreateModel(
            name="LearningQuizAttempt",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("correct_answers", models.PositiveIntegerField(default=0)),
                ("total_questions", models.PositiveIntegerField(default=0)),
                ("score_percent", models.PositiveIntegerField(default=0)),
                ("passed", models.BooleanField(default=False)),
                ("completed_at", models.DateTimeField()),
                ("lesson", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="quiz_attempts", to="learning.learninglesson")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="learning_quiz_attempts", to="identity.nexorauser")),
            ],
            options={
                "db_table": "learning_quiz_attempts",
                "indexes": [
                    models.Index(fields=["user", "-completed_at"], name="learning_quiz_user_date_idx"),
                ],
            },
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
