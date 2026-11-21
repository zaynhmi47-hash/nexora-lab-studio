from django.db import migrations


def add_learning_mastery_assess_permission(apps, schema_editor):
    Permission = apps.get_model("access", "Permission")
    Role = apps.get_model("access", "Role")
    RolePermission = apps.get_model("access", "RolePermission")
    permission, _ = Permission.objects.get_or_create(
        code="learning.mastery.assess",
        defaults={
            "name": "Assess learning mastery",
            "description": "Record an explicit mastery assessment based on verified evidence.",
            "category": "learning",
            "is_system": True,
        },
    )
    assessor_roles = Role.objects.filter(
        slug__in=("owner", "admin"),
        deleted_at__isnull=True,
    )
    RolePermission.objects.bulk_create(
        [
            RolePermission(role_id=role_id, permission_id=permission.pk)
            for role_id in assessor_roles.values_list("id", flat=True)
        ],
        ignore_conflicts=True,
    )


def remove_learning_mastery_assess_permission(apps, schema_editor):
    Permission = apps.get_model("access", "Permission")
    Permission.objects.filter(code="learning.mastery.assess").delete()


class Migration(migrations.Migration):
    dependencies = [("access", "0003_learning_evidence_review_permission")]

    operations = [
        migrations.RunPython(
            add_learning_mastery_assess_permission,
            remove_learning_mastery_assess_permission,
        ),
    ]
