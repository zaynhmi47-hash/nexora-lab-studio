from django.db import transaction

from apps.access.models import Permission, Role, RolePermission

DEFAULT_PERMISSIONS = {
    "organization.read": ("Organization read", "Read organization details."),
    "organization.update": ("Organization update", "Update organization details."),
    "organization.members.read": ("Read members", "Read organization members."),
    "organization.members.manage": ("Manage members", "Manage organization memberships."),
    "organization.roles.read": ("Read roles", "Read organization roles."),
    "organization.roles.manage": ("Manage roles", "Manage organization roles."),
    "finance.transactions.read": ("Finance transaction read", "Read organization finance transactions."),
    "finance.transactions.create": ("Finance transaction create", "Create organization finance transactions."),
}

ROLE_PERMISSIONS = {
    "owner": set(DEFAULT_PERMISSIONS),
    "admin": {
        "organization.read",
        "organization.update",
        "organization.members.read",
        "organization.members.manage",
        "organization.roles.read",
        "finance.transactions.read",
        "finance.transactions.create",
    },
    "member": {"organization.read"},
}


@transaction.atomic
def provision_organization_access(organization):
    permissions = {
        code: Permission.objects.get_or_create(
            code=code,
            defaults={"name": name, "description": description, "category": code.split(".", 1)[0], "is_system": True},
        )[0]
        for code, (name, description) in DEFAULT_PERMISSIONS.items()
    }
    roles = {}
    for slug, codes in ROLE_PERMISSIONS.items():
        role, _ = Role.objects.get_or_create(
            organization=organization,
            slug=slug,
            defaults={"name": slug.title(), "is_system": True},
        )
        RolePermission.objects.bulk_create(
            [RolePermission(role=role, permission=permissions[code]) for code in codes],
            ignore_conflicts=True,
        )
        roles[slug] = role
    return roles
