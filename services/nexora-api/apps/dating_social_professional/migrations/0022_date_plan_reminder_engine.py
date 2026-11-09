import uuid

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0021_date_plan_lifecycle_reschedule"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="datingdateplan",
            name="reminder_version",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="datingnotificationpreference",
            name="date_plan_push_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.CreateModel(
            name="DatingDatePlanReminder",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("reminder_type", models.CharField(choices=[("one_day", "24 hours before"), ("one_hour", "1 hour before")], max_length=16)),
                ("schedule_version", models.PositiveIntegerField(default=0)),
                ("scheduled_for", models.DateTimeField(db_index=True)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("processing", "Processing"), ("sent", "Sent"), ("failed", "Failed"), ("cancelled", "Cancelled")], db_index=True, default="pending", max_length=16)),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("available_at", models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ("locked_at", models.DateTimeField(blank=True, null=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("last_error", models.CharField(blank=True, max_length=500)),
                ("date_plan", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reminders", to="dating_social_professional.datingdateplan")),
                ("recipient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="dating_date_plan_reminders", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_date_plan_reminders"},
        ),
        migrations.AddConstraint(
            model_name="datingdateplanreminder",
            constraint=models.UniqueConstraint(fields=("date_plan", "recipient", "reminder_type", "schedule_version"), name="dating_plan_reminder_version_unique"),
        ),
        migrations.AddIndex(
            model_name="datingdateplanreminder",
            index=models.Index(fields=["status", "available_at"], name="dating_plan_reminder_queue_idx"),
        ),
    ]
