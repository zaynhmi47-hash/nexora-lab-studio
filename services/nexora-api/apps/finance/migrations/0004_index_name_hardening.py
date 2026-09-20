from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0003_financegoal_financegoalcontribution"),
    ]

    operations = [
        migrations.RenameIndex(
            model_name="financegoalcontribution",
            new_name="finance_goal_period_idx",
            old_name="finance_goal_contrib_period_idx",
        ),
        migrations.RenameIndex(
            model_name="financegoalcontribution",
            new_name="finance_goal_status_idx",
            old_name="finance_goal_contrib_status_idx",
        ),
    ]
