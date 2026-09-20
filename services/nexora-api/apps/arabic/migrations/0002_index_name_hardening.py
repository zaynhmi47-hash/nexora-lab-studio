from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("arabic", "0001_initial"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="arabiclessoncompletion",
            new_name="arabic_lesson_user_date_idx",
            old_name="arabic_completion_user_date_idx",
        ),
    ]
