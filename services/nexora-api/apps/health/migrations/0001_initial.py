import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [("identity", "0003_login_verified_event")]
    operations = [
        migrations.CreateModel(
            name="HealthProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("display_name", models.CharField(max_length=120)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                ("status", models.CharField(choices=[("active", "Active"), ("archived", "Archived")], default="active", max_length=16)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="owned_health_profiles", to="identity.nexorauser")),
            ],
            options={"db_table": "health_profiles", "ordering": ("created_at",)},
        ),
        migrations.CreateModel(
            name="HealthProfileMember",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("role", models.CharField(choices=[("owner", "Owner"), ("caregiver", "Caregiver"), ("clinician", "Clinician"), ("viewer", "Viewer")], default="viewer", max_length=16)),
                ("scopes", models.JSONField(blank=True, default=list)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("granted_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="health_access_grants_issued", to="identity.nexorauser")),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="members", to="health.healthprofile")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="health_memberships", to="identity.nexorauser")),
            ],
            options={"db_table": "health_profile_members"},
        ),
        migrations.CreateModel(
            name="HealthConsent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("purpose", models.CharField(max_length=80)),
                ("scopes", models.JSONField(default=list)),
                ("policy_version", models.CharField(max_length=32)),
                ("status", models.CharField(choices=[("granted", "Granted"), ("revoked", "Revoked"), ("expired", "Expired")], default="granted", max_length=16)),
                ("granted_at", models.DateTimeField()),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("grantee", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="health_consents_as_grantee", to="identity.nexorauser")),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="consents", to="health.healthprofile")),
                ("subject", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="health_consents_as_subject", to="identity.nexorauser")),
            ],
            options={"db_table": "health_consents"},
        ),
        migrations.AddConstraint(
            model_name="healthprofilemember",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("profile", "user"), name="uq_health_profile_member"),
        ),
        migrations.AddIndex(model_name="healthprofile", index=models.Index(fields=["owner", "status"], name="health_pro_owner__c8b7e0_idx")),
        migrations.AddIndex(model_name="healthprofilemember", index=models.Index(fields=["user", "revoked_at"], name="health_pro_user_i_28a3c1_idx")),
        migrations.AddIndex(model_name="healthconsent", index=models.Index(fields=["profile", "grantee", "status"], name="health_con_profile_5c54f2_idx")),
        migrations.AddIndex(model_name="healthconsent", index=models.Index(fields=["subject", "purpose", "status"], name="health_con_subject_8e2a1d_idx")),
    ]
