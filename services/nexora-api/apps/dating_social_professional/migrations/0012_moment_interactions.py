import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("dating_social_professional", "0011_dating_moments"),
        ("identity", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DatingMomentReaction",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("moment", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="reactions", to="dating_social_professional.datingmoment")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_moment_reactions", to="identity.nexorauser")),
            ],
            options={"db_table": "dating_moment_reactions"},
        ),
        migrations.AddConstraint(
            model_name="datingmomentreaction",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("moment", "user"), name="dating_moment_reaction_active_unique"),
        ),
        migrations.AddIndex(
            model_name="datingmomentreaction",
            index=models.Index(fields=["moment", "created_at"], name="dating_moment_reaction_idx"),
        ),
        migrations.CreateModel(
            name="DatingMomentComment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("body", models.TextField(max_length=2000)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="dating_moment_comments", to="identity.nexorauser")),
                ("moment", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="comments", to="dating_social_professional.datingmoment")),
                ("parent", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="replies", to="dating_social_professional.datingmomentcomment")),
            ],
            options={"db_table": "dating_moment_comments", "ordering": ("created_at",)},
        ),
        migrations.AddIndex(
            model_name="datingmomentcomment",
            index=models.Index(fields=["moment", "created_at"], name="dating_moment_comment_idx"),
        ),
        migrations.AddIndex(
            model_name="datingmomentcomment",
            index=models.Index(fields=["parent", "created_at"], name="dating_moment_reply_idx"),
        ),
    ]
