import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("identity", "0001_initial"),
        ("nexverse", "0002_work_review_workflow"),
    ]

    operations = [
        migrations.CreateModel(
            name="NexverseModerator",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("role", models.CharField(
                    choices=[("reviewer", "Reviewer"), ("publisher", "Publisher"), ("admin", "Administrator")],
                    default="reviewer", max_length=16,
                )),
                ("is_active", models.BooleanField(default=True, db_index=True)),
                ("user", models.OneToOneField(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="nexverse_moderator",
                    to="identity.nexorauser",
                )),
            ],
            options={"db_table": "nexverse_moderators"},
        ),
        migrations.AddField(
            model_name="nexversework",
            name="reviewed_by",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="nexverse_reviewed_works",
                to="identity.nexorauser",
            ),
        ),
        migrations.CreateModel(
            name="NexverseReviewEvent",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("decision", models.CharField(
                    choices=[("approved", "Approved"), ("rejected", "Rejected")],
                    max_length=16,
                )),
                ("note", models.CharField(blank=True, max_length=1000)),
                ("moderator", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="review_events",
                    to="nexverse.nexversemoderator",
                )),
                ("work", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="review_events",
                    to="nexverse.nexversework",
                )),
            ],
            options={"db_table": "nexverse_review_events", "ordering": ("-created_at",)},
        ),
    ]
