import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


def provision_academic_permissions(apps, schema_editor):
    Permission = apps.get_model("access", "Permission")
    Role = apps.get_model("access", "Role")
    RolePermission = apps.get_model("access", "RolePermission")

    read_permission, _ = Permission.objects.get_or_create(
        code="academic.read",
        defaults={
            "name": "Academic read",
            "description": "Read academic terms, programs, and classrooms.",
            "category": "academic",
            "is_system": True,
        },
    )
    manage_permission, _ = Permission.objects.get_or_create(
        code="academic.manage",
        defaults={
            "name": "Academic manage",
            "description": "Manage academic structure and enrollments.",
            "category": "academic",
            "is_system": True,
        },
    )
    for role in Role.objects.filter(slug__in=("owner", "admin", "member"), deleted_at__isnull=True):
        RolePermission.objects.get_or_create(role=role, permission=read_permission)
        if role.slug in ("owner", "admin"):
            RolePermission.objects.get_or_create(role=role, permission=manage_permission)


def remove_academic_permissions(apps, schema_editor):
    Permission = apps.get_model("access", "Permission")
    RolePermission = apps.get_model("access", "RolePermission")
    codes = ("academic.read", "academic.manage")
    RolePermission.objects.filter(permission__code__in=codes).delete()
    Permission.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("access", "0001_initial"),
        ("organizations", "0002_add_membership_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="AcademicProgram",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.CharField(max_length=32)),
                ("name", models.CharField(max_length=180, validators=[django.core.validators.MinLengthValidator(2)])),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_programs", to="organizations.organization")),
            ],
            options={"db_table": "academic_programs", "ordering": ("name",)},
        ),
        migrations.CreateModel(
            name="AcademicTerm",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.CharField(max_length=32)),
                ("name", models.CharField(max_length=120)),
                ("starts_on", models.DateField()),
                ("ends_on", models.DateField()),
                ("status", models.CharField(choices=[("draft", "Draft"), ("active", "Active"), ("closed", "Closed")], db_index=True, default="draft", max_length=12)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_terms", to="organizations.organization")),
            ],
            options={"db_table": "academic_terms", "ordering": ("-starts_on", "code")},
        ),
        migrations.CreateModel(
            name="AcademicClassroom",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.CharField(max_length=32)),
                ("name", models.CharField(max_length=180)),
                ("capacity", models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1)])),
                ("status", models.CharField(choices=[("draft", "Draft"), ("open", "Open"), ("in_progress", "In progress"), ("completed", "Completed"), ("cancelled", "Cancelled")], db_index=True, default="draft", max_length=16)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_classrooms", to="organizations.organization")),
                ("program", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="classrooms", to="academic.academicprogram")),
                ("term", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="classrooms", to="academic.academicterm")),
            ],
            options={"db_table": "academic_classrooms", "ordering": ("term__starts_on", "code")},
        ),
        migrations.CreateModel(
            name="AcademicEnrollment",
            fields=[
                ("id", models.UUIDField(default=__import__("uuid").uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("role", models.CharField(choices=[("student", "Student"), ("instructor", "Instructor")], default="student", max_length=16)),
                ("status", models.CharField(choices=[("active", "Active"), ("withdrawn", "Withdrawn"), ("completed", "Completed")], db_index=True, default="active", max_length=16)),
                ("classroom", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="enrollments", to="academic.academicclassroom")),
                ("membership", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="academic_enrollments", to="organizations.membership")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="academic_enrollments", to="organizations.organization")),
                ("term", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="enrollments", to="academic.academicterm")),
            ],
            options={"db_table": "academic_enrollments"},
        ),
        migrations.AddConstraint(
            model_name="academicprogram",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "code"), name="academic_program_org_code_unique"),
        ),
        migrations.AddIndex(
            model_name="academicprogram",
            index=models.Index(fields=["organization", "is_active"], name="acad_program_org_active_idx"),
        ),
        migrations.AddConstraint(
            model_name="academicterm",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "code"), name="academic_term_org_code_unique"),
        ),
        migrations.AddConstraint(
            model_name="academicterm",
            constraint=models.CheckConstraint(condition=models.Q(("ends_on__gte", models.F("starts_on"))), name="academic_term_valid_dates"),
        ),
        migrations.AddIndex(
            model_name="academicterm",
            index=models.Index(fields=["organization", "status"], name="academic_term_org_status_idx"),
        ),
        migrations.AddConstraint(
            model_name="academicclassroom",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("organization", "term", "code"), name="academic_class_org_term_code_unique"),
        ),
        migrations.AddIndex(
            model_name="academicclassroom",
            index=models.Index(fields=["organization", "term", "status"], name="academic_class_org_term_idx"),
        ),
        migrations.AddConstraint(
            model_name="academicenrollment",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True), ("status", "active")), fields=("classroom", "membership", "role"), name="academic_enrollment_active_unique"),
        ),
        migrations.AddIndex(
            model_name="academicenrollment",
            index=models.Index(fields=["organization", "term", "status"], name="academic_enroll_org_term_idx"),
        ),
        migrations.AddIndex(
            model_name="academicenrollment",
            index=models.Index(fields=["membership", "status"], name="acad_enroll_member_status_idx"),
        ),
        migrations.RunPython(provision_academic_permissions, remove_academic_permissions),
    ]
