from apps.access.services.authorization import authorize


class OrganizationPolicy:
    @staticmethod
    def can_read(*, user, organization):
        return authorize(user=user, organization=organization, permission_code="organization.read")
