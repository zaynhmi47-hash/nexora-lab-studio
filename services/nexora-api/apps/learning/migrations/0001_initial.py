# Generated for the Nexora learning domain.
import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="LearningCourse",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.CharField(db_index=True, max_length=100, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("level", models.PositiveIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)])),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(db_index=True, default=True)),
            ],
            options={"db_table": "learning_courses", "ordering": ("sort_order", "title")},
        ),
        migrations.CreateModel(
            name="LearningLesson",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.CharField(db_index=True, max_length=100, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("kind", models.CharField(choices=[("lesson", "Lesson"), ("quiz", "Quiz"), ("practice", "Practice")], default="lesson", max_length=16)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("xp_reward", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(db_index=True, default=True)),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="lessons", to="learning.learningcourse")),
            ],
            options={"db_table": "learning_lessons", "ordering": ("course", "sort_order")},
        ),
        migrations.CreateModel(
            name="LearningProgress",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("xp", models.PositiveIntegerField(default=0)),
                ("level", models.PositiveIntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)])),
                ("current_streak", models.PositiveIntegerField(default=0)),
                ("last_completed_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="learning_progress", to="identity.nexorauser")),
            ],
            options={"db_table": "learning_progress"},
        ),
        migrations.CreateModel(
            name="LearningLessonCompletion",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("completed_at", models.DateTimeField()),
                ("lesson", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="completions", to="learning.learninglesson")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="learning_completions", to="identity.nexorauser")),
            ],
            options={"db_table": "learning_lesson_completions"},
        ),
        migrations.CreateModel(
            name="LearningQuizQuestion",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("key", models.CharField(db_index=True, max_length=100, unique=True)),
                ("prompt", models.TextField()),
                ("options", models.JSONField(default=list)),
                ("correct_option_index", models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(0)])),
                ("explanation", models.TextField(blank=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("lesson", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="quiz_questions", to="learning.learninglesson")),
            ],
            options={"db_table": "learning_quiz_questions", "ordering": ("sort_order",)},
        ),
        migrations.AddConstraint(
            model_name="learninglesson",
            constraint=models.UniqueConstraint(fields=("course", "sort_order"), name="learning_course_lesson_order_unique"),
        ),
        migrations.AddConstraint(
            model_name="learninglessoncompletion",
            constraint=models.UniqueConstraint(fields=("user", "lesson"), name="learning_user_lesson_completion_unique"),
        ),
        migrations.AddConstraint(
            model_name="learningquizquestion",
            constraint=models.UniqueConstraint(fields=("lesson", "sort_order"), name="learning_quiz_question_order_unique"),
        ),
        migrations.AddIndex(
            model_name="learninglessoncompletion",
            index=models.Index(fields=("user", "completed_at"), name="learning_completion_user_date_idx"),
        ),
    ]
