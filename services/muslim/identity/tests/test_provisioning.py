from services.muslim.identity.provisioning import IdentityProvisioningService
from services.muslim.identity.repository import InMemoryIdentityRepository
from services.muslim.identity.transaction import InMemoryIdentityTransactionManager


def test_first_login_creates_internal_uuid_and_provider_link() -> None:
    repository = InMemoryIdentityRepository()
    service = IdentityProvisioningService(
        repository,
        InMemoryIdentityTransactionManager(),
    )

    result = service.provision_or_resolve(
        provider="firebase",
        provider_subject="firebase-uid-1",
    )

    assert result.created is True
    assert result.identity.user_id != "firebase-uid-1"
    assert repository.get_user_id_by_provider_subject(
        provider="firebase",
        provider_subject="firebase-uid-1",
    ) == result.identity.user_id


def test_repeated_first_login_resolves_same_identity() -> None:
    repository = InMemoryIdentityRepository()
    service = IdentityProvisioningService(
        repository,
        InMemoryIdentityTransactionManager(),
    )

    first = service.provision_or_resolve(
        provider="firebase",
        provider_subject="firebase-uid-1",
    )
    second = service.provision_or_resolve(
        provider="firebase",
        provider_subject="firebase-uid-1",
    )

    assert first.created is True
    assert second.created is False
    assert first.identity.user_id == second.identity.user_id


def test_concurrent_first_login_serializes_to_one_identity() -> None:
    from concurrent.futures import ThreadPoolExecutor

    repository = InMemoryIdentityRepository()
    service = IdentityProvisioningService(
        repository,
        InMemoryIdentityTransactionManager(),
    )

    def resolve():
        return service.provision_or_resolve(
            provider="firebase",
            provider_subject="firebase-uid-concurrent",
        )

    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(lambda _index: resolve(), range(8)))

    user_ids = {result.identity.user_id for result in results}

    assert len(user_ids) == 1
    assert sum(result.created for result in results) == 1
    assert repository.get_user_id_by_provider_subject(
        provider="firebase",
        provider_subject="firebase-uid-concurrent",
    ) in user_ids
