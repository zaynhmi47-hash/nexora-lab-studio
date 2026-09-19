from django.db import migrations


def seed_achievements(apps, schema_editor):
    Achievement = apps.get_model("learning", "LearningAchievement")
    rows = [
        ("first-lesson", "First Step", "Complete your first learning lesson.", 0, 0, 1),
        ("xp-100", "100 XP", "Reach 100 XP through learning.", 100, 0, 0),
        ("streak-7", "Seven Day Streak", "Maintain a seven day learning streak.", 0, 7, 0),
        ("xp-500", "Learning Momentum", "Reach 500 XP through learning.", 500, 0, 0),
        ("lessons-10", "Ten Lessons", "Complete ten learning lessons.", 0, 0, 10),
    ]
    for key, title, description, xp, streak, lessons in rows:
        Achievement.objects.update_or_create(
            key=key,
            defaults={
                "title": title,
                "description": description,
                "xp_threshold": xp,
                "streak_threshold": streak,
                "lesson_threshold": lessons,
                "is_published": True,
            },
        )


def remove_achievements(apps, schema_editor):
    Achievement = apps.get_model("learning", "LearningAchievement")
    Achievement.objects.filter(key__in=["first-lesson", "xp-100", "streak-7", "xp-500", "lessons-10"]).delete()


class Migration(migrations.Migration):
    dependencies = [("learning", "0002_achievements")]
    operations = [migrations.RunPython(seed_achievements, remove_achievements)]
