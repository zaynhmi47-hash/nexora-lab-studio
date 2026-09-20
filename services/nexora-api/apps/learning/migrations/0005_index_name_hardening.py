from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0004_learning_quizattempt"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="learninglessoncompletion",
            new_name="learning_lesson_user_date_idx",
            old_name="learning_completion_user_date_idx",
        ),
        migrations.RenameIndex(
            model_name="learningquizattempt",
            new_name="learning_quiz_user_date_idx",
            old_name="learning_quiz_attempt_user_date_idx",
        ),
    ]
