from django.db import migrations


def add_academic_grade_permission(apps, schema_editor):
    Permission = apps.get_model("access", "Permission")
    Role = apps.get_model("access", "Role")
    RolePermission = apps.get_model("access", "RolePermission")
    permission, _ = Permission.objects.get_or_create(
        code="academic.grade",
        defaults={
            "name": "Academic grade",
            "description": "Record and publish grades for assigned classrooms.",
            "category": "academic",
            "is_system": True,
        },
    )
    member_roles = Role.objects.filter(slug__in=("owner", "admin", "member"), deleted_at__isnull=True)
    RolePermission.objects.bulk_create(
        [
            RolePermission(role_id=role_id, permission_id=permission.pk)
            for role_id in member_roles.values_list("id", flat=True)
        ],
        ignore_conflicts=True,
    )


def remove_academic_grade_permission(apps, schema_editor):
    Permission = apps.get_model("access", "Permission")
    Permission.objects.filter(code="academic.grade").delete()


class Migration(migrations.Migration):
    dependencies = [("access", "0001_initial")]

    operations = [
        migrations.RunPython(add_academic_grade_permission, remove_academic_grade_permission),
    ]
