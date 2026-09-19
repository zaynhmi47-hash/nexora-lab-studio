from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="GamificationActivity",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("source", models.CharField(choices=[("learning", "Learning"), ("tajwid", "Tajwid"), ("arabic", "Arabic")], max_length=32)),
                ("action", models.CharField(max_length=64)),
                ("source_key", models.CharField(max_length=150)),
                ("xp_earned", models.PositiveIntegerField(default=0)),
                ("occurred_at", models.DateTimeField()),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="gamification_activities", to="identity.nexorauser")),
            ],
            options={
                "db_table": "gamification_activities",
                "indexes": [
                    models.Index(fields=["user", "-occurred_at"], name="gamification_activity_user_date_idx"),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="gamificationactivity",
            constraint=models.UniqueConstraint(
                fields=("user", "source", "action", "source_key"),
                name="gamification_activity_unique",
            ),
        ),
    ]
