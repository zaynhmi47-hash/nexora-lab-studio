from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0001_initial")]
    operations = [
        migrations.CreateModel(name="QuranSurah", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("number", models.PositiveSmallIntegerField(unique=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(114)])),
            ("name", models.CharField(max_length=100)), ("arabic_name", models.CharField(max_length=100)),
            ("revelation_place", models.CharField(choices=[("makkah", "Makkah"), ("madinah", "Madinah")], max_length=16)),
            ("ayah_count", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
        ], options={"db_table":"quran_surahs", "ordering":("number",)}),
        migrations.CreateModel(name="QuranRecitation", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("key", models.CharField(max_length=100, unique=True)), ("name", models.CharField(max_length=255)),
            ("language", models.CharField(max_length=16)), ("audio_url", models.URLField(blank=True, max_length=2048)),
            ("is_published", models.BooleanField(db_index=True, default=True)),
        ], options={"db_table":"quran_recitations", "ordering":("name",)}),
        migrations.CreateModel(name="QuranAyah", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("number_in_surah", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
            ("global_number", models.PositiveIntegerField(blank=True, null=True)), ("arabic_text", models.TextField()), ("translation", models.TextField(blank=True)),
            ("surah", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="ayahs", to="quran.quransurah")),
        ], options={"db_table":"quran_ayahs", "ordering":("surah", "number_in_surah")}),
        migrations.CreateModel(name="QuranReadingPosition", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("ayah_number", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
            ("surah", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="quran.quransurah")),
            ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="quran_reading_position", to="identity.nexorauser")),
        ], options={"db_table":"quran_reading_positions"}),
        migrations.CreateModel(name="QuranBookmark", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)), ("note", models.TextField(blank=True)),
            ("ayah", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookmarks", to="quran.quranayah")),
            ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="quran_bookmarks", to="identity.nexorauser")),
        ], options={"db_table":"quran_bookmarks"}),
        migrations.AddConstraint(model_name="quranayah", constraint=models.UniqueConstraint(fields=("surah", "number_in_surah"), name="quran_surah_ayah_unique")),
        migrations.AddConstraint(model_name="quranbookmark", constraint=models.UniqueConstraint(fields=("user", "ayah"), name="quran_user_ayah_bookmark_unique")),
        migrations.AddIndex(model_name="quranbookmark", index=models.Index(fields=("user", "created_at"), name="quran_bookmark_user_date_idx")),
    ]
