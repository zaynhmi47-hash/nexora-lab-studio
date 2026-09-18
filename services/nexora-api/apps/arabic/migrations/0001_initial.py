import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0001_initial")]
    operations = [
        migrations.CreateModel(name="ArabicPath", fields=[
            ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)), ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("key", models.SlugField(max_length=80, unique=True)), ("title", models.CharField(max_length=255)), ("description", models.TextField(blank=True)), ("sort_order", models.PositiveIntegerField(unique=True)), ("is_published", models.BooleanField(db_index=True, default=True))], options={"db_table":"arabic_paths","ordering":("sort_order",)}),
        migrations.CreateModel(name="ArabicLesson", fields=[
            ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)), ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("key", models.SlugField(max_length=100, unique=True)), ("title", models.CharField(max_length=255)), ("description", models.TextField(blank=True)), ("kind", models.CharField(choices=[("vocabulary","Vocabulary"),("phrase","Phrase"),("practice","Practice")], default="vocabulary", max_length=20)), ("sort_order", models.PositiveIntegerField()), ("xp_reward", models.PositiveIntegerField(default=10)), ("is_published", models.BooleanField(db_index=True, default=True)), ("path", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="lessons", to="arabic.arabicpath"))], options={"db_table":"arabic_lessons","ordering":("path","sort_order")}),
        migrations.CreateModel(name="ArabicPracticeItem", fields=[
            ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)), ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("key", models.SlugField(max_length=120, unique=True)), ("prompt", models.TextField()), ("options", models.JSONField(default=list)), ("correct_option_index", models.PositiveIntegerField(default=0)), ("explanation", models.TextField(blank=True)), ("sort_order", models.PositiveIntegerField(default=0)), ("lesson", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="practice_items", to="arabic.arabiclesson"))], options={"db_table":"arabic_practice_items","ordering":("lesson","sort_order")}),
        migrations.CreateModel(name="ArabicProgress", fields=[
            ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)), ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("xp_earned", models.PositiveIntegerField(default=0)), ("current_streak", models.PositiveIntegerField(default=0)), ("last_completed_at", models.DateTimeField(blank=True, null=True)), ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="arabic_progress", to="identity.nexorauser"))], options={"db_table":"arabic_progress"}),
        migrations.CreateModel(name="ArabicLessonCompletion", fields=[
            ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)), ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("completed_at", models.DateTimeField()), ("lesson", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="completions", to="arabic.arabiclesson")), ("user", models.ForeignKey(on_delete=django.db.models.CASCADE, related_name="arabic_lesson_completions", to="identity.nexorauser"))], options={"db_table":"arabic_lesson_completions"}),
        migrations.AddConstraint(model_name="arabiclesson", constraint=models.UniqueConstraint(fields=("path","sort_order"), name="arabic_path_lesson_order_unique")),
        migrations.AddConstraint(model_name="arabicpracticeitem", constraint=models.UniqueConstraint(fields=("lesson","sort_order"), name="arabic_lesson_practice_order_unique")),
        migrations.AddConstraint(model_name="arabiclessoncompletion", constraint=models.UniqueConstraint(fields=("user","lesson"), name="arabic_user_lesson_completion_unique")),
        migrations.AddIndex(model_name="arabiclessoncompletion", index=models.Index(fields=("user","completed_at"), name="arabic_completion_user_date_idx")),
    ]
