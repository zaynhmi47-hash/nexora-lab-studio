from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("gamification", "0002_gamification_milestones"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="gamificationactivity",
            new_name="gamification_user_date_idx",
            old_name="gamification_activity_user_date_idx",
        ),
    ]
