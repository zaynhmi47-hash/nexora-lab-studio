import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatingProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("display_name", models.CharField(max_length=120)),
                ("birth_date", models.DateField(blank=True, null=True)),
                ("bio", models.TextField(blank=True, max_length=2000)),
                ("photo_url", models.URLField(blank=True, max_length=2048)),
                ("relationship_intent", models.CharField(blank=True, choices=[("dating", "Dating"), ("relationship", "Relationship"), ("friendship", "Friendship")], max_length=32)),
                ("discovery_enabled", models.BooleanField(db_index=True, default=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="dating_profile", to="identity.nexorauser")),
            ],
            options={
                "db_table": "dating_profiles",
            },
        ),
        migrations.CreateModel(
            name="DatingSwipe",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("action", models.CharField(choices=[("like", "Like"), ("pass", "Pass")], max_length=16)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_swipes_sent", to="identity.nexorauser")),
                ("target", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="swipes_received", to="dating_social_professional.datingprofile")),
            ],
            options={
                "db_table": "dating_swipes",
            },
        ),
        migrations.CreateModel(
            name="DatingMatch",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("matched_at", models.DateTimeField(auto_now_add=True)),
                ("active", models.BooleanField(db_index=True, default=True)),
                ("user_a", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_matches_a", to="identity.nexorauser")),
                ("user_b", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_matches_b", to="identity.nexorauser")),
            ],
            options={
                "db_table": "dating_matches",
            },
        ),
        migrations.AddIndex(
            model_name="datingprofile",
            index=models.Index(fields=["discovery_enabled", "updated_at"], name="dating_prof_discover_5e8f6f_idx"),
        ),
        migrations.AddConstraint(
            model_name="datingswipe",
            constraint=models.UniqueConstraint(fields=("actor", "target"), name="dating_swipe_actor_target_unique"),
        ),
        migrations.AddIndex(
            model_name="datingswipe",
            index=models.Index(fields=["actor", "created_at"], name="dating_swipe_actor_6d8d31_idx"),
        ),
        migrations.AddIndex(
            model_name="datingswipe",
            index=models.Index(fields=["target", "action"], name="dating_swipe_target_1d6db0_idx"),
        ),
        migrations.AddConstraint(
            model_name="datingmatch",
            constraint=models.UniqueConstraint(fields=("user_a", "user_b"), name="dating_match_pair_unique"),
        ),
        migrations.AddIndex(
            model_name="datingmatch",
            index=models.Index(fields=["user_a", "active"], name="dating_match_user_a_7e1c1f_idx"),
        ),
        migrations.AddIndex(
            model_name="datingmatch",
            index=models.Index(fields=["user_b", "active"], name="dating_match_user_b_7a9c5d_idx"),
        ),
    ]
