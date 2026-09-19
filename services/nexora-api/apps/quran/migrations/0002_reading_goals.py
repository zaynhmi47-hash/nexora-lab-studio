from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [("quran", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="QuranReadingGoal",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("daily_target_pages", models.PositiveSmallIntegerField(default=4, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(604)])),
                ("daily_target_minutes", models.PositiveSmallIntegerField(default=15, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(1440)])),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="quran_reading_goal", to="identity.nexorauser")),
            ],
            options={"db_table": "quran_reading_goals"},
        ),
        migrations.CreateModel(
            name="QuranReadingLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("date", models.DateField()),
                ("pages", models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MaxValueValidator(604)])),
                ("minutes", models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MaxValueValidator(1440)])),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="quran_reading_logs", to="identity.nexorauser")),
            ],
            options={"db_table": "quran_reading_logs", "ordering": ("-date",)},
        ),
        migrations.AddConstraint(
            model_name="quranreadinglog",
            constraint=models.UniqueConstraint(fields=("user", "date"), name="quran_user_reading_date_unique"),
        ),
        migrations.AddIndex(
            model_name="quranreadinglog",
            index=models.Index(fields=("user", "-date"), name="quran_reading_user_date_idx"),
        ),
    ]
