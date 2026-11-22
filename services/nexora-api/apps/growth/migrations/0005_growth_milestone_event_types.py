from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("growth", "0004_growth_milestones_reviews"),
    ]

    operations = [
        migrations.AlterField(
            model_name="growthevidenceevent",
            name="event_type",
            field=models.CharField(max_length=40, choices=[
                ("goal.created", "Goal created"),
                ("goal.status_changed", "Goal status changed"),
                ("habit.created", "Habit created"),
                ("habit.check_in_recorded", "Habit check-in recorded"),
                ("habit.check_in_changed", "Habit check-in changed"),
                ("milestone.created", "Milestone created"),
                ("milestone.status_changed", "Milestone status changed"),
            ]),
        ),
    ]
