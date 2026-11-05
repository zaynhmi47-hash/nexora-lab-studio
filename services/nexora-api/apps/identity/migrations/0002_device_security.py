import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("identity", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="IdentityDevice",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("fingerprint_hash", models.CharField(max_length=64)),
                ("display_name", models.CharField(blank=True, max_length=80)),
                ("platform", models.CharField(choices=[("android", "Android"), ("ios", "iOS"), ("web", "Web"), ("desktop", "Desktop"), ("other", "Other")], default="other", max_length=16)),
                ("first_seen_at", models.DateTimeField()),
                ("last_seen_at", models.DateTimeField()),
                ("trusted_at", models.DateTimeField(blank=True, null=True)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="devices", to="identity.nexorauser")),
            ],
            options={"db_table": "identity_devices"},
        ),
        migrations.AddConstraint(
            model_name="identitydevice",
            constraint=models.UniqueConstraint(fields=("user", "fingerprint_hash"), name="identity_device_fingerprint_unique"),
        ),
        migrations.AddIndex(
            model_name="identitydevice",
            index=models.Index(fields=["user", "last_seen_at"], name="identity_device_user_seen_idx"),
        ),
        migrations.CreateModel(
            name="IdentityLoginEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("event_type", models.CharField(choices=[("device_registered", "Device registered"), ("device_seen", "Device seen"), ("device_trusted", "Device trusted"), ("device_revoked", "Device revoked"), ("all_sessions_revoked", "All sessions revoked")], db_index=True, max_length=32)),
                ("occurred_at", models.DateTimeField()),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("device", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="login_events", to="identity.identitydevice")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="login_events", to="identity.nexorauser")),
            ],
            options={"db_table": "identity_login_events", "ordering": ("-occurred_at",)},
        ),
        migrations.AddIndex(
            model_name="identityloginevent",
            index=models.Index(fields=["user", "occurred_at"], name="identity_login_user_time_idx"),
        ),
    ]
