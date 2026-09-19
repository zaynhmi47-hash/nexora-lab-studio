from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0003_seed_achievements"),
    ]

    operations = [
        migrations.CreateModel(
            name="LearningQuizAttempt",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("correct_answers", models.PositiveIntegerField(default=0)),
                ("total_questions", models.PositiveIntegerField(default=0)),
                ("score_percent", models.PositiveIntegerField(default=0)),
                ("passed", models.BooleanField(default=False)),
                ("completed_at", models.DateTimeField()),
                ("lesson", models.ForeignKey(on_delete=models.deletion.PROTECT, related_name="quiz_attempts", to="learning.learninglesson")),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="learning_quiz_attempts", to="identity.nexorauser")),
            ],
            options={
                "db_table": "learning_quiz_attempts",
            },
        ),
        migrations.AddIndex(
            model_name="learningquizattempt",
            index=models.Index(fields=["user", "-completed_at"], name="learning_quiz_attempt_user_date_idx"),
        ),
    ]
