from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.access.services import authorize
from apps.core.exceptions import ValidationException
from apps.finance.models import Transaction
from apps.finance.services import FinanceService
from apps.identity.models import NexoraUser
from apps.organizations.services import MembershipService, OrganizationService


def make_user(email: str) -> NexoraUser:
    return NexoraUser.objects.create(email=email, display_name=email.split("@")[0], status=NexoraUser.Status.ACTIVE)


@pytest.mark.django_db
def test_finance_transactions_are_scoped_to_active_membership():
    owner = make_user("owner@example.com")
    other = make_user("other@example.com")
    own_org = OrganizationService.create_organization(name="Own Org", created_by=owner)
    other_org = OrganizationService.create_organization(name="Other Org", created_by=other)

    own_transaction = FinanceService.create_transaction(
        user=owner,
        organization_id=own_org.id,
        transaction_type=Transaction.TransactionType.INCOME,
        amount=Decimal("100000"),
        currency="IDR",
        category="Sales",
        description="Own sale",
        occurred_at=timezone.now(),
    )
    FinanceService.create_transaction(
        user=other,
        organization_id=other_org.id,
        transaction_type=Transaction.TransactionType.INCOME,
        amount=Decimal("900000"),
        currency="IDR",
        category="Sales",
        description="Other sale",
        occurred_at=timezone.now() - timedelta(minutes=1),
    )

    assert list(FinanceService.list_transactions(user=owner, organization_id=own_org.id)) == [own_transaction]
    assert list(FinanceService.list_transactions(user=owner, organization_id=other_org.id)) == []


@pytest.mark.django_db
def test_member_can_read_but_cannot_create_finance_transaction():
    owner = make_user("owner@example.com")
    member = make_user("member@example.com")
    organization = OrganizationService.create_organization(name="Shared Org", created_by=owner)
    membership = MembershipService.add_user(user=member, organization_id=organization.id)

    assert authorize(user=member, organization=organization, permission_code="finance.transactions.read").allowed is True
    assert authorize(user=member, organization=organization, permission_code="finance.transactions.create").allowed is False
    assert membership.status == "active"


@pytest.mark.django_db
def test_invalid_finance_transaction_is_rejected():
    owner = make_user("owner@example.com")
    organization = OrganizationService.create_organization(name="Validation Org", created_by=owner)

    with pytest.raises(ValidationException):
        FinanceService.create_transaction(
            user=owner,
            organization_id=organization.id,
            transaction_type="income",
            amount=Decimal("0"),
            currency="IDR",
            category="Sales",
            description="Invalid",
            occurred_at=timezone.now(),
        )
