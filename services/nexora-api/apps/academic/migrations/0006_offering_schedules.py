import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("academic", "0005_prerequisite_rules"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicOfferingSchedule",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("weekday", models.PositiveSmallIntegerField(choices=[(0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"), (4, "Friday"), (5, "Saturday"), (6, "Sunday")])),
                ("starts_at", models.TimeField()),
                ("ends_at", models.TimeField()),
                ("location_label", models.CharField(blank=True, max_length=120)),
                ("delivery_details", models.CharField(blank=True, max_length=240)),
                ("offering", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="schedule_slots", to="academic.academiccourseoffering")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_offering_schedules", to="organizations.organization")),
            ],
            options={"db_table": "academic_offering_schedules", "ordering": ("weekday", "starts_at")},
        ),
        migrations.AddConstraint(
            model_name="academicofferingschedule",
            constraint=models.CheckConstraint(condition=models.Q(("ends_at__gt", models.F("starts_at"))), name="academic_schedule_valid_time_range"),
        ),
        migrations.AddConstraint(
            model_name="academicofferingschedule",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "offering", "weekday", "starts_at", "ends_at"), name="academic_schedule_slot_unique"),
        ),
        migrations.AddIndex(
            model_name="academicofferingschedule",
            index=models.Index(fields=["organization", "weekday", "starts_at"], name="acad_schedule_day_start_idx"),
        ),
        migrations.AddIndex(
            model_name="academicofferingschedule",
            index=models.Index(fields=["offering", "weekday"], name="acad_schedule_offering_day_idx"),
        ),
    ]
